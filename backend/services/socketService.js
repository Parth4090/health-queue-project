const socketIo = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map to track connected users by role and ID
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    return this.io;
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 User connected:', socket.id);

      // Handle user authentication and role-based room joining
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });

      // Handle patient-specific events
      socket.on('join-queue', (data) => {
        this.handleJoinQueue(socket, data);
      });

      socket.on('leave-queue', (data) => {
        this.handleLeaveQueue(socket, data);
      });

      // Handle doctor-specific events
      socket.on('join-doctor-room', (data) => {
        this.handleJoinDoctorRoom(socket, data);
      });

      // Handle admin-specific events
      socket.on('join-admin-room', (data) => {
        this.handleJoinAdminRoom(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleAuthentication(socket, data) {
    const { userId, role, userData } = data;
    
    if (!userId || !role) {
      socket.emit('error', { message: 'Invalid authentication data' });
      return;
    }

    // Store user connection info
    this.connectedUsers.set(socket.id, {
      userId,
      role,
      userData,
      socketId: socket.id
    });

    // Join role-specific room
    socket.join(`role-${role}`);
    socket.join(`user-${userId}`);

    // Join specific role rooms
    switch (role) {
      case 'patient':
        socket.join('patients');
        break;
      case 'doctor':
        socket.join('doctors');
        break;
      case 'admin':
        socket.join('admins');
        break;
    }

    console.log(`✅ User ${userId} (${role}) authenticated and joined rooms`);
    socket.emit('authenticated', { success: true, role, userId });
  }

  handleJoinQueue(socket, data) {
    const { doctorId, patientId } = data;
    if (doctorId && patientId) {
      socket.join(`queue-${doctorId}`);
      socket.join(`patient-${patientId}`);
      console.log(`🏥 Patient ${patientId} joined queue ${doctorId}`);
    }
  }

  handleLeaveQueue(socket, data) {
    const { doctorId, patientId } = data;
    if (doctorId && patientId) {
      socket.leave(`queue-${doctorId}`);
      console.log(`🚪 Patient ${patientId} left queue ${doctorId}`);
    }
  }

  handleJoinDoctorRoom(socket, data) {
    const { doctorId } = data;
    if (doctorId) {
      socket.join(`doctor-${doctorId}`);
      console.log(`👨‍⚕️ Doctor ${doctorId} joined their room`);
    }
  }

  handleJoinAdminRoom(socket, data) {
    const { adminId } = data;
    if (adminId) {
      socket.join(`admin-${adminId}`);
      console.log(`🛡️ Admin ${adminId} joined admin room`);
    }
  }

  handleDisconnect(socket) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (userInfo) {
      console.log(`🔌 User ${userInfo.userId} (${userInfo.role}) disconnected`);
      this.connectedUsers.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  }

  // ===== REAL-TIME EVENT EMITTERS =====

  // Patient Events
  emitNewPatient(patientData) {
    this.io.to('admins').emit('newPatient', {
      type: 'newPatient',
      timestamp: new Date(),
      data: patientData
    });
    console.log('📢 Emitted newPatient event to admins');
  }

  emitPatientUpdated(patientData) {
    this.io.to('admins').emit('patientUpdated', {
      type: 'patientUpdated',
      timestamp: new Date(),
      data: patientData
    });
    console.log('📢 Emitted patientUpdated event to admins');
  }

  emitPatientDeleted(patientId) {
    this.io.to('admins').emit('patientDeleted', {
      type: 'patientDeleted',
      timestamp: new Date(),
      data: { patientId }
    });
    console.log('📢 Emitted patientDeleted event to admins');
  }

  // Doctor Events
  emitNewDoctor(doctorData) {
    // Emit to admins for verification review
    this.io.to('admins').emit('newDoctorVerification', {
      type: 'newDoctorVerification',
      timestamp: new Date(),
      data: doctorData,
      action: 'verification_required'
    });

    // Emit to all admins for dashboard update
    this.io.to('admins').emit('dashboardUpdate', {
      type: 'dashboardUpdate',
      timestamp: new Date(),
      updateType: 'new_verification',
      data: doctorData
    });

    console.log('📢 Emitted newDoctor events');
  }

  emitDoctorVerificationRequest(verificationData) {
    this.io.to('admins').emit('doctorVerificationRequest', {
      type: 'doctorVerificationRequest',
      timestamp: new Date(),
      data: verificationData
    });
    console.log('📢 Emitted doctorVerificationRequest event to admins');
  }

  emitDoctorVerificationStatusChanged(verificationData) {
    const { userId, status, action } = verificationData;
    
    // Emit to admins for dashboard update
    this.io.to('admins').emit('verificationStatusChanged', {
      type: 'verificationStatusChanged',
      timestamp: new Date(),
      data: verificationData,
      action: action || 'status_updated'
    });

    // Emit to specific doctor
    this.io.to(`user-${userId}`).emit('verificationStatusChanged', {
      type: 'verificationStatusChanged',
      timestamp: new Date(),
      data: verificationData,
      action: action || 'status_updated'
    });

    // Emit dashboard update to admins
    this.io.to('admins').emit('dashboardUpdate', {
      type: 'dashboardUpdate',
      timestamp: new Date(),
      updateType: 'verification_status_changed',
      data: verificationData
    });

    console.log('📢 Emitted doctorVerificationStatusChanged events');
  }

  emitDoctorVerified(doctorData) {
    // Emit to admins for dashboard update
    this.io.to('admins').emit('dashboardUpdate', {
      type: 'dashboardUpdate',
      timestamp: new Date(),
      updateType: 'doctor_verified',
      data: doctorData
    });

    // Emit to specific doctor
    this.io.to(`user-${doctorData.userId}`).emit('doctorVerified', {
      type: 'doctorVerified',
      timestamp: new Date(),
      data: doctorData
    });

    // Emit to all patients (for doctor search)
    this.io.to('patients').emit('doctorAvailable', {
      type: 'doctorAvailable',
      timestamp: new Date(),
      data: doctorData
    });

    console.log('📢 Emitted doctorVerified events');
  }

  emitDoctorRejected(verificationData) {
    // Emit to admins for dashboard update
    this.io.to('admins').emit('dashboardUpdate', {
      type: 'dashboardUpdate',
      timestamp: new Date(),
      updateType: 'doctor_rejected',
      data: verificationData
    });

    // Emit to specific doctor
    this.io.to(`user-${verificationData.userId}`).emit('verificationRejected', {
      type: 'verificationRejected',
      timestamp: new Date(),
      data: verificationData
    });

    console.log('📢 Emitted doctorRejected events');
  }

  emitDoctorOnHold(verificationData) {
    // Emit to admins for dashboard update
    this.io.to('admins').emit('dashboardUpdate', {
      type: 'dashboardUpdate',
      timestamp: new Date(),
      updateType: 'doctor_on_hold',
      data: verificationData
    });

    // Emit to specific doctor
    this.io.to(`user-${verificationData.userId}`).emit('verificationOnHold', {
      type: 'verificationOnHold',
      timestamp: new Date(),
      data: verificationData
    });

    console.log('📢 Emitted doctorOnHold events');
  }

  // Admin Action Events
  emitAdminAction(actionData) {
    const { action, targetType, targetId, adminId, data } = actionData;
    
    // Emit to all admins for dashboard sync
    this.io.to('admins').emit('adminAction', {
      type: 'adminAction',
      timestamp: new Date(),
      action,
      targetType,
      targetId,
      adminId,
      data
    });

    // Emit dashboard update
    this.io.to('admins').emit('dashboardUpdate', {
      type: 'dashboardUpdate',
      timestamp: new Date(),
      updateType: 'admin_action',
      data: actionData
    });

    console.log(`📢 Emitted adminAction event: ${action} on ${targetType}`);
  }

  // Queue Events
  emitQueueUpdated(queueData) {
    const { doctorId, patientId } = queueData;
    
    // Emit to doctor
    this.io.to(`doctor-${doctorId}`).emit('queueUpdated', {
      type: 'queueUpdated',
      timestamp: new Date(),
      data: queueData
    });

    // Emit to patient
    this.io.to(`patient-${patientId}`).emit('queueUpdated', {
      type: 'queueUpdated',
      timestamp: new Date(),
      data: queueData
    });

    // Emit to admins
    this.io.to('admins').emit('queueUpdated', {
      type: 'queueUpdated',
      timestamp: new Date(),
      data: queueData
    });

    // Emit dashboard update to admins
    this.io.to('admins').emit('dashboardUpdate', {
      type: 'dashboardUpdate',
      timestamp: new Date(),
      updateType: 'queue_updated',
      data: queueData
    });

    console.log('📢 Emitted queueUpdated events');
  }

  emitNewQueue(queueData) {
    // Emit to admins for dashboard update
    this.io.to('admins').emit('dashboardUpdate', {
      type: 'dashboardUpdate',
      timestamp: new Date(),
      updateType: 'new_queue',
      data: queueData
    });

    // Emit to specific doctor
    if (queueData.doctorId) {
      console.log(`📢 Emitting newQueue to doctor-${queueData.doctorId}`);
      this.io.to(`doctor-${queueData.doctorId}`).emit('newQueue', {
        type: 'newQueue',
        timestamp: new Date(),
        data: queueData
      });
    }

    console.log('📢 Emitted newQueue events');
  }

  emitQueueCompleted(queueData) {
    const { doctorId, patientId } = queueData;
    
    // Emit to doctor
    this.io.to(`doctor-${doctorId}`).emit('queueCompleted', {
      type: 'queueCompleted',
      timestamp: new Date(),
      data: queueData
    });

    // Emit to patient
    this.io.to(`patient-${patientId}`).emit('queueCompleted', {
      type: 'queueCompleted',
      timestamp: new Date(),
      data: queueData
    });

    // Emit to admins
    this.io.to('admins').emit('queueCompleted', {
      type: 'queueCompleted',
      timestamp: new Date(),
      data: queueData
    });

    console.log('📢 Emitted queueCompleted events');
  }

  // Prescription Events
  emitNewPrescription(prescriptionData) {
    const { doctorId, patientId } = prescriptionData;
    
    // Emit to doctor
    this.io.to(`doctor-${doctorId}`).emit('newPrescription', {
      type: 'newPrescription',
      timestamp: new Date(),
      data: prescriptionData
    });

    // Emit to patient
    this.io.to(`patient-${patientId}`).emit('newPrescription', {
      type: 'newPrescription',
      timestamp: new Date(),
      data: prescriptionData
    });

    // Emit to admins
    this.io.to('admins').emit('newPrescription', {
      type: 'newPrescription',
      timestamp: new Date(),
      data: prescriptionData
    });

    console.log('📢 Emitted newPrescription events');
  }

  // System Events
  emitSystemNotification(message, role = 'all') {
    const event = {
      type: 'systemNotification',
      timestamp: new Date(),
      data: { message }
    };

    if (role === 'all') {
      this.io.emit('systemNotification', event);
    } else {
      this.io.to(`role-${role}`).emit('systemNotification', event);
    }

    console.log(`📢 Emitted systemNotification to ${role}`);
  }

  // Get connected users info
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Get users by role
  getUsersByRole(role) {
    return Array.from(this.connectedUsers.values()).filter(user => user.role === role);
  }

  // Check if user is online
  isUserOnline(userId) {
    return Array.from(this.connectedUsers.values()).some(user => user.userId === userId);
  }
}

module.exports = new SocketService();
