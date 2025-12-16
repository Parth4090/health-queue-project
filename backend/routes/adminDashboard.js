const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { adminAuth, requirePermission, auditLog } = require('../middleware/adminAuth');
const DoctorVerification = require('../models/DoctorVerification');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Queue = require('../models/Queue');
const Prescription = require('../models/Prescription');
const socketService = require('../services/socketService');

// Get dashboard overview and analytics
router.get('/overview', adminAuth, requirePermission(['view_analytics']), async (req, res) => {
  try {
    // Get counts
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });
    const totalDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    const pendingVerifications = await DoctorVerification.countDocuments({ 
      status: { $in: ['pending_documents', 'documents_uploaded', 'automated_verification', 'manual_review'] } 
    });
    const activeQueues = await Queue.countDocuments({ status: { $in: ['waiting', 'in-consultation'] } });
    const totalConsultations = await Queue.countDocuments({ status: 'completed' });
    const totalPrescriptions = await Prescription.countDocuments();

    // Get recent activity
    const recentVerifications = await DoctorVerification.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');

    const recentQueues = await Queue.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('doctorId', 'userId')
      .populate('patientId', 'name');

    // Get city-wise doctor distribution
    const cityStats = await User.aggregate([
      { $match: { role: 'doctor', isActive: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get specialization stats
    const specializationStats = await Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Queue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      overview: {
        totalPatients,
        totalDoctors,
        pendingVerifications,
        activeQueues,
        totalConsultations,
        totalPrescriptions
      },
      recentActivity: {
        verifications: recentVerifications,
        queues: recentQueues
      },
      statistics: {
        cityDistribution: cityStats,
        specializations: specializationStats,
        monthlyTrends: monthlyStats
      },
      code: 'OVERVIEW_RETRIEVED'
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get pending doctor verifications
router.get('/verifications/pending', adminAuth, requirePermission(['approve_registrations']), async (req, res) => {
  try {
    const { page = 1, limit = 20, city, specialization, sortBy = 'submittedAt', sortOrder = 'asc' } = req.query;

    // Include all statuses that need admin review
    let query = { 
      status: { 
        $in: ['pending_documents', 'documents_uploaded', 'automated_verification', 'manual_review'] 
      } 
    };
    
    // Add filters
    if (city) {
      query['personalInfo.city'] = { $regex: city, $options: 'i' };
    }
    if (specialization) {
      query['professionalInfo.specialization'] = { $regex: specialization, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const verifications = await DoctorVerification.find(query)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'specialization qualification experience')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await DoctorVerification.countDocuments(query);

    res.json({
      verifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      code: 'PENDING_VERIFICATIONS_RETRIEVED'
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get all verifications (for admin dashboard)
router.get('/verifications', adminAuth, requirePermission(['approve_registrations']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, city, specialization, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Add other filters
    if (city) {
      query['personalInfo.city'] = { $regex: city, $options: 'i' };
    }
    if (specialization) {
      query['professionalInfo.specialization'] = { $regex: specialization, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const verifications = await DoctorVerification.find(query)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'specialization qualification experience')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await DoctorVerification.countDocuments(query);

    res.json({
      verifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      code: 'VERIFICATIONS_RETRIEVED'
    });

  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get verification by ID
router.get('/verifications/:id', adminAuth, requirePermission(['approve_registrations']), async (req, res) => {
  try {
    const verification = await DoctorVerification.findById(req.params.id)
      .populate('userId', 'name email phone city address dateOfBirth gender')
      .populate('doctorId', 'specialization qualification experience consultationFee workingHours workingDays')
      .populate('verificationDetails.reviewedBy', 'profile.firstName profile.lastName');

    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    res.json({
      verification,
      code: 'VERIFICATION_RETRIEVED'
    });

  } catch (error) {
    console.error('Get verification error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Approve doctor verification
router.post('/verifications/:id/approve', adminAuth, requirePermission(['approve_registrations']), [
  body('notes').optional().trim().isLength({ max: 500 })
], auditLog('doctor_verification_approved'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { notes } = req.body;
    const verification = await DoctorVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    if (verification.status !== 'manual_review') {
      return res.status(400).json({
        message: 'Verification must be in manual review status',
        code: 'INVALID_STATUS'
      });
    }

    // Update verification status
    verification.status = 'approved';
    verification.timeline.push({
      action: 'admin_approved',
      status: 'approved',
      timestamp: new Date(),
      notes: notes || 'Approved by admin',
      adminId: req.admin._id
    });

    await verification.save();

    // Update user verification status
    await User.findByIdAndUpdate(verification.userId, { isVerified: true });

    // Create or update doctor profile
    const doctorData = {
      userId: verification.userId,
      specialization: verification.professionalInfo?.specialization || 'General Medicine',
      qualification: verification.professionalInfo?.qualification || 'MBBS',
      experience: verification.professionalInfo?.experience || 0,
      consultationFee: verification.professionalInfo?.consultationFee || 500,
      workingHours: verification.professionalInfo?.workingHours || { start: '09:00', end: '17:00' },
      workingDays: verification.professionalInfo?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      clinicName: verification.professionalInfo?.clinicName || 'Private Clinic',
      clinicAddress: verification.professionalInfo?.clinicAddress || 'Not specified'
    };

    // Check if doctor profile already exists
    let doctor = await Doctor.findOne({ userId: verification.userId });
    if (doctor) {
      // Update existing profile
      Object.assign(doctor, doctorData);
      await doctor.save();
    } else {
      // Create new doctor profile
      doctor = new Doctor(doctorData);
      await doctor.save();
    }

    // Emit real-time events
    socketService.emitDoctorVerified({
      userId: verification.userId,
      verificationId: verification._id,
      status: 'approved',
      doctorData: doctor,
      approvedBy: req.admin._id,
      approvedAt: new Date()
    });

    // Emit admin action event for real-time sync
    socketService.emitAdminAction({
      action: 'verification_approved',
      targetType: 'doctor_verification',
      targetId: verification._id,
      adminId: req.admin._id,
      data: {
        verificationId: verification._id,
        doctorId: doctor._id,
        status: 'approved',
        timestamp: new Date()
      }
    });

    res.json({
      message: 'Doctor verification approved successfully',
      verification,
      code: 'VERIFICATION_APPROVED'
    });

  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Reject doctor verification
router.post('/verifications/:id/reject', adminAuth, requirePermission(['approve_registrations']), [
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Rejection reason must be 10-500 characters'),
  body('notes').optional().trim().isLength({ max: 500 })
], auditLog('doctor_verification_rejected'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { reason, notes } = req.body;
    const verification = await DoctorVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    if (verification.status !== 'manual_review') {
      return res.status(400).json({
        message: 'Verification must be in manual review status',
        code: 'INVALID_STATUS'
      });
    }

    // Update verification status
    verification.status = 'rejected';
    verification.timeline.push({
      action: 'admin_rejected',
      status: 'rejected',
      timestamp: new Date(),
      notes: reason,
      adminId: req.admin._id
    });

    await verification.save();

    // Emit real-time events
    socketService.emitDoctorRejected({
      userId: verification.userId,
      verificationId: verification._id,
      status: 'rejected',
      reason: reason,
      rejectedBy: req.admin._id,
      rejectedAt: new Date()
    });

    // Emit admin action event for real-time sync
    socketService.emitAdminAction({
      action: 'verification_rejected',
      targetType: 'doctor_verification',
      targetId: verification._id,
      adminId: req.admin._id,
      data: {
        verificationId: verification._id,
        status: 'rejected',
        reason: reason,
        timestamp: new Date()
      }
    });

    res.json({
      message: 'Doctor verification rejected successfully',
      verification,
      code: 'VERIFICATION_REJECTED'
    });

  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Put verification on hold
router.post('/verifications/:id/hold', adminAuth, requirePermission(['approve_registrations']), [
  body('notes').trim().isLength({ min: 10, max: 500 }).withMessage('Hold reason must be 10-500 characters')
], auditLog('doctor_verification_on_hold'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { notes } = req.body;
    const verification = await DoctorVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    if (verification.status !== 'manual_review') {
      return res.status(400).json({
        message: 'Verification must be in manual review status',
        code: 'INVALID_STATUS'
      });
    }

    // Update verification status
    verification.status = 'on_hold';
    verification.timeline.push({
      action: 'admin_put_on_hold',
      status: 'on_hold',
      timestamp: new Date(),
      notes: notes,
      adminId: req.admin._id
    });

    await verification.save();

    // Emit real-time events
    socketService.emitDoctorOnHold({
      userId: verification.userId,
      verificationId: verification._id,
      status: 'on_hold',
      notes: notes,
      putOnHoldBy: req.admin._id,
      putOnHoldAt: new Date()
    });

    // Emit admin action event for real-time sync
    socketService.emitAdminAction({
      action: 'verification_on_hold',
      targetType: 'doctor_verification',
      targetId: verification._id,
      adminId: req.admin._id,
      data: {
        verificationId: verification._id,
        status: 'on_hold',
        notes: notes,
        timestamp: new Date()
      }
    });

    res.json({
      message: 'Doctor verification put on hold successfully',
      verification,
      code: 'VERIFICATION_ON_HOLD'
    });

  } catch (error) {
    console.error('Put verification on hold error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Request additional documents
router.post('/verifications/:id/request-documents', adminAuth, requirePermission(['approve_registrations']), [
  body('requestedDocuments').isArray().withMessage('Requested documents must be an array'),
  body('notes').optional().trim().isLength({ max: 500 })
], auditLog('doctor_verification_documents_requested'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { requestedDocuments, notes } = req.body;
    const verification = await DoctorVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    // Update verification status
    verification.status = 'pending_documents';
    verification.timeline.push({
      action: 'admin_requested_documents',
      status: 'pending_documents',
      timestamp: new Date(),
      notes: `Additional documents requested: ${requestedDocuments.join(', ')}. ${notes || ''}`,
      adminId: req.admin._id
    });

    await verification.save();

    res.json({
      message: 'Additional documents requested successfully',
      verification,
      code: 'DOCUMENTS_REQUESTED'
    });

  } catch (error) {
    console.error('Request documents error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get verification statistics
router.get('/verifications/stats', adminAuth, requirePermission(['view_analytics']), async (req, res) => {
  try {
    const stats = await DoctorVerification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const cityStats = await DoctorVerification.aggregate([
      { $match: { status: { $in: ['pending_documents', 'documents_uploaded', 'automated_verification', 'manual_review'] } } },
      { $group: { _id: '$personalInfo.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const specializationStats = await DoctorVerification.aggregate([
      { $match: { status: { $in: ['pending_documents', 'documents_uploaded', 'automated_verification', 'manual_review'] } } },
      { $group: { _id: '$professionalInfo.specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const monthlyStats = await DoctorVerification.aggregate([
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
      statusDistribution: stats,
      cityDistribution: cityStats,
      specializationDistribution: specializationStats,
      monthlyTrends: monthlyStats,
      code: 'VERIFICATION_STATS_RETRIEVED'
    });

  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
