const express = require('express');
const { body, validationResult } = require('express-validator');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const { auth, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Get pharmacies by city
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { delivery } = req.query;

    let query = { city, isOpen: true };
    if (delivery === 'true') {
      query.deliveryAvailable = true;
    }

    const pharmacies = await Pharmacy.find(query)
      .select('-licenseNumber -ownerName')
      .sort('rating');

    res.json(pharmacies);
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({ error: 'Failed to fetch pharmacies' });
  }
});

// Get pharmacy details
router.get('/:pharmacyId', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    
    const pharmacy = await Pharmacy.findById(pharmacyId)
      .select('-licenseNumber -ownerName');

    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    res.json(pharmacy);
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    res.status(500).json({ error: 'Failed to fetch pharmacy details' });
  }
});

// Search medicines
router.get('/medicines/search', async (req, res) => {
  try {
    const { q, category, dosageForm } = req.query;

    let query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (dosageForm) {
      query.dosageForm = dosageForm;
    }

    const medicines = await Medicine.find(query)
      .select('-sideEffects -contraindications -activeIngredients')
      .limit(50);

    res.json(medicines);
  } catch (error) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ error: 'Failed to search medicines' });
  }
});

// Get medicine categories
router.get('/medicines/categories', async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get dosage forms
router.get('/medicines/dosage-forms', async (req, res) => {
  try {
    const dosageForms = await Medicine.distinct('dosageForm');
    res.json(dosageForms);
  } catch (error) {
    console.error('Error fetching dosage forms:', error);
    res.status(500).json({ error: 'Failed to fetch dosage forms' });
  }
});

// Get medicine details
router.get('/medicines/:medicineId', async (req, res) => {
  try {
    const { medicineId } = req.params;
    
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ error: 'Failed to fetch medicine details' });
  }
});

// Calculate delivery distance and fee
router.post('/calculate-delivery', [
  body('pharmacyId').isMongoId().withMessage('Valid pharmacy ID is required'),
  body('patientLatitude').isFloat().withMessage('Valid latitude is required'),
  body('patientLongitude').isFloat().withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pharmacyId, patientLatitude, patientLongitude } = req.body;

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      patientLatitude,
      patientLongitude,
      pharmacy.coordinates.latitude,
      pharmacy.coordinates.longitude
    );

    // Check if within delivery radius
    if (distance > pharmacy.deliveryRadius) {
      return res.status(400).json({ 
        error: 'Address is outside delivery radius',
        distance: Math.round(distance * 100) / 100,
        maxRadius: pharmacy.deliveryRadius
      });
    }

    // Calculate delivery fee based on distance
    let deliveryFee = pharmacy.deliveryFee;
    if (distance > 5) { // Additional fee for distances > 5km
      deliveryFee += Math.ceil(distance - 5) * 2; // $2 per additional km
    }

    res.json({
      distance: Math.round(distance * 100) / 100,
      deliveryFee,
      estimatedTime: Math.ceil(distance * 3) + 15 // 3 min per km + 15 min base
    });
  } catch (error) {
    console.error('Error calculating delivery:', error);
    res.status(500).json({ error: 'Failed to calculate delivery' });
  }
});

// Place medicine order
router.post('/order', requirePatient, [
  body('pharmacyId').isMongoId().withMessage('Valid pharmacy ID is required'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.medicineId').isMongoId().withMessage('Valid medicine ID is required'),
  body('medicines.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
  body('deliveryType').isIn(['delivery', 'pickup']).withMessage('Invalid delivery type'),
  body('patientLatitude').optional().isFloat(),
  body('patientLongitude').optional().isFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      pharmacyId,
      medicines,
      deliveryAddress,
      deliveryType,
      patientLatitude,
      patientLongitude,
      prescriptionImage
    } = req.body;

    const patientId = req.user._id;

    // Validate pharmacy
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy || !pharmacy.isOpen) {
      return res.status(400).json({ error: 'Pharmacy is not available' });
    }

    // Validate medicines and check prescription requirements
    let totalAmount = 0;
    let requiresPrescription = false;

    for (const item of medicines) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(400).json({ error: `Medicine ${item.medicineId} not found` });
      }

      if (medicine.prescriptionRequired && !prescriptionImage) {
        requiresPrescription = true;
      }

      // Calculate total amount (you would typically get price from inventory)
      totalAmount += item.quantity * 10; // Placeholder price
    }

    if (requiresPrescription) {
      return res.status(400).json({ 
        error: 'Prescription required for some medicines',
        requiresPrescription: true
      });
    }

    // Calculate delivery fee if delivery
    let deliveryFee = 0;
    let estimatedDeliveryTime = 0;

    if (deliveryType === 'delivery') {
      if (!patientLatitude || !patientLongitude) {
        return res.status(400).json({ error: 'Coordinates required for delivery' });
      }

      const distance = calculateDistance(
        patientLatitude,
        patientLongitude,
        pharmacy.coordinates.latitude,
        pharmacy.coordinates.longitude
      );

      if (distance > pharmacy.deliveryRadius) {
        return res.status(400).json({ error: 'Address is outside delivery radius' });
      }

      deliveryFee = pharmacy.deliveryFee;
      if (distance > 5) {
        deliveryFee += Math.ceil(distance - 5) * 2;
      }

      estimatedDeliveryTime = Math.ceil(distance * 3) + 15;
    }

    // Check minimum order amount
    if (totalAmount < pharmacy.minimumOrderAmount) {
      return res.status(400).json({ 
        error: `Minimum order amount is $${pharmacy.minimumOrderAmount}`,
        currentAmount: totalAmount,
        minimumRequired: pharmacy.minimumOrderAmount
      });
    }

    // Create order (you would typically have an Order model)
    const order = {
      orderId: `ORD${Date.now()}`,
      patientId,
      pharmacyId,
      medicines,
      totalAmount,
      deliveryFee,
      finalAmount: totalAmount + deliveryFee,
      deliveryType,
      deliveryAddress,
      estimatedDeliveryTime,
      status: 'pending',
      createdAt: new Date()
    };

    // Here you would save the order to database
    // For now, we'll just return the order details

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        finalAmount: order.finalAmount,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Upload prescription
router.post('/upload-prescription', requirePatient, async (req, res) => {
  try {
    // This would typically handle file upload using multer
    // For now, we'll just return a success message
    
    res.json({
      message: 'Prescription uploaded successfully',
      prescriptionId: `PRES${Date.now()}`
    });
  } catch (error) {
    console.error('Error uploading prescription:', error);
    res.status(500).json({ error: 'Failed to upload prescription' });
  }
});

// Get order history
router.get('/orders', requirePatient, async (req, res) => {
  try {
    const patientId = req.user._id;
    
    // This would typically fetch orders from database
    // For now, we'll return empty array
    
    res.json({
      orders: []
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
