const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const Doctor = require('../models/Doctor');
const { auth } = require('../middleware/auth');
const socketService = require('../services/socketService');

// Join a doctor's queue
router.post('/join', auth, async (req, res) => {
  try {
    const { doctorId, priority = 'normal', notes } = req.body;
    const patientId = req.user.id;

    // Check if patient is already in any queue
    const existingQueue = await Queue.findOne({
      patientId,
      status: { $in: ['waiting', 'in-consultation'] }
    });

    if (existingQueue) {
      return res.status(400).json({ 
        message: 'You are already in a queue. Please leave the current queue first.' 
      });
    }

    // Get the next position in the doctor's queue
    const lastPosition = await Queue.findOne({ 
      doctorId, 
      status: { $in: ['waiting', 'in-consultation'] } 
    }).sort({ position: -1 });

    const newPosition = lastPosition ? lastPosition.position + 1 : 1;

    // Get doctor's profile information
    const doctor = await Doctor.findOne({ userId: doctorId });
    const avgConsultationTime = doctor ? doctor.avgConsultationTime : 15;

    // Calculate estimated wait time
    const estimatedWaitTime = (newPosition - 1) * avgConsultationTime;

    const queueEntry = new Queue({
      doctorId,
      patientId,
      position: newPosition,
      priority,
      notes,
      estimatedWaitTime
    });

    await queueEntry.save();

    // Populate the queue entry for response
    await queueEntry.populate('doctorId', 'name specialization city');
    await queueEntry.populate('patientId', 'name');

    // Emit real-time event for new queue
    socketService.emitNewQueue({
      id: queueEntry._id,
      doctorId: queueEntry.doctorId,
      patientId: queueEntry.patientId,
      position: queueEntry.position,
      status: queueEntry.status,
      priority: queueEntry.priority,
      estimatedWaitTime: queueEntry.estimatedWaitTime,
      createdAt: queueEntry.createdAt
    });

    res.status(201).json({
      message: 'Successfully joined the queue',
      queueEntry
    });
  } catch (error) {
    console.error('Error joining queue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a queue
router.post('/leave', auth, async (req, res) => {
  try {
    const { queueId } = req.body;
    const patientId = req.user.id;

    const queueEntry = await Queue.findOne({
      _id: queueId,
      patientId,
      status: 'waiting'
    });

    if (!queueEntry) {
      return res.status(404).json({ 
        message: 'Queue entry not found or cannot be left' 
      });
    }

    // Update status to cancelled
    queueEntry.status = 'cancelled';
    await queueEntry.save();

    // Emit real-time event for queue update
    socketService.emitQueueUpdated({
      id: queueEntry._id,
      doctorId: queueEntry.doctorId,
      patientId: queueEntry.patientId,
      status: queueEntry.status,
      position: queueEntry.position,
      updatedAt: new Date()
    });

    // Reorder remaining positions
    await reorderQueuePositions(queueEntry.doctorId);

    res.json({ message: 'Successfully left the queue' });
  } catch (error) {
    console.error('Error leaving queue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient's current queue status
router.get('/patient/status', auth, async (req, res) => {
  try {
    const patientId = req.user.id;

    const queueEntry = await Queue.findOne({
      patientId,
      status: { $in: ['waiting', 'in-consultation'] }
    }).populate('doctorId', 'name city');

    if (queueEntry) {
      // Also populate doctor profile information
      const doctorProfile = await Doctor.findOne({ userId: queueEntry.doctorId._id });
      if (doctorProfile) {
        queueEntry.doctorId.specialization = doctorProfile.specialization;
        queueEntry.doctorId.avgConsultationTime = doctorProfile.avgConsultationTime;
      }
    }

    if (!queueEntry) {
      return res.json({ message: 'Not in any queue' });
    }

    res.json({ queueEntry });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's current queue
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('🔍 Fetching queue for doctor:', doctorId);
    console.log('👤 Requesting user:', req.user.id, 'Role:', req.user.role);

    // Verify the requesting user is the doctor
    if (req.user.id !== doctorId && req.user.role !== 'admin') {
      console.log('❌ Authorization failed: User ID mismatch');
      return res.status(403).json({ message: 'Not authorized' });
    }

    const queue = await Queue.find({
      doctorId,
      status: { $in: ['waiting', 'in-consultation'] }
    })
    .populate('patientId', 'name phone city')
    .sort({ position: 1 });

    console.log('📋 Queue data found:', queue.length, 'entries');
    res.json(queue);
  } catch (error) {
    console.error('Error fetching doctor queue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start consultation (doctor moves patient to consultation)
router.post('/start-consultation', auth, async (req, res) => {
  try {
    const { queueId } = req.body;
    const doctorId = req.user.id;
    
    console.log('🔄 start-consultation called with:', { queueId, doctorId });

    const queueEntry = await Queue.findOne({
      _id: queueId,
      doctorId,
      status: 'waiting'
    });

    if (!queueEntry) {
      console.log('❌ Queue entry not found for:', { queueId, doctorId });
      return res.status(404).json({ 
        message: 'Queue entry not found' 
      });
    }
    
    console.log('✅ Found queue entry:', queueEntry._id);

    queueEntry.status = 'in-consultation';
    queueEntry.consultationStartTime = new Date();
    await queueEntry.save();

    // Emit real-time event for queue update
    socketService.emitQueueUpdated({
      id: queueEntry._id,
      doctorId: queueEntry.doctorId,
      patientId: queueEntry.patientId,
      status: queueEntry.status,
      position: queueEntry.position,
      consultationStartTime: queueEntry.consultationStartTime,
      updatedAt: new Date()
    });

    // Reorder remaining positions
    await reorderQueuePositions(doctorId);

    await queueEntry.populate('patientId', 'name phone city');
    res.json({ 
      message: 'Consultation started',
      queueEntry 
    });
  } catch (error) {
    console.error('Error starting consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete consultation
router.post('/complete-consultation', auth, async (req, res) => {
  try {
    const { queueId } = req.body;
    const doctorId = req.user.id;
    
    console.log('🔄 complete-consultation called with:', { queueId, doctorId });
    console.log('📤 Request body:', req.body);

    const queueEntry = await Queue.findOne({
      _id: queueId,
      doctorId,
      status: 'in-consultation'
    });

    if (!queueEntry) {
      console.log('❌ Queue entry not found for complete-consultation:', { queueId, doctorId });
      return res.status(404).json({ 
        message: 'Queue entry not found' 
      });
    }
    
    console.log('✅ Found queue entry for completion:', queueEntry._id);

    queueEntry.status = 'completed';
    queueEntry.consultationEndTime = new Date();
    
    // Calculate actual wait time
    if (queueEntry.consultationStartTime) {
      queueEntry.actualWaitTime = Math.floor(
        (queueEntry.consultationStartTime - queueEntry.createdAt) / (1000 * 60)
      );
    }

    await queueEntry.save();

    // Emit real-time event for queue completion
    socketService.emitQueueCompleted({
      id: queueEntry._id,
      doctorId: queueEntry.doctorId,
      patientId: queueEntry.patientId,
      status: queueEntry.status,
      position: queueEntry.position,
      consultationStartTime: queueEntry.consultationStartTime,
      consultationEndTime: queueEntry.consultationEndTime,
      actualWaitTime: queueEntry.actualWaitTime,
      completedAt: new Date()
    });

    res.json({ 
      message: 'Consultation completed',
      queueEntry 
    });
  } catch (error) {
    console.error('Error completing consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update queue status (for skipped/cancelled)
router.post('/:queueId/status', auth, async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;

    const queueEntry = await Queue.findOne({
      _id: queueId,
      doctorId,
      status: { $in: ['waiting', 'in-consultation'] }
    });

    if (!queueEntry) {
      return res.status(404).json({ 
        message: 'Queue entry not found' 
      });
    }

    queueEntry.status = status;
    if (status === 'completed' || status === 'cancelled') {
      queueEntry.consultationEndTime = new Date();
    }

    await queueEntry.save();

    // Emit real-time event for queue update
    socketService.emitQueueUpdated({
      id: queueEntry._id,
      doctorId: queueEntry.doctorId,
      patientId: queueEntry.patientId,
      status: queueEntry.status,
      position: queueEntry.position,
      updatedAt: new Date()
    });

    // Reorder remaining positions if needed
    if (status === 'cancelled' || status === 'completed') {
      await reorderQueuePositions(doctorId);
    }

    res.json({ 
      message: `Queue status updated to ${status}`,
      queueEntry 
    });
  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to reorder queue positions
async function reorderQueuePositions(doctorId) {
  const waitingPatients = await Queue.find({
    doctorId,
    status: 'waiting'
  }).sort({ createdAt: 1 });

  for (let i = 0; i < waitingPatients.length; i++) {
    waitingPatients[i].position = i + 1;
    await waitingPatients[i].save();
  }
}

module.exports = router;
