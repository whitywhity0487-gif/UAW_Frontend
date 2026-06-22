import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PolicyTemplate from './PolicyTemplate';
import SalaryAdvanceForm from './SalaryAdvanceForm';
import AdminSalaryAdvance from '../../admin/AdminSalaryAdvance';

// Main Salaryadvance Component with Tabs
const Salaryadvance = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('policy');
  const [isIndian, setIsIndian] = useState(false);

  useEffect(() => {
    const fetchUserAndNationality = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'Admin') {
          setIsAdmin(true);
        } else {
          // Check nationality for employee
          try {
            const userId = user.username || user.id || user.userId;
            const res = await fetch(`https://uaw-backend.vercel.app/api/personal-details?userId=${userId}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.data?.nationality) {
                const nat = data.data.nationality.toUpperCase();
                if (nat === "INDIA") {
                  setIsIndian(true);
                }
              }
            }
          } catch (e) {
            console.error("Error fetching nationality:", e);
          }
        }
      }
    };
    fetchUserAndNationality();
  }, []);

  const tabStyle = (tabName) => ({
    padding: '16px 24px',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tabName ? '2px solid #065F46' : '2px solid transparent',
    color: activeTab === tabName ? '#065F46' : '#6B7280',
    fontWeight: activeTab === tabName ? 600 : 500,
    cursor: 'pointer',
    fontSize: 15,
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB', width: '100%' }}>


      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 24px' }}>
        <button onClick={() => setActiveTab('policy')} style={tabStyle('policy')}>
          Salary Policies
        </button>
        {!isAdmin && isIndian && (
          <button onClick={() => setActiveTab('request')} style={tabStyle('request')}>
            Salary Advance
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setActiveTab('admin')} style={tabStyle('admin')}>
            Manage Requests (Admin)
          </button>
        )}
      </div>

      {/* Tab Content */}

      {/* Salary Policies tab — shows policy content only */}
      {activeTab === 'policy' && (
        <div style={{ width: '100%', maxWidth: '100%', padding: '40px 40px 20px 40px' }}>
          <PolicyTemplate
            policyType="salary"
            title="Salary Advance Policy"
            icon={
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
            gradientColors={["#1E3A5F", "#2563EB"]}
            accentColor="#1E3A5F"
            bgColor="#EFF6FF"
            headerGradient="linear-gradient(90deg, #1E3A5F 0%, #2563EB 60%, #60A5FA 100%)"
            filterKeywords={["salary", "advance", "loan"]}
            showAddButton={isAdmin}
            footerMessage="Salary advance requests must be submitted by the 20th of each month. Approval may take 3-5 business days."
          />
        </div>
      )}

      {/* Salary Advance tab — shows form only (no policy content above) */}
      {activeTab === 'request' && (!isAdmin && isIndian) && (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
          <SalaryAdvanceForm />
        </div>
      )}

      {/* Admin Manage Requests tab */}
      {activeTab === 'admin' && (
        <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading Admin View...</div>}>
          <AdminSalaryAdvance />
        </React.Suspense>
      )}
    </div>
  );
};

export default Salaryadvance;
