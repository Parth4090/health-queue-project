const mongoose = require('mongoose');

// Document verification schema with OCR and AI analysis
const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['nmc_license', 'medical_degree', 'govt_id_aadhaar', 'govt_id_pan', 'govt_id_driving', 'experience_certificate', 'other'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: Number,
  mimeType: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  // OCR and AI verification results
  ocrData: {
    extractedText: String,
    confidence: Number, // 0-100
    extractedFields: {
      name: String,
      dateOfBirth: Date,
      licenseNumber: String,
      issuingAuthority: String,
      expiryDate: Date,
      documentNumber: String
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'manual_review'],
      default: 'pending'
    }
  },
  
  // DigiLocker verification
  digiLockerVerification: {
    isVerified: Boolean,
    verificationId: String,
    verifiedAt: Date,
    documentHash: String
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verifiedAt: Date,
  verificationNotes: String
});

// Liveness detection and biometric verification
const livenessVerificationSchema = new mongoose.Schema({
  videoUrl: String,
  videoHash: String,
  livenessScore: Number, // 0-100
  blinkDetected: Boolean,
  headTurnDetected: Boolean,
  faceMatchScore: Number, // 0-100
  faceMatchThreshold: {
    type: Number,
    default: 85
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'passed', 'failed', 'manual_review'],
    default: 'pending'
  },
  processedAt: Date,
  aiModel: String,
  confidence: Number
});

// NMC verification details
const nmcVerificationSchema = new mongoose.Schema({
  nmcNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  stateCouncil: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'manual_review'],
    default: 'pending'
  },
  verificationResult: {
    name: String,
    registrationDate: Date,
    expiryDate: Date,
    specialization: String,
    status: String, // active, suspended, expired
    councilName: String
  },
  lastVerifiedAt: Date,
  verificationSource: String, // 'api', 'manual', 'periodic_sync'
  confidence: Number
});

// Risk assessment results
const riskAssessmentSchema = new mongoose.Schema({
  overallRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  riskFactors: [{
    factor: String,
    score: Number,
    description: String,
    severity: String
  }],
  automatedChecks: {
    duplicateAccounts: {
      detected: Boolean,
      count: Number,
      details: String
    },
    disposableEmail: {
      detected: Boolean,
      provider: String,
      risk: String
    },
    phoneValidation: {
      valid: Boolean,
      carrier: String,
      risk: String
    },
    consultationFeeValidation: {
      withinRange: Boolean,
      expectedRange: String,
      risk: String
    },
    documentAuthenticity: {
      score: Number,
      analysis: String
    }
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  nextAssessmentDate: Date
});

// Enhanced doctor verification schema
const doctorVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  
  // Enhanced status with verification stages
  status: {
    type: String,
    enum: [
      'pending_documents',      // Initial state
      'documents_uploaded',     // All docs uploaded
      'automated_verification', // AI/OCR processing
      'manual_review',          // Admin review needed
      'approved',               // Fully verified
      'rejected',               // Verification failed
      'suspended',              // Temporarily suspended
      'appeal_pending'          // Appeal submitted
    ],
    default: 'pending_documents'
  },
  
  // Personal information with enhanced validation
  personalInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    aadhaarHash: String, // Only store hash, not actual number
    panHash: String      // Only store hash, not actual number
  },
  
  // Professional information with validation
  professionalInfo: {
    specialization: {
      type: String,
      required: true
    },
    qualification: {
      type: String,
      required: true
    },
    experience: {
      type: Number,
      required: true,
      min: 0
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 100,
      max: 10000 // Reasonable range validation
    },
    clinicName: String,
    clinicAddress: String,
    workingHours: {
      start: String,
      end: String
    },
    workingDays: [String]
  },
  
  // Enhanced verification details
  verificationDetails: {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    reviewedAt: Date,
    reviewNotes: String,
    rejectionReason: String,
    adminComments: String,
    verificationMethod: {
      type: String,
      enum: ['automated', 'manual', 'hybrid'],
      default: 'automated'
    }
  },
  
  // Documents with enhanced verification
  documents: [documentSchema],
  
  // NMC verification
  nmcVerification: nmcVerificationSchema,
  
  // Liveness and biometric verification
  livenessVerification: livenessVerificationSchema,
  
  // Risk assessment
  riskAssessment: riskAssessmentSchema,
  
  // Compliance and consent
  compliance: {
    termsAccepted: {
      type: Boolean,
      default: false
    },
    privacyPolicyAccepted: {
      type: Boolean,
      default: false
    },
    codeOfConductAccepted: {
      type: Boolean,
      default: false
    },
    dataProcessingConsent: {
      type: Boolean,
      default: false
    },
    aadhaarConsent: {
      type: Boolean,
      default: false
    },
    consentTimestamp: Date
  },
  
  // Enhanced timeline with detailed audit trail
  timeline: [{
    action: String,
    status: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    metadata: mongoose.Schema.Types.Mixed, // Additional context
    ipAddress: String,
    userAgent: String
  }],
  
  // Appeal and retry information
  appeal: {
    submitted: Boolean,
    submittedAt: Date,
    reason: String,
    supportingDocuments: [String],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    reviewedAt: Date,
    reviewNotes: String
  },
  
  // Verification thresholds and configuration
  verificationConfig: {
    faceMatchThreshold: {
      type: Number,
      default: 85,
      min: 70,
      max: 95
    },
    ocrConfidenceThreshold: {
      type: Number,
      default: 80,
      min: 60,
      max: 95
    },
    riskScoreThreshold: {
      type: Number,
      default: 70,
      min: 50,
      max: 90
    },
    autoApprovalEnabled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for performance and queries
doctorVerificationSchema.index({ status: 1 });
doctorVerificationSchema.index({ 'personalInfo.city': 1 });
doctorVerificationSchema.index({ 'personalInfo.state': 1 });
doctorVerificationSchema.index({ 'professionalInfo.specialization': 1 });
doctorVerificationSchema.index({ submittedAt: 1 });
doctorVerificationSchema.index({ 'verificationDetails.reviewedBy': 1 });
doctorVerificationSchema.index({ 'nmcVerification.nmcNumber': 1 });
doctorVerificationSchema.index({ 'riskAssessment.riskLevel': 1 });
doctorVerificationSchema.index({ 'riskAssessment.overallRiskScore': 1 });

// Virtual for full name
doctorVerificationSchema.virtual('fullName').get(function() {
  return this.personalInfo.name;
});

// Virtual for days since submission
doctorVerificationSchema.virtual('daysSinceSubmission').get(function() {
  const now = new Date();
  const submitted = this.verificationDetails.submittedAt;
  const diffTime = Math.abs(now - submitted);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for verification progress
doctorVerificationSchema.virtual('verificationProgress').get(function() {
  const stages = [
    'pending_documents',
    'documents_uploaded', 
    'automated_verification',
    'manual_review',
    'approved'
  ];
  const currentIndex = stages.indexOf(this.status);
  return Math.round((currentIndex / (stages.length - 1)) * 100);
});

// Pre-save middleware to update timeline
doctorVerificationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      action: 'status_changed',
      status: this.status,
      performedBy: this.verificationDetails.reviewedBy,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`,
      metadata: {
        previousStatus: this._original?.status || 'unknown'
      }
    });
  }
  next();
});

// Instance methods
doctorVerificationSchema.methods.addTimelineEvent = function(action, status, adminId, notes = '', metadata = {}) {
  this.timeline.push({
    action,
    status,
    performedBy: adminId,
    timestamp: new Date(),
    notes,
    metadata
  });
  return this.save();
};

doctorVerificationSchema.methods.updateRiskAssessment = function(assessment) {
  this.riskAssessment = { ...this.riskAssessment, ...assessment };
  this.riskAssessment.assessmentDate = new Date();
  
  // Determine next assessment date based on risk level
  const daysToNextAssessment = {
    'low': 30,
    'medium': 15,
    'high': 7,
    'critical': 3
  };
  
  const days = daysToNextAssessment[this.riskAssessment.riskLevel] || 30;
  this.riskAssessment.nextAssessmentDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  return this.save();
};

doctorVerificationSchema.methods.approve = function(adminId, notes = '') {
  this.status = 'approved';
  this.verificationDetails.reviewedBy = adminId;
  this.verificationDetails.reviewedAt = new Date();
  this.verificationDetails.reviewNotes = notes;
  this.verificationDetails.verificationMethod = 'manual';
  
  // Mark all documents as verified
  this.documents.forEach(doc => {
    doc.verified = true;
    doc.verifiedBy = adminId;
    doc.verifiedAt = new Date();
  });
  
  return this.save();
};

doctorVerificationSchema.methods.reject = function(adminId, reason, notes = '') {
  this.status = 'rejected';
  this.verificationDetails.reviewedBy = adminId;
  this.verificationDetails.reviewedAt = new Date();
  this.verificationDetails.rejectionReason = reason;
  this.verificationDetails.adminComments = notes;
  
  return this.save();
};

doctorVerificationSchema.methods.suspend = function(adminId, reason, notes = '') {
  this.status = 'suspended';
  this.verificationDetails.reviewedBy = adminId;
  this.verificationDetails.reviewedAt = new Date();
  this.verificationDetails.adminComments = notes;
  
  return this.save();
};

doctorVerificationSchema.methods.submitAppeal = function(reason, supportingDocuments = []) {
  this.appeal = {
    submitted: true,
    submittedAt: new Date(),
    reason,
    supportingDocuments,
    status: 'pending'
  };
  this.status = 'appeal_pending';
  
  return this.save();
};

// Static methods
doctorVerificationSchema.statics.findPending = function() {
  return this.find({ 
    status: { $in: ['pending_documents', 'documents_uploaded', 'automated_verification', 'manual_review'] }
  })
    .populate('userId', 'name email phone')
    .populate('verificationDetails.reviewedBy', 'profile.firstName profile.lastName')
    .sort({ submittedAt: 1 });
};

doctorVerificationSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('userId', 'name email phone')
    .populate('verificationDetails.reviewedBy', 'profile.firstName profile.lastName')
    .sort({ submittedAt: -1 });
};

doctorVerificationSchema.statics.findHighRisk = function() {
  return this.find({ 
    'riskAssessment.riskLevel': { $in: ['high', 'critical'] },
    status: { $ne: 'approved' }
  })
    .populate('userId', 'name email phone')
    .sort({ 'riskAssessment.overallRiskScore': -1 });
};

doctorVerificationSchema.statics.findByNMCNumber = function(nmcNumber) {
  return this.findOne({ 'nmcVerification.nmcNumber': nmcNumber.toUpperCase() });
};

module.exports = mongoose.model('DoctorVerification', doctorVerificationSchema);
