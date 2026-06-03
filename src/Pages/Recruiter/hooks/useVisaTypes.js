import { useState, useCallback } from 'react';
import axios from 'axios';

export const useVisaTypes = () => {
  const [visaTypes, setVisaTypes] = useState([]);
  const [visaTypesLoading, setVisaTypesLoading] = useState(false);

  const fetchVisaTypes = useCallback(async () => {
    try {
      setVisaTypesLoading(true);
      const response = await axios.get('http://localhost:5000/api/visa');

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
