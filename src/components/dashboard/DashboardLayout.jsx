import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50/50 font-['DM_Sans','Inter',sans-serif]">
      {children}
    </div>
  );
};

export const DashboardContainer = ({ children, fullWidth = false, className = '' }) => {
  return (
    <div className={`${fullWidth ? 'w-full max-w-[1920px] px-4 md:px-8' : 'max-w-7xl px-4 sm:px-6'} mx-auto py-8 ${className}`}>
      {children}
    </div>
  );
};

export default DashboardLayout;
