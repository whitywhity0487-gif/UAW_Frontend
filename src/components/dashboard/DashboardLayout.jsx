import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50/50 font-['DM_Sans','Inter',sans-serif]">
      {children}
    </div>
  );
};

export const DashboardContainer = ({ children }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {children}
    </div>
  );
};

export default DashboardLayout;
