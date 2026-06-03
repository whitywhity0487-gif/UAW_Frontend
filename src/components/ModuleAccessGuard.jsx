// src/components/ModuleAccessGuard.jsx
import React, { useEffect, useState } from 'react';
import { Lock, Clock, AlertTriangle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';



const ModuleAccessGuard = ({ children, moduleName }) => {
  
  const { hasModuleAccess, profileStatus, currentUser, checkProfileAccess, isHydrated } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
const [accessChecked, setAccessChecked] = useState(false);

useEffect(() => {

  const verifyAccess = async () => {
    if (!isHydrated) return;

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const username = currentUser?.username || storedUser?.username;

    if (username) {
      await checkProfileAccess(username);
    }

    setAccessChecked(true);
    setChecking(false);
  };

  verifyAccess();
}, [isHydrated]);

  // Show loading while checking
  if (checking || !isHydrated || !accessChecked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-500 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  // Admin always has full access
  if (currentUser?.role === 'Admin' || currentUser?.role === 'Recruiter') {
    console.log("✅ Admin/Recruiter - Full access granted");
    return children;
  }

  // APPROVED profile - full access
  if (profileStatus === 'APPROVED') {
    return children;
  }

  // PENDING profile - show waiting message (NO redirect)
  if (profileStatus === 'PENDING') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md p-8 rounded-2xl bg-yellow-50 border border-yellow-200 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white shadow-sm">
            <Clock size={32} className="text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Pending Approval</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your profile has been submitted and is waiting for admin approval.
            You will get access to {moduleName} once approved.
          </p>
          <button
            onClick={() => navigate('/mypersonaldetails')}
            className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            View Profile Status
          </button>
        </div>
      </div>
    );
  }

  // REJECTED profile - show rejection message
  if (profileStatus === 'REJECTED') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md p-8 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white shadow-sm">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Rejected</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your profile was rejected. Please update and resubmit your profile to access {moduleName}.
          </p>
          <button
            onClick={() => navigate('/mypersonaldetails')}
            className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            Resubmit Profile
          </button>
        </div>
      </div>
    );
  }
if (profileStatus === null) {
  return null;
}

  // Default - No profile or NOT_SUBMITTED
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md p-8 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white shadow-sm">
          <Lock size={32} className="text-gray-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Please complete and submit your profile to access {moduleName}.
        </p>
        <button
          onClick={() => navigate('/mypersonaldetails')}
          className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
        >
          Complete My Profile
        </button>
      </div>
    </div>
  );
};

export default ModuleAccessGuard;