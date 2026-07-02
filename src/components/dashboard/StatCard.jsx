import React from 'react';

const StatCard = ({ icon: Icon, title, value, description, colorClass = "text-blue-600 bg-blue-50" }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
          {Icon && <Icon size={24} />}
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div>
        <h3 className="text-4xl font-bold text-gray-900">{value}</h3>
        {description && <p className="text-sm font-medium text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  );
};

export default StatCard;
