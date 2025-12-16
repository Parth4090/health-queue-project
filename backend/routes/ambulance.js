const express = require('express');
const { body, validationResult } = require('express-validator');
const Ambulance = require('../models/Ambulance');
const { auth, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Get available ambulances by city
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { type } = req.query;

    let query = { city, isAvailable: true };
    if (type) {
      query.ambulanceType = type;
    }

    const ambulances = await Ambulance.find(query)
      .select('-licenseNumber')
      .sort('responseTime');

    res.json(ambulances);
  } catch (error) {
    console.error('Error fetching ambulances:', error);
    res.status(500).json({ error: 'Failed to fetch ambulances' });
  }
});

// Get ambulance details
router.get('/:ambulanceId', async (req, res) => {
  try {
    const { ambulanceId } = req.params;
    
    const ambulance = await Ambulance.findById(ambulanceId)
      .select('-licenseNumber');

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    res.json(ambulance);
  } catch (error) {
    console.error('Error fetching ambulance:', error);
    res.status(500).json({ error: 'Failed to fetch ambulance details' });
  }
});

// Emergency SOS - Book ambulance
router.post('/emergency-sos', requirePatient, [
  body('ambulanceId').isMongoId().withMessage('Valid ambulance ID is required'),
  body('patientLatitude').isFloat().withMessage('Valid latitude is required'),
  body('patientLongitude').isFloat().withMessage('Valid longitude is required'),
  body('patientAddress').trim().notEmpty().withMessage('Patient address is required'),
  body('emergencyType').optional().isIn(['medical', 'accident', 'cardiac', 'other']),
  body('description').optional().trim(),
  body('contactPhone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      ambulanceId,
      patientLatitude,
      patientLongitude,
      patientAddress,
      emergencyType = 'medical',
      description,
      contactPhone
    } = req.body;

    const patientId = req.user._id;

    // Validate ambulance
    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance || !ambulance.isAvailable) {
      return res.status(400).json({ error: 'Ambulance is not available' });
    }

    // Check if patient is within service area
    const distance = calculateDistance(
      patientLatitude,
      patientLongitude,
      ambulance.coordinates.latitude,
      ambulance.coordinates.longitude
    );

    if (distance > ambulance.serviceArea) {
      return res.status(400).json({ 
        error: 'Patient is outside ambulance service area',
        distance: Math.round(distance * 100) / 100,
        maxServiceArea: ambulance.serviceArea
      });
    }

    // Calculate estimated arrival time
    const estimatedArrivalTime = Math.ceil(distance * 2) + ambulance.responseTime; // 2 min per km + response time

    // Calculate fare
    const fare = ambulance.baseFare + (distance * ambulance.perKmRate);

    // Create emergency booking (you would typically have an EmergencyBooking model)
    const emergencyBooking = {
      bookingId: `EMG${Date.now()}`,
      patientId,
      ambulanceId,
      patientLatitude,
      patientLongitude,
      patientAddress,
      emergencyType,
      description,
      contactPhone: contactPhone || req.user.phone,
      distance: Math.round(distance * 100) / 100,
      estimatedArrivalTime,
      fare: Math.round(fare * 100) / 100,
      status: 'dispatched',
      createdAt: new Date()
    };

    // Here you would save the booking to database
    // For now, we'll just return the booking details

    res.status(201).json({
      message: 'Emergency ambulance dispatched successfully',
      booking: {
        bookingId: emergencyBooking.bookingId,
        estimatedArrivalTime,
        fare: emergencyBooking.fare,
        status: emergencyBooking.status,
        ambulance: {
          providerName: ambulance.providerName,
          phone: ambulance.phone,
          emergencyPhone: ambulance.emergencyPhone,
          type: ambulance.ambulanceType
        }
      }
    });
  } catch (error) {
    console.error('Error booking emergency ambulance:', error);
    res.status(500).json({ error: 'Failed to book emergency ambulance' });
  }
});

// Get nearest ambulances by coordinates
router.post('/nearest', [
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required'),
  body('radius').optional().isFloat({ min: 1, max: 100 }).withMessage('Radius must be between 1 and 100 km'),
  body('type').optional().isIn(['basic', 'advanced', 'cardiac', 'neonatal', 'air'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude, radius = 25, type } = req.params;

    let query = { isAvailable: true };
    if (type) {
      query.ambulanceType = type;
    }

    const ambulances = await Ambulance.find(query);

    // Calculate distances and filter by radius
    const ambulancesWithDistance = ambulances
      .map(ambulance => {
        const distance = calculateDistance(
          latitude,
          longitude,
          ambulance.coordinates.latitude,
          ambulance.coordinates.longitude
        );
        return {
          ...ambulance.toObject(),
          distance: Math.round(distance * 100) / 100,
          estimatedArrivalTime: Math.ceil(distance * 2) + ambulance.responseTime
        };
      })
      .filter(ambulance => ambulance.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Return top 10 nearest

    res.json(ambulancesWithDistance);
  } catch (error) {
    console.error('Error finding nearest ambulances:', error);
    res.status(500).json({ error: 'Failed to find nearest ambulances' });
  }
});

// Update ambulance status (for ambulance providers)
router.put('/status/:ambulanceId', [
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
  body('currentLocation').optional().isObject().withMessage('currentLocation must be an object'),
  body('currentLocation.latitude').optional().isFloat(),
  body('currentLocation.longitude').optional().isFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ambulanceId } = req.params;
    const { isAvailable, currentLocation } = req.body;

    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    // Update status
    ambulance.isAvailable = isAvailable;
    if (currentLocation) {
      ambulance.coordinates = currentLocation;
    }

    await ambulance.save();

    res.json({
      message: 'Ambulance status updated successfully',
      ambulance: {
        id: ambulance._id,
        isAvailable: ambulance.isAvailable,
        coordinates: ambulance.coordinates
      }
    });
  } catch (error) {
    console.error('Error updating ambulance status:', error);
    res.status(500).json({ error: 'Failed to update ambulance status' });
  }
});

// Get emergency booking status
router.get('/booking/:bookingId', requirePatient, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const patientId = req.user._id;

    // This would typically fetch booking from database
    // For now, we'll return a mock response
    
    res.json({
      booking: {
        id: bookingId,
        status: 'in-transit',
        estimatedArrivalTime: 15,
        currentLocation: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        ambulance: {
          providerName: 'City Ambulance Service',
          phone: '+1234567890',
          type: 'advanced'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching booking status:', error);
    res.status(500).json({ error: 'Failed to fetch booking status' });
  }
});

// Cancel emergency booking
router.delete('/booking/:bookingId', requirePatient, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const patientId = req.user._id;

    // This would typically cancel the booking in database
    // For now, we'll just return a success message

    res.json({
      message: 'Emergency booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get ambulance types
router.get('/types', async (req, res) => {
  try {
    const types = [
      { value: 'basic', label: 'Basic Ambulance', description: 'Standard emergency transport' },
      { value: 'advanced', label: 'Advanced Ambulance', description: 'Equipped with advanced life support' },
      { value: 'cardiac', label: 'Cardiac Ambulance', description: 'Specialized for cardiac emergencies' },
      { value: 'neonatal', label: 'Neonatal Ambulance', description: 'Specialized for newborn emergencies' },
      { value: 'air', label: 'Air Ambulance', description: 'Emergency air transport' }
    ];

    res.json(types);
  } catch (error) {
    console.error('Error fetching ambulance types:', error);
    res.status(500).json({ error: 'Failed to fetch ambulance types' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
