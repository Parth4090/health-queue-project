const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all doctors with optional city filter
router.get('/search', async (req, res) => {
  try {
    const { city, specialization } = req.query;
    let query = {};

    // Add city filter if provided
    if (city) {
      query.city = { $regex: city, $options: 'i' }; // Case-insensitive search
    }

    // Add specialization filter if provided
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    // Find users who are doctors
    const doctorUsers = await User.find({ 
      role: 'doctor',
      isActive: true,
      ...query
    });

    // Get doctor IDs
    const doctorIds = doctorUsers.map(user => user._id);

    // Get doctor profiles with distinct results
    const doctors = await Doctor.aggregate([
      { $match: { userId: { $in: doctorIds } } },
      { $group: { _id: '$userId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { rating: -1, experience: -1 } }
    ]);

    // Populate user data for each doctor
    const populatedDoctors = await Doctor.populate(doctors, {
      path: 'userId',
      select: 'name email phone city address',
      model: 'User'
    });

    res.json(populatedDoctors);
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor by ID with full profile
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.params.id })
      .populate('userId', 'name email phone city address dateOfBirth gender');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all cities where doctors are available
router.get('/cities/list', async (req, res) => {
  try {
    const cities = await User.distinct('city', { 
      role: 'doctor', 
      isActive: true 
    });
    
    res.json(cities.sort());
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all specializations
router.get('/specializations/list', async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization');
    res.json(specializations.sort());
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clean up duplicate doctor entries (admin only)
router.post('/cleanup-duplicates', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Find and remove duplicate doctor entries
    const duplicates = await Doctor.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    let removedCount = 0;
    for (const duplicate of duplicates) {
      // Keep the first document, remove the rest
      const docsToRemove = duplicate.docs.slice(1);
      for (const doc of docsToRemove) {
        await Doctor.findByIdAndDelete(doc._id);
        removedCount++;
      }
    }

    res.json({ 
      message: `Cleaned up ${removedCount} duplicate doctor entries`,
      duplicatesFound: duplicates.length
    });
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check for duplicates
router.get('/debug/duplicates', async (req, res) => {
  try {
    const duplicates = await Doctor.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    res.json({ 
      duplicates,
      totalDuplicates: duplicates.length,
      message: duplicates.length > 0 ? 'Found duplicate entries' : 'No duplicates found'
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
