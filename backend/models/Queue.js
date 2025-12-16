const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in-consultation', 'completed', 'cancelled'],
    default: 'waiting'
  },
  position: {
    type: Number,
    required: true
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  actualWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  consultationStartTime: {
    type: Date
  },
  consultationEndTime: {
    type: Date
  },
  notes: {
    type: String
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Index for efficient queries
queueSchema.index({ doctorId: 1, status: 1, position: 1 });
queueSchema.index({ patientId: 1, status: 1 });
queueSchema.index({ status: 1, createdAt: 1 });

// Virtual for current wait time
queueSchema.virtual('currentWaitTime').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return this.actualWaitTime;
  }
  
  if (this.consultationStartTime) {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
  }
  
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Ensure virtual fields are serialized
queueSchema.set('toJSON', { virtuals: true });
queueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Queue', queueSchema);
