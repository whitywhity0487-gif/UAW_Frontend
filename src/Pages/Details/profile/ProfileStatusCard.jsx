// src/components/ProfileStatusCard.jsx
import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Mail, Phone, RefreshCw } from 'lucide-react';

const ProfileStatusCard = ({ status, rejectionReason, onResubmit, onContactSupport }) => {
  const statusConfig = {
    PENDING: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      title: 'Pending Admin Approval',
      message: 'Your profile has been submitted successfully. Please wait for admin approval.',
      actions: ['contact']
    },
    APPROVED: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Profile Approved',
      message: 'Your profile has been approved! You now have full access to all modules.',
      actions: []
    },
    REJECTED: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Profile Rejected',
      message: 'Your profile needs corrections. Please review the rejection reason and resubmit.',
      actions: ['resubmit', 'contact']
    }
  };
  
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  
  return (
    <div className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-6 mb-6`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-white shadow-sm ${config.color}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${config.color}`}>{config.title}</h3>
          <p className="text-gray-600 mt-1">{config.message}</p>
          
          {status === 'REJECTED' && rejectionReason && (
            <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                <AlertCircle size={14} />
                Rejection Reason:
              </p>
              <p className="text-sm text-red-700 mt-1">{rejectionReason}</p>
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            {config.actions.includes('resubmit') && (
              <button
                onClick={onResubmit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
              >
                <RefreshCw size={14} />
                Resubmit Profile
              </button>
            )}
            {config.actions.includes('contact') && (
              <button
                onClick={onContactSupport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all"
              >
                <Mail size={14} />
                Contact Support
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileStatusCard;