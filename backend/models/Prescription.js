const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  medicines: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: {
      type: String,
      default: ''
    },
    isPrescriptionRequired: {
      type: Boolean,
      default: true
    }
  }],
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  validUntil: {
    type: Date,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
prescriptionSchema.index({ patientId: 1, status: 1 });
prescriptionSchema.index({ doctorId: 1, status: 1 });
prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ prescriptionId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
