const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  providerName: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  emergencyPhone: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  ambulanceType: {
    type: String,
    enum: ['basic', 'advanced', 'cardiac', 'neonatal', 'air'],
    default: 'basic'
  },
  equipment: [{
    type: String
  }],
  staff: {
    driver: {
      type: Boolean,
      default: true
    },
    paramedic: {
      type: Boolean,
      default: true
    },
    doctor: {
      type: Boolean,
      default: false
    },
    nurse: {
      type: Boolean,
      default: false
    }
  },
  responseTime: {
    type: Number, // in minutes
    default: 15
  },
  serviceArea: {
    type: Number, // in kilometers
    default: 25
  },
  baseFare: {
    type: Number,
    required: true
  },
  perKmRate: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for location-based queries
ambulanceSchema.index({ city: 1, isAvailable: 1 });
ambulanceSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
