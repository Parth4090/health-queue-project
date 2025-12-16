const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { auth } = require('../middleware/auth');
const socketService = require('../services/socketService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

// Patient Registration
router.post('/register/patient', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('phone').isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10-20 characters'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('address').trim().notEmpty().withMessage('Address is required')
], async (req, res) => {
  try {
    console.log('Patient registration request body:', req.body);
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database connection not available. Please try again later.',
        details: 'MongoDB is not connected'
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, city, state, address, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // Create new patient
    const user = new User({
      name,
      email,
      password,
      phone,
      city,
      state,
      address,
      dateOfBirth,
      gender,
      role: 'patient'
    });

    await user.save();

    // Emit real-time event for new patient
    socketService.emitNewPatient({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      state: user.state,
      role: user.role,
      createdAt: user.createdAt
    });

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'Patient registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        state: user.state
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Doctor Registration (Basic - for verification workflow)
router.post('/register/doctor', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('phone').isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10-20 characters'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
  body('gender').trim().notEmpty().withMessage('Gender is required')
], async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database connection not available. Please try again later.',
        details: 'MongoDB is not connected'
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, city, state, address, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // Create new doctor user (basic account - not verified yet)
    const user = new User({
      name,
      email,
      password,
      phone,
      city,
      state,
      address,
      dateOfBirth,
      gender,
      role: 'doctor',
      isVerified: false, // Important: doctor is not verified yet
      isActive: true
    });

    await user.save();

    // Generate a temporary token for verification process
    const tempToken = jwt.sign(
      { 
        userId: user._id, 
        type: 'verification_temp',
        verificationId: null // Will be set when verification is created
      }, 
      process.env.JWT_SECRET || 'fallback-secret', 
      { expiresIn: '24h' }
    );

    // Emit real-time event for new doctor
    socketService.emitNewDoctor({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      state: user.state,
      role: user.role,
      isVerified: false,
      createdAt: user.createdAt
    });

    res.status(201).json({
      message: 'Doctor account created successfully. Please complete verification.',
      tempToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        state: user.state,
        isVerified: false
      },
      nextStep: 'verification_required'
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({ error: 'Doctor registration failed', details: error.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database connection not available. Please try again later.',
        details: 'MongoDB is not connected'
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Get additional profile data for doctors
    let profileData = {};
    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: user._id });
      if (doctorProfile) {
        profileData = doctorProfile;
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        isVerified: user.isVerified,
        profile: profileData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    let profileData = {};

    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: user._id });
      if (doctorProfile) {
        profileData = doctorProfile;
      }
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        profile: profileData
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('city').optional().trim().notEmpty(),
  body('address').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'phone', 'city', 'address', 'dateOfBirth', 'gender'];
    
    // Filter allowed updates
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
