import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/constants.js';

export const useVisaTypes = () => {
  const [visaTypes, setVisaTypes] = useState([]);
  const [visaTypesLoading, setVisaTypesLoading] = useState(false);

  const fetchVisaTypes = useCallback(async () => {
    try {
      setVisaTypesLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/visa`);

      if (response.data && Array.isArray(response.data)) {
        const visaTypeNames = response.data.map(item => item.VisaType);
        setVisaTypes(visaTypeNames);
      } else {
        setVisaTypes(['NA', 'H1B', 'L1', 'Green Card', 'Citizen', 'Other']);
      }
    } catch (err) {
      console.error('Error fetching visa types:', err);
      setVisaTypes(['NA', 'H1B', 'L1', 'Green Card', 'Citizen', 'Other']);
    } finally {
      setVisaTypesLoading(false);
    }
  }, []);

  return {
    visaTypes,
    visaTypesLoading,
    fetchVisaTypes
  };
};
