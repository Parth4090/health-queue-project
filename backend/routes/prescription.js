const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all prescriptions for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ 
      patientId: req.params.patientId 
    })
    .populate({
      path: 'doctorId',
      select: 'specialization',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ date: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all prescriptions written by a doctor
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ 
      doctorId: req.params.doctorId 
    })
    .populate('patientId', 'name email phone')
    .sort({ date: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific prescription by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone city address')
      .populate('doctorId', 'name specialization qualification experience');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new prescription
router.post('/', [
  auth,
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.name').notEmpty().withMessage('Medicine name is required'),
  body('medicines.*.dosage').notEmpty().withMessage('Medicine dosage is required'),
  body('medicines.*.frequency').notEmpty().withMessage('Medicine frequency is required'),
  body('medicines.*.duration').notEmpty().withMessage('Medicine duration is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { patientId, diagnosis, medicines, notes } = req.body;

    // Generate prescription ID (format: PRESC-YYYYMMDD-XXXX)
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prescriptionId = `PRESC-${dateStr}-${randomNum}`;

    // Set valid until date (30 days from now)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Create a temporary appointment ID for now (since we don't have appointment system)
    const tempAppointmentId = new mongoose.Types.ObjectId();

    // Find the doctor record for this user
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ userId: req.user.id });
    
    if (!doctor) {
      return res.status(400).json({ message: 'Doctor profile not found' });
    }

    const prescription = new Prescription({
      prescriptionId,
      patientId,
      doctorId: doctor._id,
      appointmentId: tempAppointmentId,
      diagnosis,
      medicines,
      notes: notes || '',
      validUntil
    });

    await prescription.save();

    // Populate the saved prescription for response
    await prescription.populate('patientId', 'name email phone');
    await prescription.populate('doctorId', 'name specialization');

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a prescription
router.put('/:id', [
  auth,
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.name').notEmpty().withMessage('Medicine name is required'),
  body('medicines.*.dosage').notEmpty().withMessage('Medicine dosage is required'),
  body('medicines.*.frequency').notEmpty().withMessage('Medicine frequency is required'),
  body('medicines.*.duration').notEmpty().withMessage('Medicine duration is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Only the doctor who created the prescription can update it
    if (prescription.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this prescription' });
    }

    const { diagnosis, medicines, additionalNotes } = req.body;

    prescription.diagnosis = diagnosis;
    prescription.medicines = medicines;
    prescription.additionalNotes = additionalNotes;

    await prescription.save();

    // Populate the updated prescription for response
    await prescription.populate('patientId', 'name email phone');
    await prescription.populate('doctorId', 'name specialization');

    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a prescription
router.delete('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Only the doctor who created the prescription can delete it
    if (prescription.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this prescription' });
    }

    await prescription.remove();

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update prescription status
router.patch('/:id/status', [
  auth,
  body('status').isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Only the doctor who created the prescription can update its status
    if (prescription.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this prescription' });
    }

    prescription.status = req.body.status;
    await prescription.save();

    res.json({
      message: 'Prescription status updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
