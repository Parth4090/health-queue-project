
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

      // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setIsConnected(true);
      
      // Authenticate with the server
      newSocket.emit('authenticate', {
        userId: user.id,
        role: user.role,
        userData: user
      });
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
      
      // Join role-specific rooms
      if (user.role === 'doctor') {
        newSocket.emit('join-doctor-room', { doctorId: user.id });
      } else if (user.role === 'admin') {
        newSocket.emit('join-admin-room', { adminId: user.id });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      toast.error('Connection error. Please refresh the page.');
    });

    // ===== REAL-TIME EVENT LISTENERS =====

    // Patient Events (for admins)
    newSocket.on('newPatient', (data) => {
      console.log('👥 New patient registered:', data);
      toast.success(`New patient: ${data.data.name}`, {
        duration: 4000,
        icon: '👥'
      });
      
      // Trigger dashboard refresh for admins
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    newSocket.on('patientUpdated', (data) => {
      console.log('📝 Patient updated:', data);
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    newSocket.on('patientDeleted', (data) => {
      console.log('🗑️ Patient deleted:', data);
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    // Doctor Events (for admins)
    newSocket.on('newDoctorVerification', (data) => {
      console.log('👨‍⚕️ New doctor verification request:', data);
      toast.success(`New verification request from: ${data.data.name}`, {
        duration: 4000,
        icon: '📋'
      });
      
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    newSocket.on('newDoctor', (data) => {
      console.log('👨‍⚕️ New doctor registered:', data);
      toast.success(`New doctor: ${data.data.name}`, {
        duration: 4000,
        icon: '👨‍⚕️'
      });
      
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    newSocket.on('doctorVerificationRequest', (data) => {
      console.log('📋 New doctor verification request:', data);
      toast.success(`New verification request from: ${data.data.name}`, {
        duration: 4000,
        icon: '📋'
      });
      
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    newSocket.on('verificationStatusChanged', (data) => {
      console.log('🔄 Doctor verification status changed:', data);
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    newSocket.on('doctorVerificationStatusChanged', (data) => {
      console.log('🔄 Doctor verification status changed:', data);
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    // Doctor Verification Events (for doctors)
    newSocket.on('verificationStatusChanged', (data) => {
      console.log('🔄 Verification status changed:', data);
      toast.success(`Verification status: ${data.data.status}`, {
        duration: 4000,
        icon: '🔄'
      });
      
      // Trigger dashboard refresh for doctors
      if (user.role === 'doctor') {
        window.dispatchEvent(new CustomEvent('refreshDoctorDashboard'));
      }
    });

    newSocket.on('doctorVerified', (data) => {
      console.log('✅ Doctor verified:', data);
      toast.success('🎉 Your verification has been approved!', {
        duration: 6000,
        icon: '✅'
      });
      
      // Redirect to main doctor dashboard
      if (user.role === 'doctor') {
        setTimeout(() => {
          window.location.href = '/doctor/dashboard';
        }, 2000);
      }
    });

    newSocket.on('verificationRejected', (data) => {
      console.log('❌ Doctor verification rejected:', data);
      toast.error(`Verification rejected: ${data.data.reason}`, {
        duration: 6000,
        icon: '❌'
      });
      
      if (user.role === 'doctor') {
        window.dispatchEvent(new CustomEvent('refreshDoctorDashboard'));
      }
    });

    newSocket.on('verificationOnHold', (data) => {
      console.log('⏸️ Doctor verification on hold:', data);
      toast.warning(`Verification on hold: ${data.data.notes}`, {
        duration: 6000,
        icon: '⏸️'
      });
      
      if (user.role === 'doctor') {
        window.dispatchEvent(new CustomEvent('refreshDoctorDashboard'));
      }
    });

    // Queue Events
    newSocket.on('queueUpdated', (data) => {
      console.log('🏥 Queue updated:', data);
      
      if (user.role === 'doctor') {
        window.dispatchEvent(new CustomEvent('refreshDoctorQueue'));
      } else if (user.role === 'patient') {
        window.dispatchEvent(new CustomEvent('refreshPatientQueue'));
      }
      
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    // Comprehensive Dashboard Update Events (for admins)
    newSocket.on('dashboardUpdate', (data) => {
      console.log('📊 Dashboard update received:', data);
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    // Admin Action Events (for real-time sync)
    newSocket.on('adminAction', (data) => {
      console.log('⚡ Admin action performed:', data);
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    newSocket.on('newQueue', (data) => {
      console.log('🆕 New queue created:', data);
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
      if (user.role === 'doctor') {
        window.dispatchEvent(new CustomEvent('refreshDoctorQueue'));
      }
    });

    newSocket.on('queueCompleted', (data) => {
      console.log('✅ Queue completed:', data);
      
      if (user.role === 'doctor') {
        window.dispatchEvent(new CustomEvent('refreshDoctorQueue'));
      } else if (user.role === 'patient') {
        window.dispatchEvent(new CustomEvent('refreshPatientQueue'));
      }
      
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    // Prescription Events
    newSocket.on('newPrescription', (data) => {
      console.log('💊 New prescription:', data);
      
      if (user.role === 'doctor') {
        window.dispatchEvent(new CustomEvent('refreshDoctorPrescriptions'));
      } else if (user.role === 'patient') {
        window.dispatchEvent(new CustomEvent('refreshPatientPrescriptions'));
      }
      
      if (user.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      }
    });

    // System Notifications
    newSocket.on('systemNotification', (data) => {
      console.log('📢 System notification:', data);
      toast(data.data.message, {
        duration: 5000,
        icon: '📢'
      });
    });

    // Doctor Available Event (for patients)
    newSocket.on('doctorAvailable', (data) => {
      console.log('👨‍⚕️ New doctor available:', data);
      if (user.role === 'patient') {
        toast.success(`New doctor available: ${data.data.name}`, {
          duration: 4000,
          icon: '👨‍⚕️'
        });
        window.dispatchEvent(new CustomEvent('refreshDoctorSearch'));
      }
    });

    setSocket(newSocket);

      // Cleanup on unmount
      return () => {
      newSocket.disconnect();
      };
  }, [user]);

  // Socket utility functions
  const joinQueue = (doctorId, patientId) => {
    if (socket && isConnected) {
      socket.emit('join-queue', { doctorId, patientId });
    }
  };

  const leaveQueue = (doctorId, patientId) => {
    if (socket && isConnected) {
      socket.emit('leave-queue', { doctorId, patientId });
    }
  };

  const joinDoctorRoom = (doctorId) => {
    if (socket && isConnected) {
      socket.emit('join-doctor-room', { doctorId });
    }
  };

  const joinAdminRoom = (adminId) => {
    if (socket && isConnected) {
      socket.emit('join-admin-room', { adminId });
    }
  };

  const value = {
    socket,
    isConnected,
    joinQueue,
    leaveQueue,
    joinDoctorRoom,
    joinAdminRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
