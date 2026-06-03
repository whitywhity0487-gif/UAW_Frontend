import React from 'react';
import PolicyTemplate from './PolicyTemplate';

const Policy = () => {
  return (
    <PolicyTemplate
      policyType="general"
      title="Policy Centre"
      icon={
        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      gradientColors={["#1E3A5F", "#2563EB"]}
      accentColor="#1E3A5F"
      bgColor="#EFF6FF"
      headerGradient="linear-gradient(90deg, #1E3A5F 0%, #2563EB 60%, #60A5FA 100%)"
      excludeKeywords={["award", "recognition", "salary", "advance", "loan", "travel", "domestic"]}
      showAddButton={true}
      footerMessage="This document is for internal use only. For questions or clarifications, contact your HR Business Partner."
    />
  );
};

export default Policy;