import api from './api';

export const prescriptionService = {
  // Get all prescriptions for a patient
  getPatientPrescriptions: async (patientId) => {
    try {
      const response = await api.get(`/prescription/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      throw error;
    }
  },

  // Get all prescriptions written by a doctor
  getDoctorPrescriptions: async (doctorId) => {
    try {
      const response = await api.get(`/prescription/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor prescriptions:', error);
      throw error;
    }
  },

  // Get a specific prescription by ID
  getPrescription: async (prescriptionId) => {
    try {
      const response = await api.get(`/prescription/${prescriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      throw error;
    }
  },

  // Create a new prescription
  createPrescription: async (prescriptionData) => {
    try {
      const response = await api.post('/prescription', prescriptionData);
      return response.data;
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  },

  // Update a prescription
  updatePrescription: async (prescriptionId, prescriptionData) => {
    try {
      const response = await api.put(`/prescription/${prescriptionId}`, prescriptionData);
      return response.data;
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    }
  },

  // Delete a prescription
  deletePrescription: async (prescriptionId) => {
    try {
      const response = await api.delete(`/prescription/${prescriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting prescription:', error);
      throw error;
    }
  },

  // Update prescription status
  updatePrescriptionStatus: async (prescriptionId, status) => {
    try {
      const response = await api.patch(`/prescription/${prescriptionId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating prescription status:', error);
      throw error;
    }
  }
};
