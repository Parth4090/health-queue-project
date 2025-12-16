const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
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
  deliveryAvailable: {
    type: Boolean,
    default: true
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  workingHours: {
    open: {
      type: String,
      default: '9:00 AM'
    },
    close: {
      type: String,
      default: '9:00 PM'
    }
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
pharmacySchema.index({ city: 1, isActive: 1 });
pharmacySchema.index({ deliveryAvailable: 1 });
pharmacySchema.index({ rating: -1 });
pharmacySchema.index({ name: 1 });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
