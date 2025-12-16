const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 4,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_doctors',
      'manage_patients', 
      'manage_queues',
      'view_analytics',
      'manage_admins',
      'approve_registrations',
      'suspend_accounts'
    ]
  }],
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  backupCodes: [{
    code: String,
    used: { type: Boolean, default: false }
  }],
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: String
  },
  securityLog: [{
    action: String,
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for performance and security
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ lockUntil: 1 });

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Check if account is locked
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.lockUntil = undefined;
    this.loginAttempts = 1;
    return;
  }
  
  // Increment login attempts
  this.loginAttempts = (this.loginAttempts || 0) + 1;
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts >= 5 && !this.isLocked) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }
};

adminSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
};

adminSchema.methods.generateTwoFactorSecret = function() {
  const secret = crypto.randomBytes(20).toString('hex');
  this.twoFactorSecret = secret;
  
  // Generate backup codes
  this.backupCodes = Array.from({ length: 10 }, () => ({
    code: crypto.randomBytes(4).toString('hex').toUpperCase(),
    used: false
  }));
  
  return secret;
};

adminSchema.methods.verifyTwoFactorToken = function(token) {
  if (!this.twoFactorSecret) return false;
  
  // Check if it's a backup code
  const backupCode = this.backupCodes.find(code => 
    code.code === token && !code.used
  );
  
  if (backupCode) {
    backupCode.used = true;
    return true;
  }
  
  // For TOTP verification (you can integrate with libraries like speakeasy)
  // This is a simplified version
  return false;
};

// Static methods
adminSchema.statics.findByCredentials = async function(username, password) {
  const admin = await this.findOne({ 
    $or: [{ username }, { email: username }],
    isActive: true 
  }).select('+password +twoFactorSecret +backupCodes');
  
  if (!admin) {
    throw new Error('Invalid credentials');
  }
  
  // Check if account is locked
  if (admin.lockUntil && admin.lockUntil > Date.now()) {
    throw new Error('Account is locked due to multiple failed login attempts');
  }
  
  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    await admin.incrementLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  await admin.resetLoginAttempts();
  admin.lastLogin = new Date();
  await admin.save();
  
  return admin;
};

// Security logging
adminSchema.methods.logSecurityEvent = function(action, req) {
  this.securityLog.push({
    action,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date()
  });
  
  // Keep only last 100 security events
  if (this.securityLog.length > 100) {
    this.securityLog = this.securityLog.slice(-100);
  }
  
  return this.save();
};

module.exports = mongoose.model('Admin', adminSchema);
