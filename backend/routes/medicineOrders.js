const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const MedicineOrder = require('../models/MedicineOrder');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');

// Create medicine order from prescription
router.post('/create', auth, async (req, res) => {
  try {
    const { prescriptionId, pharmacyId, items, deliveryAddress, deliveryMethod } = req.body;
    const patientId = req.user.id;

    // Verify prescription belongs to patient
    const prescription = await Prescription.findOne({
      prescriptionId: prescriptionId,
      patientId: patientId,
      status: 'active'
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or expired' });
    }

    // Verify pharmacy exists
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine || medicine.pharmacyId.toString() !== pharmacyId) {
        return res.status(400).json({ message: `Medicine ${item.name} not available at this pharmacy` });
      }

      if (medicine.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }

      const total = medicine.price * item.quantity;
      subtotal += total;

      orderItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        quantity: item.quantity,
        price: medicine.price,
        total: total
      });
    }

    const deliveryFee = pharmacy.deliveryFee || 0;
    const totalAmount = subtotal + deliveryFee;

    // Create medicine order
    const medicineOrder = new MedicineOrder({
      orderId: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: patientId,
      pharmacyId: pharmacyId,
      prescriptionId: prescription._id,
      items: orderItems,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      totalAmount: totalAmount,
      deliveryAddress: deliveryAddress,
      deliveryMethod: deliveryMethod
    });

    await medicineOrder.save();

    // Emit real-time event for pharmacy
    req.app.get('io').emit('medicine-order-created', {
      pharmacyId: pharmacyId,
      orderId: medicineOrder.orderId,
      patientId: patientId
    });

    res.json({
      success: true,
      message: 'Medicine order created successfully',
      order: medicineOrder
    });

  } catch (error) {
    console.error('Error creating medicine order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get medicine orders for patient
router.get('/patient', auth, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { patientId: patientId };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await MedicineOrder.find(query)
      .populate('pharmacyId', 'name address')
      .populate('prescriptionId', 'diagnosis')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MedicineOrder.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching patient medicine orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get medicine orders for pharmacy
router.get('/pharmacy', auth, async (req, res) => {
  try {
    const pharmacyId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { pharmacyId: pharmacyId };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await MedicineOrder.find(query)
      .populate('patientId', 'name phone')
      .populate('prescriptionId', 'diagnosis')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MedicineOrder.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching pharmacy medicine orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get medicine order by ID
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await MedicineOrder.findOne({
      orderId: orderId
    })
      .populate('patientId', 'name phone')
      .populate('pharmacyId', 'name address phone')
      .populate('prescriptionId', 'diagnosis medicines');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has access to this order
    if (order.patientId._id.toString() !== userId && 
        order.pharmacyId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('Error fetching medicine order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status (Pharmacy only)
router.patch('/:orderId/status', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, estimatedDelivery, notes } = req.body;
    const pharmacyId = req.user.id;

    const order = await MedicineOrder.findOne({
      orderId: orderId,
      pharmacyId: pharmacyId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    order.orderStatus = orderStatus;
    if (estimatedDelivery) {
      order.estimatedDelivery = new Date(estimatedDelivery);
    }
    if (notes) {
      order.notes = notes;
    }

    await order.save();

    // Emit real-time event for patient
    req.app.get('io').emit('medicine-order-status-updated', {
      patientId: order.patientId,
      orderId: orderId,
      orderStatus: orderStatus,
      estimatedDelivery: order.estimatedDelivery
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel order (Patient only)
router.patch('/:orderId/cancel', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const patientId = req.user.id;

    const order = await MedicineOrder.findOne({
      orderId: orderId,
      patientId: patientId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'pending' && order.orderStatus !== 'confirmed') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    // Emit real-time event for pharmacy
    req.app.get('io').emit('medicine-order-cancelled', {
      pharmacyId: order.pharmacyId,
      orderId: orderId,
      patientId: patientId
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: order
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
