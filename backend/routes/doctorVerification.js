const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const socketService = require('../services/socketService');

// Import models and services
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorVerification = require('../models/DoctorVerification');
const NMCVerificationService = require('../services/nmcVerificationService');
const RiskAssessmentService = require('../services/riskAssessmentService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/doctor-verification/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed.'), false);
    }
  }
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

// Step 1: Initial doctor registration with NMC verification
router.post('/register/step1', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('nmcNumber').trim().notEmpty().withMessage('NMC number is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  body('experience').isInt({ min: 0, max: 50 }).withMessage('Experience must be 0-50 years'),
  body('consultationFee').isFloat({ min: 100, max: 10000 }).withMessage('Consultation fee must be ₹100-₹10,000'),
  body('clinicName').trim().isLength({ min: 2, max: 100 }).withMessage('Clinic name is required'),
  body('clinicAddress').trim().isLength({ min: 3, max: 200 }).withMessage('Clinic address must be at least 3 characters long'),
  body('workingHours.start').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Working start time is required (HH:MM format)'),
  body('workingHours.end').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Working end time is required (HH:MM format)'),
  body('workingDays').isArray({ min: 1 }).withMessage('At least one working day is required'),
  body('workingDays.*').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Invalid working day'),
  body('compliance.termsAccepted').isBoolean().withMessage('Terms acceptance is required'),
  body('compliance.privacyPolicyAccepted').isBoolean().withMessage('Privacy policy acceptance is required'),
  body('compliance.codeOfConductAccepted').isBoolean().withMessage('Code of conduct acceptance is required'),
  body('compliance.dataProcessingConsent').isBoolean().withMessage('Data processing consent is required'),
  body('compliance.aadhaarConsent').isBoolean().withMessage('Aadhaar consent is required')
], async (req, res) => {
  try {
    // Debug: Log the incoming request body
    console.log('🔍 Incoming request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      console.log('🔍 Field values that failed validation:');
      errors.array().forEach(error => {
        console.log(`   ${error.path}: "${error.value}" (${error.value ? error.value.length : 0} chars)`);
      });
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const {
      userId, nmcNumber, specialization, qualification, experience, consultationFee,
      clinicName, clinicAddress, workingHours, workingDays, compliance
    } = req.body;

    // Verify the user exists and is a doctor
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({
        message: 'User is not a doctor',
        code: 'INVALID_USER_ROLE'
      });
    }

    // Check if verification already exists
    const existingVerification = await DoctorVerification.findOne({ userId });
    if (existingVerification) {
      return res.status(400).json({
        message: 'Verification already exists for this user',
        code: 'VERIFICATION_EXISTS'
      });
    }

    // Check if NMC number is already registered
    const existingNMC = await DoctorVerification.findOne({ 'nmcVerification.nmcNumber': nmcNumber.toUpperCase() });
    if (existingNMC) {
      return res.status(400).json({
        message: 'NMC number is already registered',
        code: 'NMC_ALREADY_EXISTS'
      });
    }

    // Validate NMC number format
    const nmcValidation = NMCVerificationService.validateNMCFormat(nmcNumber);
    if (!nmcValidation.valid) {
      return res.status(400).json({
        message: 'Invalid NMC number format',
        code: 'INVALID_NMC_FORMAT',
        details: nmcValidation
      });
    }

    // Verify NMC number with medical council
    const nmcVerification = await NMCVerificationService.verifyNMCNumber(nmcNumber, user.name, user.dateOfBirth);
    
    // Create doctor profile (inactive)
    const doctor = new Doctor({
      userId: user._id,
      specialization,
      qualification,
      experience,
      consultationFee,
      clinicName,
      clinicAddress,
      workingHours,
      workingDays,
      isAvailable: false, // Will be enabled after verification
      nmcNumber: nmcNumber.toUpperCase()
    });

    await doctor.save();

    // Create verification record
    const verification = new DoctorVerification({
      userId: user._id,
      doctorId: doctor._id,
      status: 'pending_documents',
             personalInfo: {
         name: user.name,
         email: user.email,
         phone: user.phone,
         city: user.city,
         state: user.state || req.body.state || 'Madhya Pradesh', // Use user.state, req.body.state, or default
         address: user.address,
         dateOfBirth: user.dateOfBirth,
         gender: user.gender
       },
      professionalInfo: {
        specialization,
        qualification,
        experience,
        consultationFee,
        clinicName,
        clinicAddress,
        workingHours,
        workingDays
      },
      nmcVerification: {
        nmcNumber: nmcNumber.toUpperCase(),
        stateCouncil: nmcValidation.council,
        verificationStatus: nmcVerification.success ? 'verified' : 'manual_review',
        verificationResult: nmcVerification.success ? nmcVerification.verificationResult : null,
        lastVerifiedAt: new Date(),
        verificationSource: nmcVerification.verificationSource,
        confidence: nmcVerification.success ? nmcVerification.verificationResult?.confidence : 0
      },
      compliance: {
        ...compliance,
        consentTimestamp: new Date()
      },
      timeline: [{
        action: 'registration_initiated',
        status: 'pending_documents',
        timestamp: new Date(),
        notes: 'Doctor registration initiated, documents pending'
      }]
    });

    await verification.save();

    // Emit real-time events for new verification
    socketService.emitNewDoctor({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      state: user.state,
      verificationId: verification._id,
      status: verification.status,
      specialization: specialization,
      qualification: qualification,
      experience: experience,
      createdAt: new Date()
    });

    // Generate temporary token for document upload
    const tempToken = jwt.sign(
      { 
        userId: user._id, 
        verificationId: verification._id,
        type: 'verification_temp'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Doctor registration initiated successfully',
      code: 'REGISTRATION_INITIATED',
      verificationId: verification._id,
      tempToken,
      nextStep: 'document_upload',
      nmcVerification: {
        success: nmcVerification.success,
        council: nmcVerification.council,
        councilName: nmcVerification.councilName,
        requiresManualReview: !nmcVerification.success
      },
      instructions: [
        'Upload required documents (NMC license, medical degree, government ID)',
        'Complete liveness verification video',
        'Wait for automated verification and admin review',
        'Account will be activated after approval'
      ]
    });

  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR',
      details: error.message
    });
  }
});

// Step 2: Document upload
router.post('/upload-documents', upload.fields([
  { name: 'governmentId', maxCount: 1 },
  { name: 'medicalDegree', maxCount: 1 },
  { name: 'medicalLicense', maxCount: 1 },
  { name: 'selfieVideo', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🔍 Document upload request received');
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Request files:', req.files);
    console.log('🔍 Authorization header:', req.headers.authorization);
    
    const { verificationId } = req.body;
    const tempToken = req.headers.authorization?.replace('Bearer ', '');

    if (!tempToken) {
      console.log('❌ No temp token provided');
      return res.status(401).json({
        message: 'Temporary token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    if (!verificationId) {
      console.log('❌ No verification ID provided');
      return res.status(400).json({
        message: 'Verification ID required',
        code: 'VERIFICATION_ID_REQUIRED'
      });
    }

    console.log('🔍 Verification ID:', verificationId);
    console.log('🔍 Temp token:', tempToken);

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'fallback-secret');
    console.log('🔍 Decoded token:', decoded);
    
    if (decoded.type !== 'verification_temp' || decoded.verificationId !== verificationId) {
      console.log('❌ Token validation failed');
      return res.status(401).json({
        message: 'Invalid temporary token',
        code: 'INVALID_TOKEN'
      });
    }

    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      console.log('❌ Verification record not found');
      return res.status(404).json({
        message: 'Verification record not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    console.log('🔍 Verification status:', verification.status);

    if (verification.status !== 'pending_documents') {
      console.log('❌ Invalid verification status');
      return res.status(400).json({
        message: 'Documents already uploaded or verification in progress',
        code: 'INVALID_STATUS'
      });
    }

    // Check if required files are uploaded
    if (!req.files.governmentId || !req.files.medicalDegree || !req.files.medicalLicense) {
      console.log('❌ Missing required files');
      console.log('🔍 Available files:', Object.keys(req.files || {}));
      return res.status(400).json({
        message: 'All required documents must be uploaded',
        code: 'MISSING_DOCUMENTS',
        required: ['governmentId', 'medicalDegree', 'medicalLicense']
      });
    }

    console.log('🔍 All required files present, processing...');
    
    // Process uploaded documents
    const documents = [];
    
    // Government ID
    if (req.files.governmentId) {
      documents.push({
        type: 'govt_id_aadhaar',
        fileName: req.files.governmentId[0].originalname,
        fileUrl: req.files.governmentId[0].path,
        fileSize: req.files.governmentId[0].size,
        mimeType: req.files.governmentId[0].mimetype,
        uploadedAt: new Date()
      });
    }

    // Medical Degree
    if (req.files.medicalDegree) {
      documents.push({
        type: 'medical_degree',
        fileName: req.files.medicalDegree[0].originalname,
        fileUrl: req.files.medicalDegree[0].path,
        fileSize: req.files.medicalDegree[0].size,
        mimeType: req.files.medicalDegree[0].mimetype,
        uploadedAt: new Date()
      });
    }

    // Medical License
    if (req.files.medicalLicense) {
      documents.push({
        type: 'nmc_license',
        fileName: req.files.medicalLicense[0].originalname,
        fileUrl: req.files.medicalLicense[0].path,
        fileSize: req.files.medicalLicense[0].size,
        mimeType: req.files.medicalLicense[0].mimetype,
        uploadedAt: new Date()
      });
    }

    // Selfie Video (optional)
    if (req.files.selfieVideo) {
      documents.push({
        type: 'selfie_video',
        fileName: req.files.selfieVideo[0].originalname,
        fileUrl: req.files.selfieVideo[0].path,
        fileSize: req.files.selfieVideo[0].size,
        mimeType: req.files.selfieVideo[0].mimetype,
        uploadedAt: new Date()
      });
    }

    console.log('🔍 Processed documents:', documents);

    // Update verification with documents
    verification.documents = documents;
    verification.status = 'documents_uploaded';
    verification.timeline.push({
      action: 'documents_uploaded',
      status: 'documents_uploaded',
      timestamp: new Date(),
      notes: `Uploaded ${documents.length} documents`
    });

    await verification.save();
    console.log('✅ Documents saved successfully');

    // Emit real-time event for status change
    socketService.emitDoctorVerificationStatusChanged({
      userId: verification.userId,
      verificationId: verification._id,
      status: 'documents_uploaded',
      action: 'documents_uploaded',
      timestamp: new Date()
    });

    // Emit real-time event for status change
    socketService.emitDoctorVerificationStatusChanged({
      userId: verification.userId,
      verificationId: verification._id,
      status: 'documents_uploaded',
      action: 'documents_uploaded',
      timestamp: new Date()
    });

    // Automatically trigger verification process
    try {
      // Update status to automated verification
      verification.status = 'automated_verification';
      verification.timeline.push({
        action: 'automated_verification_started',
        status: 'automated_verification',
        timestamp: new Date(),
        notes: 'AI-powered verification checks initiated automatically'
      });

      await verification.save();

      // Simulate automated verification completion after 5 seconds
      setTimeout(async () => {
        try {
          const updatedVerification = await DoctorVerification.findById(verificationId);
          if (updatedVerification && updatedVerification.status === 'automated_verification') {
            updatedVerification.status = 'manual_review';
            updatedVerification.timeline.push({
              action: 'automated_verification_completed',
              status: 'manual_review',
              timestamp: new Date(),
              notes: 'Automated verification completed, ready for admin review'
            });
            await updatedVerification.save();
            console.log('✅ Automated verification completed for:', verificationId);

            // Emit real-time event for status change
            socketService.emitDoctorVerificationStatusChanged({
              userId: updatedVerification.userId,
              verificationId: updatedVerification._id,
              status: 'manual_review',
              action: 'automated_verification_completed',
              timestamp: new Date()
            });

            // Emit real-time event for status change
            socketService.emitDoctorVerificationStatusChanged({
              userId: updatedVerification.userId,
              verificationId: updatedVerification._id,
              status: 'manual_review',
              action: 'automated_verification_completed',
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('Error updating verification status:', error);
        }
      }, 5000);

    } catch (error) {
      console.error('Error triggering automated verification:', error);
      // Don't fail the upload if verification trigger fails
    }

    res.json({
      message: 'Documents uploaded successfully',
      code: 'DOCUMENTS_UPLOADED',
      documents: documents.map(doc => ({
        type: doc.type,
        fileName: doc.fileName,
        uploadedAt: doc.uploadedAt
      })),
      nextStep: 'liveness_verification',
      instructions: [
        'Complete liveness verification video',
        'Wait for automated verification processing',
        'Admin review will be scheduled'
      ]
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      message: 'Document upload failed',
      code: 'UPLOAD_ERROR',
      details: error.message
    });
  }
});

// Step 3: Liveness verification
router.post('/liveness-verification/:verificationId', upload.single('livenessVideo'), async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { tempToken } = req.headers;

    if (!tempToken) {
      return res.status(401).json({
        message: 'Temporary token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'fallback-secret');
    if (decoded.type !== 'verification_temp' || decoded.verificationId !== verificationId) {
      return res.status(401).json({
        message: 'Invalid temporary token',
        code: 'INVALID_TOKEN'
      });
    }

    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification record not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    if (verification.status !== 'documents_uploaded') {
      return res.status(400).json({
        message: 'Documents must be uploaded first',
        code: 'INVALID_STATUS'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Liveness video not uploaded',
        code: 'NO_VIDEO'
      });
    }

    // Process liveness video (simplified - would integrate with AI service)
    const livenessVerification = {
      videoUrl: req.file.path,
      videoHash: crypto.createHash('sha256').update(req.file.buffer).digest('hex'),
      livenessScore: 85, // Placeholder - would be calculated by AI
      blinkDetected: true, // Placeholder
      headTurnDetected: true, // Placeholder
      faceMatchScore: 88, // Placeholder - would be calculated by AI
      faceMatchThreshold: 85,
      verificationStatus: 'passed', // Placeholder
      processedAt: new Date(),
      aiModel: 'placeholder_model',
      confidence: 85
    };

    // Update verification with liveness data
    verification.livenessVerification = livenessVerification;
    verification.status = 'automated_verification';
    verification.timeline.push({
      action: 'liveness_verification_completed',
      status: 'automated_verification',
      timestamp: new Date(),
      notes: 'Liveness verification completed, starting automated verification'
    });

    await verification.save();

    // Start automated verification process
    await this.startAutomatedVerification(verification);

    res.json({
      message: 'Liveness verification completed successfully',
      code: 'LIVENESS_VERIFIED',
      livenessScore: livenessVerification.livenessScore,
      faceMatchScore: livenessVerification.faceMatchScore,
      nextStep: 'automated_verification',
      estimatedTime: '2-4 hours',
      instructions: [
        'Automated verification in progress',
        'You will be notified of the results',
        'Admin review will be scheduled if needed'
      ]
    });

  } catch (error) {
    console.error('Liveness verification error:', error);
    res.status(500).json({
      message: 'Liveness verification failed',
      code: 'LIVENESS_ERROR',
      details: error.message
    });
  }
});

// Step 3: Check verification status
router.get('/status/:verificationId', async (req, res) => {
  try {
    const { verificationId } = req.params;
    const tempToken = req.headers.authorization?.replace('Bearer ', '');

    if (!tempToken) {
      return res.status(401).json({
        message: 'Temporary token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'fallback-secret');
    if (decoded.type !== 'verification_temp' || decoded.verificationId !== verificationId) {
      return res.status(401).json({
        message: 'Invalid temporary token',
        code: 'INVALID_TOKEN'
      });
    }

    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification record not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    res.json({
      verificationId: verification._id,
      status: verification.status,
      progress: verification.verificationProgress,
      timeline: verification.timeline,
      documents: verification.documents?.length || 0,
      lastUpdated: verification.updatedAt
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      message: 'Failed to check status',
      code: 'STATUS_CHECK_ERROR',
      details: error.message
    });
  }
});

// Step 4: Trigger automated verification (called after document upload)
router.post('/trigger-verification/:verificationId', async (req, res) => {
  try {
    const { verificationId } = req.params;
    const tempToken = req.headers.authorization?.replace('Bearer ', '');

    if (!tempToken) {
      return res.status(401).json({
        message: 'Temporary token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'fallback-secret');
    if (decoded.type !== 'verification_temp' || decoded.verificationId !== verificationId) {
      return res.status(401).json({
        message: 'Invalid temporary token',
        code: 'INVALID_TOKEN'
      });
    }

    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification record not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    if (verification.status !== 'documents_uploaded') {
      return res.status(400).json({
        message: 'Documents must be uploaded first',
        code: 'INVALID_STATUS'
      });
    }

    // Update status to automated verification
    verification.status = 'automated_verification';
    verification.timeline.push({
      action: 'automated_verification_started',
      status: 'automated_verification',
      timestamp: new Date(),
      notes: 'AI-powered verification checks initiated'
    });

    await verification.save();

    // TODO: In a real system, this would trigger:
    // 1. OCR processing of documents
    // 2. Face matching and liveness detection
    // 3. Risk assessment
    // 4. NMC verification
    // For now, we'll simulate the process

    // Simulate automated verification completion after 5 seconds
    setTimeout(async () => {
      try {
        const updatedVerification = await DoctorVerification.findById(verificationId);
        if (updatedVerification && updatedVerification.status === 'automated_verification') {
          updatedVerification.status = 'manual_review';
          updatedVerification.timeline.push({
            action: 'automated_verification_completed',
            status: 'manual_review',
            timestamp: new Date(),
            notes: 'Automated verification completed, ready for admin review'
          });
          await updatedVerification.save();
        }
      } catch (error) {
        console.error('Error updating verification status:', error);
      }
    }, 5000);

    res.json({
      message: 'Automated verification initiated',
      code: 'VERIFICATION_STARTED',
      status: 'automated_verification',
      estimatedTime: '5-10 minutes',
      nextStep: 'admin_review'
    });

  } catch (error) {
    console.error('Verification trigger error:', error);
    res.status(500).json({
      message: 'Failed to trigger verification',
      code: 'VERIFICATION_TRIGGER_ERROR',
      details: error.message
    });
  }
});

// Submit appeal for rejected verification
router.post('/appeal/:verificationId', [
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Appeal reason must be 10-500 characters'),
  body('supportingDocuments').optional().isArray().withMessage('Supporting documents must be an array')
], async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { reason, supportingDocuments = [] } = req.body;
    const { tempToken } = req.headers;

    if (!tempToken) {
      return res.status(401).json({
        message: 'Temporary token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'fallback-secret');
    if (decoded.type !== 'verification_temp' || decoded.verificationId !== verificationId) {
      return res.status(401).json({
        message: 'Invalid temporary token',
        code: 'INVALID_TOKEN'
      });
    }

    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification record not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    if (verification.status !== 'rejected') {
      return res.status(400).json({
        message: 'Appeal can only be submitted for rejected verifications',
        code: 'INVALID_STATUS'
      });
    }

    if (verification.appeal.submitted) {
      return res.status(400).json({
        message: 'Appeal already submitted',
        code: 'APPEAL_ALREADY_SUBMITTED'
      });
    }

    // Submit appeal
    await verification.submitAppeal(reason, supportingDocuments);

    res.json({
      message: 'Appeal submitted successfully',
      code: 'APPEAL_SUBMITTED',
      appeal: {
        submitted: verification.appeal.submitted,
        submittedAt: verification.appeal.submittedAt,
        status: verification.appeal.status
      },
      instructions: [
        'Your appeal has been submitted for review',
        'Admin will review within 48-72 hours',
        'You will be notified of the decision',
        'Status updated to: Appeal Pending'
      ]
    });

  } catch (error) {
    console.error('Appeal submission error:', error);
    res.status(500).json({
      message: 'Appeal submission failed',
      code: 'APPEAL_ERROR',
      details: error.message
    });
  }
});

// Helper methods
router.determineDocumentType = (filename, documentTypes) => {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('nmc') || lowerFilename.includes('license')) return 'nmc_license';
  if (lowerFilename.includes('degree') || lowerFilename.includes('mbbs') || lowerFilename.includes('md')) return 'medical_degree';
  if (lowerFilename.includes('aadhaar') || lowerFilename.includes('uid')) return 'govt_id_aadhaar';
  if (lowerFilename.includes('pan') || lowerFilename.includes('tax')) return 'govt_id_pan';
  if (lowerFilename.includes('driving') || lowerFilename.includes('dl')) return 'govt_id_driving';
  if (lowerFilename.includes('experience') || lowerFilename.includes('certificate')) return 'experience_certificate';
  
  return 'other';
};

router.startAutomatedVerification = async (verification) => {
  try {
    // Get existing users for risk assessment
    const existingUsers = await User.find({ role: 'doctor' });
    
    // Perform risk assessment
    const riskAssessment = await RiskAssessmentService.assessRisk(
      {
        ...verification.personalInfo,
        ...verification.professionalInfo,
        nmcNumber: verification.nmcVerification.nmcNumber,
        documents: verification.documents
      },
      existingUsers
    );

    // Update verification with risk assessment
    verification.riskAssessment = riskAssessment;
    
    // Determine next status based on risk assessment
    if (riskAssessment.requiresManualReview) {
      verification.status = 'manual_review';
      verification.timeline.push({
        action: 'automated_verification_completed',
        status: 'manual_review',
        timestamp: new Date(),
        notes: `Risk assessment completed. Risk level: ${riskAssessment.riskLevel}. Manual review required.`
      });
    } else {
      verification.status = 'approved';
      verification.timeline.push({
        action: 'automated_verification_completed',
        status: 'approved',
        timestamp: new Date(),
        notes: `Risk assessment completed. Risk level: ${riskAssessment.riskLevel}. Auto-approved.`
      });
      
      // Activate doctor account
      await this.activateDoctorAccount(verification);
    }

    await verification.save();

  } catch (error) {
    console.error('Automated verification error:', error);
    
    // Fallback to manual review
    verification.status = 'manual_review';
    verification.timeline.push({
      action: 'automated_verification_failed',
      status: 'manual_review',
      timestamp: new Date(),
      notes: `Automated verification failed: ${error.message}. Fallback to manual review.`
    });
    
    await verification.save();
  }
};

router.activateDoctorAccount = async (verification) => {
  try {
    // Activate user account
    await User.findByIdAndUpdate(verification.userId, {
      isActive: true,
      isVerified: true
    });

    // Activate doctor profile
    await Doctor.findByIdAndUpdate(verification.doctorId, {
      isAvailable: true
    });

    // Update verification
    verification.verificationDetails.verificationMethod = 'automated';
    await verification.save();

  } catch (error) {
    console.error('Account activation error:', error);
    throw error;
  }
};

router.getEstimatedCompletion = (status) => {
  const estimates = {
    'pending_documents': '1-2 days',
    'documents_uploaded': '2-4 hours',
    'automated_verification': '2-4 hours',
    'manual_review': '24-72 hours',
    'approved': 'Immediate',
    'rejected': 'Immediate',
    'suspended': 'Varies',
    'appeal_pending': '48-72 hours'
  };
  
  return estimates[status] || 'Unknown';
};

router.getNextSteps = (status) => {
  const steps = {
    'pending_documents': ['Upload required documents', 'Complete liveness verification'],
    'documents_uploaded': ['Complete liveness verification', 'Wait for automated processing'],
    'automated_verification': ['Wait for verification results', 'Admin review if needed'],
    'manual_review': ['Wait for admin review', 'Respond to any requests'],
    'approved': ['Account activated', 'Start using the platform'],
    'rejected': ['Review rejection reason', 'Submit appeal if needed'],
    'suspended': ['Contact support', 'Provide additional information'],
    'appeal_pending': ['Wait for appeal review', 'Respond to admin requests']
  };
  
  return steps[status] || ['Contact support'];
};

// Document viewing and downloading routes
router.get('/documents/:verificationId/:documentId', async (req, res) => {
  try {
    const { verificationId, documentId } = req.params;
    
    // Verify the verification exists
    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    // Find the specific document
    const document = verification.documents.find(doc => doc._id.toString() === documentId);
    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    // Check if file exists
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(document.fileUrl)) {
      return res.status(404).json({
        message: 'File not found on server',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Set appropriate headers for viewing/downloading
    const fileName = document.fileName;
    const mimeType = document.mimeType;
    
    // Set headers for high-quality image viewing
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', document.fileSize);
    
    // For images, add cache headers to prevent compression
    if (mimeType.startsWith('image/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    // Read and serve the file with high quality
    const fileBuffer = fs.readFileSync(document.fileUrl);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Document viewing error:', error);
    res.status(500).json({
      message: 'Error viewing document',
      code: 'DOCUMENT_VIEW_ERROR',
      details: error.message
    });
  }
});

// High-quality image viewing route
router.get('/documents/:verificationId/:documentId/hq', async (req, res) => {
  try {
    const { verificationId, documentId } = req.params;
    
    // Verify the verification exists
    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    // Find the specific document
    const document = verification.documents.find(doc => doc._id.toString() === documentId);
    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    // Check if file exists
    const fs = require('fs');
    
    if (!fs.existsSync(document.fileUrl)) {
      return res.status(404).json({
        message: 'File not found on server',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Only allow images for high-quality viewing
    if (!document.mimeType.startsWith('image/')) {
      return res.status(400).json({
        message: 'High-quality viewing only available for images',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Set headers for maximum image quality
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Read and serve the file with maximum quality
    const fileBuffer = fs.readFileSync(document.fileUrl);
    res.send(fileBuffer);

  } catch (error) {
    console.error('High-quality image viewing error:', error);
    res.status(500).json({
      message: 'Error viewing high-quality image',
      code: 'HQ_IMAGE_VIEW_ERROR',
      details: error.message
    });
  }
});

// Direct file access route (original quality)
router.get('/documents/:verificationId/:documentId/original', async (req, res) => {
  try {
    const { verificationId, documentId } = req.params;
    
    // Verify the verification exists
    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    // Find the specific document
    const document = verification.documents.find(doc => doc._id.toString() === documentId);
    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    // Check if file exists
    const fs = require('fs');
    
    if (!fs.existsSync(document.fileUrl)) {
      return res.status(404).json({
        message: 'File not found on server',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Set headers for maximum quality and direct access
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Stream the file directly without any processing
    const fileStream = fs.createReadStream(document.fileUrl);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Original file access error:', error);
    res.status(500).json({
      message: 'Error accessing original file',
      code: 'ORIGINAL_FILE_ACCESS_ERROR',
      details: error.message
    });
  }
});

// Download document route
router.get('/documents/:verificationId/:documentId/download', async (req, res) => {
  try {
    const { verificationId, documentId } = req.params;
    
    // Verify the verification exists
    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    // Find the specific document
    const document = verification.documents.find(doc => doc._id.toString() === documentId);
    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    // Check if file exists
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(document.fileUrl)) {
      return res.status(404).json({
        message: 'File not found on server',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Set headers for download
    const fileName = document.fileName;
    const mimeType = document.mimeType;
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', document.fileSize);
    
    // For images, add quality preservation headers
    if (mimeType.startsWith('image/')) {
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    // Read and serve the file with high quality
    const fileBuffer = fs.readFileSync(document.fileUrl);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({
      message: 'Error downloading document',
      code: 'DOCUMENT_DOWNLOAD_ERROR',
      details: error.message
    });
  }
});

// Get document information route
router.get('/documents/:verificationId', async (req, res) => {
  try {
    const { verificationId } = req.params;
    
    // Verify the verification exists
    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        message: 'Verification not found',
        code: 'VERIFICATION_NOT_FOUND'
      });
    }

    // Return document information
    const documents = verification.documents.map(doc => ({
      id: doc._id,
      type: doc.type,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      viewUrl: `/api/doctor-verification/documents/${verificationId}/${doc._id}`,
      downloadUrl: `/api/doctor-verification/documents/${verificationId}/${doc._id}/download`
    }));

    res.json({
      success: true,
      documents,
      code: 'DOCUMENTS_RETRIEVED'
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      message: 'Error retrieving documents',
      code: 'DOCUMENTS_RETRIEVAL_ERROR',
      details: error.message
    });
  }
});

module.exports = router;
