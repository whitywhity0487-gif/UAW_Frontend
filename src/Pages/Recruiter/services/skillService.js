import axios from 'axios';
import { API_BASE_URL } from '../constants';

export const skillService = {
  getSkills: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/skillsmatch/skills`);
    return response.data;
  },

  addSkill: async (name) => {
    const response = await axios.post(`${API_BASE_URL}/api/skills`, { name });
    return response.data;
  },

  deleteSkill: async (name) => {
    const response = await axios.delete(`${API_BASE_URL}/api/skills/${encodeURIComponent(name)}`);
    return response.data;
  },

  filterBySkill: async (skill) => {
    const response = await axios.get(`${API_BASE_URL}/api/skillsmatch?skill=${encodeURIComponent(skill)}`);
    return response.data;
  }
};
