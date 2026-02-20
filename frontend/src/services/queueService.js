import api from './api';

export const queueService = {

  joinQueue: async (doctorId, priority = 'normal', notes = '') => {
    const response = await api.post('/api/queue/join', {
      doctorId,
      priority,
      notes
    });
    return response.data;
  },

  leaveQueue: async (queueId) => {
    const response = await api.post('/api/queue/leave', { queueId });
    return response.data;
  },

  getPatientQueueStatus: async () => {
    const response = await api.get('/api/queue/patient/status');
    return response.data;
  },

  getDoctorQueue: async (doctorId) => {
    const response = await api.get(`/api/queue/doctor/${doctorId}`);
    return response.data;
  },

  updateQueueStatus: async (queueId, status, consultationStartTime = null, consultationEndTime = null) => {
    const response = await api.patch(`/api/queue/${queueId}/status`, {
      status,
      consultationStartTime,
      consultationEndTime
    });
    return response.data;
  }

};
