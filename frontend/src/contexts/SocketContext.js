
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
  const { user, updateUser } = useAuth();

  // Support admin login (admin uses localStorage, not AuthContext)
  const getEffectiveUser = () => {
    if (user) return user;
    try {
      const adminToken = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminData');
      if (adminToken && adminData) {
        const admin = JSON.parse(adminData);
        return { id: admin.id, role: 'admin', ...admin };
      }
    } catch (e) {}
    return null;
  };

  const effectiveUser = getEffectiveUser();

  useEffect(() => {
    if (!effectiveUser) {
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
        userId: effectiveUser.id,
        role: effectiveUser.role,
        userData: effectiveUser
      });
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);

      // Join role-specific rooms
      if (effectiveUser.role === 'doctor') {
        newSocket.emit('join-doctor-room', { doctorId: effectiveUser.id });
      } else if (effectiveUser.role === 'admin') {
        newSocket.emit('join-admin-room', { adminId: effectiveUser.id });
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

    const role = effectiveUser.role;

    // Patient Events (for admins)
    newSocket.on('newPatient', (data) => {
      console.log('👥 New patient registered:', data);
      toast.success(`New patient: ${data.data.name}`, { duration: 4000, icon: '👥' });
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('patientUpdated', (data) => {
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('patientDeleted', (data) => {
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    // Doctor verification events (for admins) – new request or status change
    newSocket.on('newDoctorVerification', (data) => {
      console.log('👨‍⚕️ New doctor verification request:', data);
      toast.success(`New verification request from: ${data.data?.name || 'Doctor'}`, {
        duration: 4000,
        icon: '📋'
      });
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('newDoctor', (data) => {
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('doctorVerificationRequest', (data) => {
      toast.success(`New verification request from: ${data.data?.name || 'Doctor'}`, {
        duration: 4000,
        icon: '📋'
      });
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('verificationStatusChanged', (data) => {
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      if (role === 'doctor') {
        toast.success(`Verification status: ${data.data?.status || 'updated'}`, { duration: 4000, icon: '🔄' });
        window.dispatchEvent(new CustomEvent('refreshDoctorDashboard'));
      }
    });

    newSocket.on('doctorVerificationStatusChanged', (data) => {
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('doctorVerified', (data) => {
      console.log('✅ Doctor verified:', data);
      if (role === 'doctor') {
        if (typeof updateUser === 'function') updateUser({ isVerified: true });
        toast.success('🎉 Your verification has been approved!', { duration: 6000, icon: '✅' });
        setTimeout(() => { window.location.href = '/doctor/dashboard'; }, 1500);
      }
    });

    newSocket.on('verificationRejected', (data) => {
      if (role === 'doctor') {
        toast.error(`Verification rejected: ${data.data?.reason || 'See details'}`, { duration: 6000, icon: '❌' });
        window.dispatchEvent(new CustomEvent('refreshDoctorDashboard'));
      }
    });

    newSocket.on('verificationOnHold', (data) => {
      if (role === 'doctor') {
        toast.warning(`Verification on hold: ${data.data?.notes || ''}`, { duration: 6000, icon: '⏸️' });
        window.dispatchEvent(new CustomEvent('refreshDoctorDashboard'));
      }
    });

    // Queue Events
    newSocket.on('queueUpdated', (data) => {
      if (role === 'doctor') window.dispatchEvent(new CustomEvent('refreshDoctorQueue'));
      else if (role === 'patient') window.dispatchEvent(new CustomEvent('refreshPatientQueue'));
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('dashboardUpdate', (data) => {
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('adminAction', (data) => {
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('newQueue', (data) => {
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
      if (role === 'doctor') window.dispatchEvent(new CustomEvent('refreshDoctorQueue'));
    });

    newSocket.on('queueCompleted', (data) => {
      if (role === 'doctor') window.dispatchEvent(new CustomEvent('refreshDoctorQueue'));
      else if (role === 'patient') window.dispatchEvent(new CustomEvent('refreshPatientQueue'));
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('newPrescription', (data) => {
      if (role === 'doctor') window.dispatchEvent(new CustomEvent('refreshDoctorPrescriptions'));
      else if (role === 'patient') window.dispatchEvent(new CustomEvent('refreshPatientPrescriptions'));
      if (role === 'admin') window.dispatchEvent(new CustomEvent('refreshAdminDashboard'));
    });

    newSocket.on('systemNotification', (data) => {
      toast(data.data?.message || 'Notification', { duration: 5000, icon: '📢' });
    });

    newSocket.on('doctorAvailable', (data) => {
      if (role === 'patient') {
        toast.success(`New doctor available: ${data.data?.name || ''}`, { duration: 4000, icon: '👨‍⚕️' });
        window.dispatchEvent(new CustomEvent('refreshDoctorSearch'));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [effectiveUser?.id, effectiveUser?.role]);

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
