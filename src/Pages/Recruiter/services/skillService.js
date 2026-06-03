import axios from 'axios';
import { API_BASE_URL } from '../constants';

export const skillService = {
  getSkills: async () => {
    const response = await axios.get(`${API_BASE_URL}/skillsmatch/skills`);
    return response.data;
  },

  addSkill: async (name) => {
    const response = await axios.post(`${API_BASE_URL}/skills`, { name });
    return response.data;
  },

  deleteSkill: async (name) => {
    const response = await axios.delete(`${API_BASE_URL}/skills/${encodeURIComponent(name)}`);
    return response.data;
  },

  filterBySkill: async (skill) => {
    const response = await axios.get(`${API_BASE_URL}/skillsmatch?skill=${encodeURIComponent(skill)}`);
    return response.data;
  }
};
