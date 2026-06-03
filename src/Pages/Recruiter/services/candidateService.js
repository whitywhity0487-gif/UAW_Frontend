import axios from 'axios';
import { API_BASE_URL } from '../constants';

export const candidateService = {
  getJoinedCandidateIds: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/candidates/joined/all`);
      if (response.data.success) {
        return new Set(response.data.data.map(c => c.id));
      }
      return new Set();
    } catch (err) {
      console.error('Error fetching joined candidates:', err);
      return new Set();
    }
  },

  getAllCandidates: async () => {
    const response = await axios.get(`${API_BASE_URL}/candidates/all`);
    return response.data;
  },

  checkEmailExists: async (email, excludeId = null) => {
    try {
      const url = `${API_BASE_URL}/candidates/check-email/${encodeURIComponent(email)}${excludeId ? `?excludeId=${excludeId}` : ''}`;
      const response = await axios.get(url);
      return response.data.exists;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  },

  checkMobileExists: async (mobile, excludeId = null) => {
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const url = `${API_BASE_URL}/candidates/check-mobile/${encodeURIComponent(cleanMobile)}${excludeId ? `?excludeId=${excludeId}` : ''}`;
      const response = await axios.get(url);
      return response.data.exists;
    } catch (err) {
      console.error('Error checking mobile:', err);
      return false;
    }
  },

  getStatusForClient: async (candidateId, clientName) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/candidates/${candidateId}/status-for-client/${encodeURIComponent(clientName)}`
      );
      return response.data.data;
    } catch (err) {
      console.error(`Error fetching status for candidate ${candidateId} client ${clientName}:`, err);
      return null;
    }
  },

  updateProgress: async (candidateId, isInProgress) => {
    return axios.put(`${API_BASE_URL}/candidates/${candidateId}/progress`, { isInProgress });
  },

  getBatchProgress: async (candidateIds, demandId) => {
    const payload = { candidateIds };
    if (demandId) payload.demandId = demandId;
    const response = await axios.post(`${API_BASE_URL}/candidates/progress/batch`, payload);
    return response.data;
  },

  addCandidate: async (formData) => {
    return axios.post(`${API_BASE_URL}/candidates`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updateCandidate: async (candidateId, formData) => {
    return axios.put(`${API_BASE_URL}/candidates/${candidateId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteCandidate: async (candidateId) => {
    return axios.delete(`${API_BASE_URL}/candidates/${candidateId}`);
  },

  getSelectedCandidates: async (demandId) => {
    const response = await axios.get(`${API_BASE_URL}/selected-candidates/${demandId}`);
    return response.data;
  },

  saveSelectedCandidates: async (demandId, payload) => {
    return axios.post(`${API_BASE_URL}/selected-candidates/${demandId}`, payload);
  },

  removeSelectedCandidate: async (demandId, candidateId) => {
    return axios.delete(`${API_BASE_URL}/selected-candidates/${demandId}/${candidateId}`);
  },

  filterCandidates: async (params) => {
    const response = await axios.get(`${API_BASE_URL}/shortcandidates/filter?${params}`);
    return response.data;
  }
};
