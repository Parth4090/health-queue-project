import api from './api';

export const queueService = {
  // Join a doctor's queue
  joinQueue: async (doctorId, priority = 'normal', notes = '') => {
    try {
      const response = await api.post('/queue/join', {
        doctorId,
        priority,
        notes
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Leave a queue
  leaveQueue: async (queueId) => {
    try {
      const response = await api.post('/queue/leave', { queueId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get patient's current queue status
  getPatientQueueStatus: async () => {
    try {
      const response = await api.get('/queue/patient/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get doctor's queue
  getDoctorQueue: async (doctorId) => {
    try {
      const response = await api.get(`/queue/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update queue status (for doctors)
  updateQueueStatus: async (queueId, status, consultationStartTime = null, consultationEndTime = null) => {
    try {
      const response = await api.patch(`/queue/${queueId}/status`, {
        status,
        consultationStartTime,
        consultationEndTime
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
