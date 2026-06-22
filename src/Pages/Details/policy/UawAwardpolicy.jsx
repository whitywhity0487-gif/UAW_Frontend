import React, { useState, useEffect } from 'react';
import PolicyTemplate from './PolicyTemplate';

const UawAwardpolicy = () => {
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
      policyType="award"
      title="UAW Award Policy"
      icon={
        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      }
      gradientColors={["#1E3A5F", "#2563EB"]}
      accentColor="#1E3A5F"
      bgColor="#EFF6FF"
      headerGradient="linear-gradient(90deg, #1E3A5F 0%, #2563EB 60%, #60A5FA 100%)"
      filterKeywords={["award", "recognition", "uaw award"]}
      showAddButton={isAdmin}
      footerMessage="This award policy is effective immediately. All award nominations must be submitted through the HR portal by the 15th of each month."
    />
  );
};

export default UawAwardpolicy;