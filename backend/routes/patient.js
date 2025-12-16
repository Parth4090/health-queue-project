const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Queue = require('../models/Queue');
const { auth, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Get patient dashboard data
router.get('/dashboard', requirePatient, async (req, res) => {
  try {
    const patientId = req.user._id;

    // Get current queue status
    const currentQueue = await Queue.findOne({
      patientId,
      status: { $in: ['waiting', 'in-consultation'] }
    }).populate('doctorId', 'specialization avgConsultationTime');

    // Get queue history
    const queueHistory = await Queue.find({
      patientId,
      status: { $in: ['completed', 'skipped', 'no-show', 'cancelled'] }
    })
    .populate('doctorId', 'specialization')
    .sort('-createdAt')
    .limit(5);

    // Calculate statistics
    const totalConsultations = await Queue.countDocuments({
      patientId,
      status: 'completed'
    });

    const totalWaitTime = await Queue.aggregate([
      { $match: { patientId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalWaitTime: { $sum: '$waitingTime' }
        }
      }
    ]);

    const avgWaitTime = totalWaitTime.length > 0 ? 
      Math.round(totalWaitTime[0].totalWaitTime / totalConsultations) : 0;

    res.json({
      currentQueue: currentQueue ? {
        id: currentQueue._id,
        ticketNumber: currentQueue.ticketNumber,
        position: currentQueue.position,
        status: currentQueue.status,
        doctor: currentQueue.doctorId.specialization,
        estimatedTime: currentQueue.calculateETA(currentQueue.doctorId.avgConsultationTime)
      } : null,
      queueHistory: queueHistory.map(item => ({
        id: item._id,
        date: item.createdAt,
        doctor: item.doctorId.specialization,
        status: item.status,
        waitTime: item.waitingTime
      })),
      statistics: {
        totalConsultations,
        avgWaitTime,
        currentPosition: currentQueue ? currentQueue.position : null
      }
    });
  } catch (error) {
    console.error('Error fetching patient dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get patient profile
router.get('/profile', requirePatient, async (req, res) => {
  try {
    const patient = req.user;

    res.json({
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        city: patient.city,
        address: patient.address,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        profilePicture: patient.profilePicture,
        createdAt: patient.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update patient profile
router.put('/profile', requirePatient, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('city').optional().trim().notEmpty(),
  body('address').optional().trim().notEmpty(),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'phone', 'city', 'address', 'dateOfBirth', 'gender'];
    
    // Filter allowed updates
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const patient = await User.findByIdAndUpdate(
      req.user._id,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        city: patient.city,
        address: patient.address,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender
      }
    });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Get patient's consultation history
router.get('/consultations', requirePatient, async (req, res) => {
  try {
    const patientId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { patientId };
    if (status) {
      query.status = status;
    }

    const consultations = await Queue.find(query)
      .populate('doctorId', 'specialization avgConsultationTime')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Queue.countDocuments(query);

    res.json({
      consultations: consultations.map(item => ({
        id: item._id,
        date: item.createdAt,
        doctor: item.doctorId.specialization,
        status: item.status,
        waitTime: item.waitingTime,
        consultationTime: item.actualConsultationTime,
        symptoms: item.symptoms,
        prescription: item.prescription,
        notes: item.notes
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// Get specific consultation details
router.get('/consultations/:consultationId', requirePatient, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const patientId = req.user._id;

    const consultation = await Queue.findOne({
      _id: consultationId,
      patientId
    }).populate('doctorId', 'specialization avgConsultationTime');

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json({
      consultation: {
        id: consultation._id,
        date: consultation.createdAt,
        doctor: consultation.doctorId.specialization,
        status: consultation.status,
        waitTime: consultation.waitingTime,
        consultationTime: consultation.actualConsultationTime,
        symptoms: consultation.symptoms,
        prescription: consultation.prescription,
        notes: consultation.notes,
        priority: consultation.priority,
        joinTime: consultation.joinTime,
        startTime: consultation.startTime,
        endTime: consultation.endTime
      }
    });
  } catch (error) {
    console.error('Error fetching consultation details:', error);
    res.status(500).json({ error: 'Failed to fetch consultation details' });
  }
});

// Rate a completed consultation
router.post('/consultations/:consultationId/rate', requirePatient, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim().isLength({ max: 500 }).withMessage('Feedback must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { consultationId } = req.params;
    const { rating, feedback } = req.body;
    const patientId = req.user._id;

    const consultation = await Queue.findOne({
      _id: consultationId,
      patientId,
      status: 'completed'
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Completed consultation not found' });
    }

    // Check if already rated
    if (consultation.rating) {
      return res.status(400).json({ error: 'Consultation already rated' });
    }

    // Update consultation with rating
    consultation.rating = rating;
    consultation.feedback = feedback;
    await consultation.save();

    res.json({
      message: 'Rating submitted successfully',
      rating: {
        rating,
        feedback
      }
    });
  } catch (error) {
    console.error('Error rating consultation:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Get patient statistics
router.get('/statistics', requirePatient, async (req, res) => {
  try {
    const patientId = req.user._id;

    const stats = await Queue.aggregate([
      { $match: { patientId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgWaitTime: { $avg: '$waitingTime' },
          avgConsultationTime: { $avg: '$actualConsultationTime' }
        }
      }
    ]);

    const totalConsultations = stats.reduce((sum, stat) => sum + stat.count, 0);
    const completedConsultations = stats.find(stat => stat._id === 'completed')?.count || 0;
    const avgWaitTime = stats.find(stat => stat._id === 'completed')?.avgWaitTime || 0;
    const avgConsultationTime = stats.find(stat => stat._id === 'completed')?.avgConsultationTime || 0;

    // Get monthly consultation trend
    const monthlyTrend = await Queue.aggregate([
      { $match: { patientId, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      overview: {
        totalConsultations,
        completedConsultations,
        avgWaitTime: Math.round(avgWaitTime),
        avgConsultationTime: Math.round(avgConsultationTime)
      },
      monthlyTrend: monthlyTrend.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        count: item.count
      }))
    });
  } catch (error) {
    console.error('Error fetching patient statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
