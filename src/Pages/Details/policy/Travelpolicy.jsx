import React, { useState, useEffect } from 'react';
import PolicyTemplate from './PolicyTemplate';

const Travelpolicy = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === 'Admin') {
        setIsAdmin(true);
      }
    }
  }, []);

  return (
    <PolicyTemplate
      policyType="travel"
      title="Domestic Travel Policy"
      icon={
        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 12l2 2 4-4M7 10l2 2 6-6" />
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      }
      gradientColors={["#1E3A5F", "#2563EB"]}
      accentColor="#1E3A5F"
      bgColor="#EFF6FF"
      headerGradient="linear-gradient(90deg, #1E3A5F 0%, #2563EB 60%, #60A5FA 100%)"
      filterKeywords={["travel", "domestic", "tour", "transport"]}
      showAddButton={isAdmin}
      footerMessage="All travel requests must be submitted at least 7 days in advance. International travel requires additional management approval."
    />
  );
};

export default Travelpolicy;