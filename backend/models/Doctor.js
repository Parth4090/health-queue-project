const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
    min: 0
  },
  avgConsultationTime: {
    type: Number,
    default: 15, // in minutes
    min: 5,
    max: 60
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '17:00'
    }
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  maxQueueSize: {
    type: Number,
    default: 50
  },
  currentQueueSize: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  clinicName: {
    type: String
  },
  clinicAddress: {
    type: String
  },
  consultationHistory: [{
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    consultationTime: Number, // in minutes
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add unique compound index to prevent duplicate doctor entries
doctorSchema.index({ userId: 1 }, { unique: true });

// Calculate average consultation time from recent consultations
doctorSchema.methods.updateAvgConsultationTime = function() {
  const recentConsultations = this.consultationHistory
    .slice(-10) // Last 10 consultations
    .filter(consultation => consultation.consultationTime > 0);
  
  if (recentConsultations.length > 0) {
    const totalTime = recentConsultations.reduce((sum, consultation) => 
      sum + consultation.consultationTime, 0);
    this.avgConsultationTime = Math.round(totalTime / recentConsultations.length);
  }
};

// Add consultation to history
doctorSchema.methods.addConsultation = function(patientId, consultationTime) {
  this.consultationHistory.push({
    patientId,
    consultationTime,
    date: new Date()
  });
  
  // Keep only last 50 consultations
  if (this.consultationHistory.length > 50) {
    this.consultationHistory = this.consultationHistory.slice(-50);
  }
  
  this.updateAvgConsultationTime();
};

module.exports = mongoose.model('Doctor', doctorSchema);
