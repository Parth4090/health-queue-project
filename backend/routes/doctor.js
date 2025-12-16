const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Queue = require('../models/Queue');
const { auth, requireDoctor } = require('../middleware/auth');

const router = express.Router();

// Get doctor dashboard data
router.get('/dashboard', requireDoctor, async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    // Get current queue
    const currentQueue = await Queue.find({
      doctorId: doctor._id,
      status: { $in: ['waiting', 'in-consultation'] }
    })
    .populate('patientId', 'name phone city')
    .sort('position');

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStats = await Queue.aggregate([
      {
        $match: {
          doctorId: doctor._id,
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgConsultationTime: { $avg: '$actualConsultationTime' }
        }
      }
    ]);

    // Get weekly trend
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyTrend = await Queue.aggregate([
      {
        $match: {
          doctorId: doctor._id,
          createdAt: { $gte: weekAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      doctor: {
        id: doctor._id,
        specialization: doctor.specialization,
        avgConsultationTime: doctor.avgConsultationTime,
        currentQueueSize: doctor.currentQueueSize,
        maxQueueSize: doctor.maxQueueSize,
        rating: doctor.rating,
        totalRatings: doctor.totalRatings
      },
      currentQueue: currentQueue.map(item => ({
        id: item._id,
        ticketNumber: item.ticketNumber,
        position: item.position,
        status: item.status,
        patient: item.patientId,
        joinTime: item.joinTime,
        symptoms: item.symptoms,
        priority: item.priority
      })),
      todayStats: {
        total: todayStats.reduce((sum, stat) => sum + stat.count, 0),
        waiting: todayStats.find(stat => stat._id === 'waiting')?.count || 0,
        completed: todayStats.find(stat => stat._id === 'completed')?.count || 0,
        avgConsultationTime: Math.round(
          todayStats.find(stat => stat._id === 'completed')?.avgConsultationTime || 0
        )
      },
      weeklyTrend: weeklyTrend.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        count: item.count
      }))
    });
  } catch (error) {
    console.error('Error fetching doctor dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get doctor profile
router.get('/profile', requireDoctor, async (req, res) => {
  try {
    const doctorId = req.user._id;

    const doctor = await Doctor.findOne({ userId: doctorId })
      .populate('userId', 'name email phone city address dateOfBirth gender');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    res.json({
      doctor: {
        id: doctor._id,
        user: doctor.userId,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        avgConsultationTime: doctor.avgConsultationTime,
        workingHours: doctor.workingHours,
        workingDays: doctor.workingDays,
        isAvailable: doctor.isAvailable,
        maxQueueSize: doctor.maxQueueSize,
        currentQueueSize: doctor.currentQueueSize,
        rating: doctor.rating,
        totalRatings: doctor.totalRatings,
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress
      }
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update doctor profile
router.put('/profile', requireDoctor, [
  body('specialization').optional().trim().notEmpty(),
  body('qualification').optional().trim().notEmpty(),
  body('experience').optional().isInt({ min: 0 }),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('avgConsultationTime').optional().isInt({ min: 5, max: 60 }),
  body('workingHours.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('workingHours.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('workingDays').optional().isArray(),
  body('workingDays.*').optional().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  body('isAvailable').optional().isBoolean(),
  body('maxQueueSize').optional().isInt({ min: 1, max: 100 }),
  body('clinicName').optional().trim(),
  body('clinicAddress').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctorId = req.user._id;
    const updates = req.body;

    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    // Update doctor profile
    Object.assign(doctor, updates);
    await doctor.save();

    res.json({
      message: 'Profile updated successfully',
      doctor: {
        id: doctor._id,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        avgConsultationTime: doctor.avgConsultationTime,
        workingHours: doctor.workingHours,
        workingDays: doctor.workingDays,
        isAvailable: doctor.isAvailable,
        maxQueueSize: doctor.maxQueueSize,
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress
      }
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Get doctor's consultation history
router.get('/consultations', requireDoctor, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { page = 1, limit = 10, status, date } = req.query;

    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    let query = { doctorId: doctor._id };
    if (status) {
      query.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const consultations = await Queue.find(query)
      .populate('patientId', 'name phone city')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Queue.countDocuments(query);

    res.json({
      consultations: consultations.map(item => ({
        id: item._id,
        date: item.createdAt,
        patient: item.patientId,
        status: item.status,
        waitTime: item.waitingTime,
        consultationTime: item.actualConsultationTime,
        symptoms: item.symptoms,
        prescription: item.prescription,
        notes: item.notes,
        priority: item.priority
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

// Get doctor statistics
router.get('/statistics', requireDoctor, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { period = 'month' } = req.query;

    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { $gte: monthAgo };
        break;
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        dateFilter = { $gte: yearAgo };
        break;
      default:
        dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) }; // Current year
    }

    const stats = await Queue.aggregate([
      {
        $match: {
          doctorId: doctor._id,
          createdAt: dateFilter
        }
      },
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

    // Get daily trend for the period
    const dailyTrend = await Queue.aggregate([
      {
        $match: {
          doctorId: doctor._id,
          createdAt: dateFilter,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      overview: {
        totalConsultations,
        completedConsultations,
        avgWaitTime: Math.round(avgWaitTime),
        avgConsultationTime: Math.round(avgConsultationTime)
      },
      dailyTrend: dailyTrend.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        count: item.count
      })),
      period
    });
  } catch (error) {
    console.error('Error fetching doctor statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Update consultation time
router.put('/consultation-time', requireDoctor, [
  body('consultationTime').isInt({ min: 1, max: 120 }).withMessage('Consultation time must be between 1 and 120 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { consultationTime } = req.body;
    const doctorId = req.user._id;

    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    doctor.avgConsultationTime = consultationTime;
    await doctor.save();

    res.json({
      message: 'Consultation time updated successfully',
      avgConsultationTime: doctor.avgConsultationTime
    });
  } catch (error) {
    console.error('Error updating consultation time:', error);
    res.status(500).json({ error: 'Failed to update consultation time' });
  }
});

// Toggle doctor availability
router.put('/availability', requireDoctor, [
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isAvailable } = req.body;
    const doctorId = req.user._id;

    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    doctor.isAvailable = isAvailable;
    await doctor.save();

    res.json({
      message: `Doctor is now ${isAvailable ? 'available' : 'unavailable'}`,
      isAvailable: doctor.isAvailable
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

module.exports = router;
