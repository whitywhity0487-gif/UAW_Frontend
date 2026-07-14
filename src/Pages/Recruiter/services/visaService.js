import axios from 'axios';
import { API_BASE_URL } from '../constants';

export const visaService = {
  getVisaTypes: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/visa`);
    return response.data;
  }
};
