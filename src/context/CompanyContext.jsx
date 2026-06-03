// src/context/CompanyContext.jsx - Updated version

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from './UserContext';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [currentCompany, setCurrentCompany] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignedClient, setAssignedClient] = useState(null);

  const { currentUser } = useUser();

  // Fetch assigned client from personal-details API only
  const fetchAssignedClientFromDB = async (userId) => {
    if (!userId) return null;
    
    console.log(`📡 Fetching assigned client for user: ${userId}`);
    
    try {
      // Only fetch from personal-details endpoint
      const response = await fetch(`http://localhost:5000/api/personal-details?userId=${userId}`);
      
      if (!response.ok) {
        console.warn(`⚠️ Personal details API returned ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const client = data.data.assignedClient || 
                       data.data.assignedCompany || 
                       data.data.clientName;
        
        if (client) {
          console.log(`✅ Found assigned client: ${client}`);
          setAssignedClient(client);
          return client;
        }
      }
      
      console.log('⚠️ No assigned client found in personal details');
      return null;
      
    } catch (error) {
      console.error('❌ Error fetching assigned client:', error);
      return null;
    }
  };

  // Fetch companies based on client
  const fetchCompanies = async (clientName = null) => {
    setCompaniesLoading(true);
    setError(null);
    
    const client = clientName || assignedClient;
    console.log(`📡 Fetching companies for client: ${client || 'all'}`);
    
    try {
      let url = 'http://localhost:5000/api/holiday/companies';
      if (client && client !== 'undefined' && client !== 'null') {
        url += `?client=${encodeURIComponent(client)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`✅ Found ${data.data.length} companies`);
        setAvailableCompanies(data.data);
        
        if (!currentCompany && data.data.length > 0) {
          setCurrentCompany(data.data[0].name);
        }
      } else {
        setAvailableCompanies([]);
      }
    } catch (err) {
      console.error('❌ Error fetching companies:', err);
      setError(err.message);
      setAvailableCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Initialize - fetch from database on mount
  useEffect(() => {
    const init = async () => {
      const userId = currentUser?.username || 
                     currentUser?.userId || 
                     JSON.parse(localStorage.getItem('user') || '{}')?.username;
      
      if (userId) {
        const client = await fetchAssignedClientFromDB(userId);
        await fetchCompanies(client);
      } else {
        console.log('⚠️ No userId found, fetching all companies');
        await fetchCompanies(null);
      }
    };
    
    if (currentUser) {
      init();
    }
  }, [currentUser]);

  const switchCompany = (company) => {
    setCurrentCompany(company);
  };

  const refreshCompanies = async () => {
    const userId = currentUser?.username || 
                   currentUser?.userId || 
                   JSON.parse(localStorage.getItem('user') || '{}')?.username;
    
    if (userId) {
      const client = await fetchAssignedClientFromDB(userId);
      await fetchCompanies(client);
    } else {
      await fetchCompanies(null);
    }
  };

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      availableCompanies,
      companiesLoading,
      error,
      assignedClient,
      switchCompany,
      refreshCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
};