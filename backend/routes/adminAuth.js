const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { adminAuth, requireRole, auditLog } = require('../middleware/adminAuth');
const rateLimit = require('express-rate-limit');

// Rate limiting for login attempts
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    message: 'Too many login attempts, please try again later.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Admin login
router.post('/login', [
  body('username').trim().isLength({ min: 4, max: 20 }).withMessage('Username must be 4-20 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('twoFactorToken').optional().isString().withMessage('Invalid 2FA token')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { username, password, twoFactorToken } = req.body;

    // Find admin by username or email
    const admin = await Admin.findByCredentials(username, password);
    
    if (!admin) {
      return res.status(401).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if 2FA is required
    if (admin.twoFactorEnabled && !twoFactorToken) {
      return res.status(400).json({
        message: 'Two-factor authentication required',
        code: '2FA_REQUIRED',
        requires2FA: true
      });
    }

    // Verify 2FA token if provided
    if (admin.twoFactorEnabled && twoFactorToken) {
      const isValid = await admin.verifyTwoFactorToken(twoFactorToken);
      if (!isValid) {
        return res.status(400).json({
          message: 'Invalid two-factor authentication token',
          code: 'INVALID_2FA_TOKEN'
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        role: admin.role,
        permissions: admin.permissions 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Log successful login
    await admin.logSecurityEvent('admin_login_success', req);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        profile: admin.profile,
        twoFactorEnabled: admin.twoFactorEnabled
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
});

// Admin logout
router.post('/logout', adminAuth, auditLog('admin_logout'), async (req, res) => {
  try {
    await req.admin.logSecurityEvent('admin_logout', req);
    
    res.json({
      message: 'Logout successful',
      code: 'LOGOUT_SUCCESS'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get current admin profile
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id)
      .select('-password -twoFactorSecret -backupCodes')
      .populate('verificationDetails.reviewedBy', 'profile.firstName profile.lastName');

    res.json({
      admin,
      code: 'PROFILE_RETRIEVED'
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update admin profile
router.put('/profile', adminAuth, [
  body('profile.firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('profile.lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('profile.phone').optional().trim().isLength({ min: 10, max: 15 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const updates = req.body;
    const admin = await Admin.findById(req.admin._id);

    // Update allowed fields
    if (updates.profile) {
      admin.profile = { ...admin.profile, ...updates.profile };
    }
    if (updates.email) {
      admin.email = updates.email;
    }

    await admin.save();
    await admin.logSecurityEvent('admin_profile_updated', req);

    res.json({
      message: 'Profile updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        profile: admin.profile
      },
      code: 'PROFILE_UPDATED'
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Change password
router.put('/change-password', adminAuth, [
  body('currentPassword').isLength({ min: 8 }),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password');

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect',
        code: 'INCORRECT_CURRENT_PASSWORD'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();
    await admin.logSecurityEvent('admin_password_changed', req);

    res.json({
      message: 'Password changed successfully',
      code: 'PASSWORD_CHANGED'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Setup 2FA
router.post('/setup-2fa', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    
    if (admin.twoFactorEnabled) {
      return res.status(400).json({
        message: 'Two-factor authentication is already enabled',
        code: '2FA_ALREADY_ENABLED'
      });
    }

    // Generate 2FA secret and backup codes
    const secret = admin.generateTwoFactorSecret();
    await admin.save();

    await admin.logSecurityEvent('admin_2fa_setup', req);

    res.json({
      message: 'Two-factor authentication setup successful',
      secret,
      backupCodes: admin.backupCodes.map(code => code.code),
      qrCode: `otpauth://totp/HealthQueue:${admin.username}?secret=${secret}&issuer=HealthQueue`,
      code: '2FA_SETUP_SUCCESS'
    });

  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Disable 2FA
router.delete('/disable-2fa', adminAuth, [
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { password } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password');

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Password is incorrect',
        code: 'INCORRECT_PASSWORD'
      });
    }

    // Disable 2FA
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    admin.backupCodes = [];
    await admin.save();

    await admin.logSecurityEvent('admin_2fa_disabled', req);

    res.json({
      message: 'Two-factor authentication disabled successfully',
      code: '2FA_DISABLED'
    });

  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get security log
router.get('/security-log', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    const { page = 1, limit = 50 } = req.query;

    const securityLog = admin.securityLog
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((page - 1) * limit, page * limit);

    res.json({
      securityLog,
      total: admin.securityLog.length,
      page: parseInt(page),
      limit: parseInt(limit),
      code: 'SECURITY_LOG_RETRIEVED'
    });

  } catch (error) {
    console.error('Get security log error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh-token', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    
    // Generate new token
    const token = jwt.sign(
      { 
        id: admin._id, 
        role: admin.role,
        permissions: admin.permissions 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await admin.logSecurityEvent('admin_token_refreshed', req);

    res.json({
      message: 'Token refreshed successfully',
      token,
      code: 'TOKEN_REFRESHED'
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
