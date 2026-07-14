import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const DashboardHeader = ({ title, subtitle, backPath = '/home', actions }) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 shadow-sm min-h-[76px] flex items-center bg-gradient-to-r from-gray-900 via-gray-900 to-blue-900 overflow-hidden border-b border-gray-800">
      <div className="w-full px-6 py-4 flex items-center justify-between relative z-10">
        
        {/* Left Side - Back Button */}
        <div className="flex-1 flex justify-start">
          <button
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors shadow-sm cursor-pointer backdrop-blur-sm"
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>

        {/* Center - Title & Subtitle */}
        <div className="flex-1 flex flex-col items-center text-center">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-white mt-0.5">{subtitle}</p>}
        </div>

        {/* Right Side - Actions or Spacer */}
        <div className="flex-1 flex justify-end gap-3">
          {actions}
        </div>
        
      </div>
    </div>
  );
};

export default DashboardHeader;
