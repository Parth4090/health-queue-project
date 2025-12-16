const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find admin and check if active
    const admin = await Admin.findOne({ 
      _id: decoded.id, 
      isActive: true 
    }).select('-password');

    if (!admin) {
      return res.status(401).json({ 
        message: 'Invalid token or admin account inactive.',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if account is locked
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      return res.status(423).json({ 
        message: 'Account is locked due to multiple failed login attempts.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Add admin to request
    req.admin = admin;
    
    // Log security event
    await admin.logSecurityEvent('admin_access', req);
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Admin auth error:', error);
    res.status(500).json({ 
      message: 'Internal server error.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ 
        message: 'Insufficient privileges.',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    next();
  };
};

// Permission-based access control middleware
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Super admin has all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has required permissions
    const hasPermission = permissions.some(permission => 
      req.admin.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Rate limiting for admin routes
const adminRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
};

// 2FA verification middleware
const require2FA = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.admin.twoFactorEnabled) {
      const { twoFactorToken } = req.body;
      
      if (!twoFactorToken) {
        return res.status(400).json({ 
          message: 'Two-factor authentication token required.',
          code: '2FA_TOKEN_REQUIRED'
        });
      }

      const isValid = await req.admin.verifyTwoFactorToken(twoFactorToken);
      
      if (!isValid) {
        return res.status(400).json({ 
          message: 'Invalid two-factor authentication token.',
          code: 'INVALID_2FA_TOKEN'
        });
      }
    }

    next();
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ 
      message: 'Internal server error.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Audit logging middleware
const auditLog = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      if (req.admin) {
        req.admin.logSecurityEvent(action, req);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// IP whitelist middleware (optional)
const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs && allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({ 
        message: 'Access denied from this IP address.',
        code: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
};

module.exports = {
  adminAuth,
  requireRole,
  requirePermission,
  adminRateLimit,
  require2FA,
  auditLog,
  ipWhitelist
};
