const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');

// Upload prescription (Doctor only)
router.post('/upload', auth, async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, medicines, notes } = req.body;
    const doctorId = req.user.id;

    // Verify doctor is treating this patient
    const appointment = await Appointment.findOne({
      appointmentId: appointmentId,
      doctorId: doctorId,
      patientId: patientId
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Create prescription
    const prescription = new Prescription({
      prescriptionId: `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: patientId,
      doctorId: doctorId,
      appointmentId: appointmentId,
      diagnosis: diagnosis,
      medicines: medicines,
      notes: notes,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days validity
    });

    await prescription.save();

    // Update appointment with prescription
    await Appointment.findByIdAndUpdate(appointment._id, {
      prescription: prescription._id,
      status: 'completed'
    });

    // Emit real-time event for patient
    req.app.get('io').emit('prescription-uploaded', {
      patientId: patientId,
      prescriptionId: prescription.prescriptionId,
      doctorId: doctorId
    });

    res.json({
      success: true,
      message: 'Prescription uploaded successfully',
      prescription: prescription
    });

  } catch (error) {
    console.error('Error uploading prescription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get prescriptions for patient
router.get('/patient', auth, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const prescriptions = await Prescription.find({
      patientId: patientId,
      status: 'active'
    })
      .populate('doctorId', 'specialization clinicName')
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments({
      patientId: patientId,
      status: 'active'
    });

    res.json({
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get prescriptions by doctor
router.get('/doctor', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const prescriptions = await Prescription.find({
      doctorId: doctorId,
      status: 'active'
    })
      .populate('patientId', 'name')
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments({
      doctorId: doctorId,
      status: 'active'
    });

    res.json({
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get prescription by ID
router.get('/:prescriptionId', auth, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const userId = req.user.id;

    const prescription = await Prescription.findOne({
      prescriptionId: prescriptionId
    })
      .populate('patientId', 'name')
      .populate('doctorId', 'specialization clinicName')
      .populate('appointmentId');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check if user has access to this prescription
    if (prescription.patientId._id.toString() !== userId && 
        prescription.doctorId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json({
      success: true,
      prescription: prescription
    });

  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update prescription status
router.patch('/:prescriptionId/status', auth, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;

    const prescription = await Prescription.findOne({
      prescriptionId: prescriptionId,
      doctorId: doctorId
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.status = status;
    await prescription.save();

    // Emit real-time event for patient
    req.app.get('io').emit('prescription-status-updated', {
      patientId: prescription.patientId,
      prescriptionId: prescriptionId,
      status: status
    });

    res.json({
      success: true,
      message: 'Prescription status updated successfully',
      prescription: prescription
    });

  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
