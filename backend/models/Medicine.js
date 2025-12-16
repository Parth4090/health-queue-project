const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  strength: {
    type: String,
    required: true,
    trim: true
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
medicineSchema.index({ pharmacyId: 1, isActive: 1 });
medicineSchema.index({ name: 1, genericName: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ prescriptionRequired: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
