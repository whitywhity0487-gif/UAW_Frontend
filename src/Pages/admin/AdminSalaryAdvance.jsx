import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminSalaryAdvance = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'ALL',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const [reasonModal, setReasonModal] = useState({ isOpen: false, reason: '', employeeName: '' });
  const [actionModal, setActionModal] = useState({ isOpen: false, action: '', requestId: '', remarks: '' });
  const [submittingAction, setSubmittingAction] = useState(false);

  const [repayModal, setRepayModal] = useState({ isOpen: false, employeeNumber: '', remarks: '' });
  const [submittingRepay, setSubmittingRepay] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRequests();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters.status, filters.dateFrom, filters.dateTo]);

  const fetchRequests = async () => {
    setSearchLoading(true);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (filters.status && filters.status !== 'ALL') {
        params.append('status', filters.status);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', new Date(filters.dateFrom).toISOString());
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        params.append('dateTo', endDate.toISOString());
      }
      
      const url = `http://localhost:5000/api/salary-advance/requests${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url);
      
      if (response.data.success) {
        setRequests(response.data.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch requests');
      setRequests([]);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/salary-advance/employee-analytics/${employeeId}`);
      if (response.data.success) {
        setSelectedEmployee(response.data.data);
        setShowEmployeeModal(true);
      }
    } catch (err) {
      setError('Failed to fetch employee details');
      setTimeout(() => setError(''), 3000);
    }
  };

  const submitAction = async (e) => {
    e.preventDefault();
    if (!actionModal.remarks.trim()) {
      alert("Remarks are mandatory before approval or rejection.");
      return;
    }

    setSubmittingAction(true);
    
    const storedUser = localStorage.getItem('user');
    let adminName = 'Admin';
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        adminName = user.name || user.username || 'Admin';
      } catch (e) {}
    }

    try {
      const response = await axios.put(`http://localhost:5000/api/salary-advance/request/${actionModal.requestId}/${actionModal.action}`, {
        adminRemarks: actionModal.remarks,
        reviewedBy: adminName
      });
      
      if (response.data.success) {
        setSuccessMsg(`Request successfully ${actionModal.action}d!`);
        setActionModal({ isOpen: false, action: '', requestId: '', remarks: '' });
        fetchRequests();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${actionModal.action} request`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmittingAction(false);
    }
  };

  const submitRepay = async (e) => {
    e.preventDefault();
    if (!repayModal.remarks.trim()) {
      alert("Remarks are mandatory for repayment.");
      return;
    }

    setSubmittingRepay(true);
    
    const storedUser = localStorage.getItem('user');
    let adminName = 'Admin';
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        adminName = user.name || user.username || 'Admin';
      } catch (e) {}
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/salary-advance/admin/repay/${repayModal.employeeNumber}`, {
        remarks: repayModal.remarks,
        adminName
      });
      
      if (response.data.success) {
        setSuccessMsg(response.data.message || 'Repayment recorded successfully!');
        setRepayModal({ isOpen: false, employeeNumber: '', remarks: '' });
        setShowEmployeeModal(false);
        fetchRequests();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process repayment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmittingRepay(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'ALL',
      dateFrom: '',
      dateTo: ''
    });
    setShowFilters(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return { bg: '#D1FAE5', text: '#065F46', icon: '✓' };
      case 'REJECTED': return { bg: '#FEE2E2', text: '#991B1B', icon: '✗' };
      default: return { bg: '#FEF3C7', text: '#92400E', icon: '⏳' };
    }
  };

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'CNY': return '¥';
      default: return '₹';
    }
  };

  const getTotalAmount = () => requests.reduce((sum, req) => sum + (req.amount || 0), 0);
  const getApprovedAmount = () => requests.filter(req => req.status === 'APPROVED').reduce((sum, req) => sum + (req.amount || 0), 0);
  const getRejectedAmount = () => requests.filter(req => req.status === 'REJECTED').reduce((sum, req) => sum + (req.amount || 0), 0);
  const getPendingAmount = () => requests.filter(req => req.status === 'PENDING').reduce((sum, req) => sum + (req.amount || 0), 0);
  const getEmployeeRejectedAmount = (empNum) => requests.filter(req => req.employeeNumber === empNum && req.status === 'REJECTED').reduce((sum, req) => sum + (req.amount || 0), 0);

  const hasActiveFilters = searchTerm.trim() !== '' || filters.status !== 'ALL' || filters.dateFrom || filters.dateTo;

  return (
    <div style={{ maxWidth: 1400, margin: '40px auto', padding: '0 20px' }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        padding: '32px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <div style={{ marginBottom: 24 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'transparent', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}
          >
            ← Back
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#111827' }}>
            👥 Manage Salary Advances
          </h2>
          
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ flex: 1, minWidth: 150, background: '#F9FAFB', padding: '16px', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Total Requests</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{requests.length}</div>
            </div>
            <div style={{ flex: 1, minWidth: 150, background: '#FEF3C7', padding: '16px', borderRadius: 12, border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 12, color: '#92400E', marginBottom: 4 }}>Pending Amount</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#92400E' }}>₹{getPendingAmount().toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, minWidth: 150, background: '#D1FAE5', padding: '16px', borderRadius: 12, border: '1px solid #A7F3D0' }}>
              <div style={{ fontSize: 12, color: '#065F46', marginBottom: 4 }}>Approved Amount</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#065F46' }}>₹{getApprovedAmount().toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, minWidth: 150, background: '#FEE2E2', padding: '16px', borderRadius: 12, border: '1px solid #FECACA' }}>
              <div style={{ fontSize: 12, color: '#991B1B', marginBottom: 4 }}>Rejected Amount</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#991B1B' }}>
                ₹{getRejectedAmount().toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 2, minWidth: 250, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by employee name, ID, employee number, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10B981'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
                {searchLoading && (
                  <div style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 20, height: 20, border: '2px solid #E5E7EB',
                    borderTopColor: '#10B981', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '12px 20px',
                  background: showFilters ? '#10B981' : '#F3F4F6',
                  border: `1px solid ${showFilters ? '#10B981' : '#D1D5DB'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  color: showFilters ? 'white' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                🔍 Filters {showFilters ? '▼' : '▲'}
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '12px 20px', background: '#EF4444', border: 'none',
                    borderRadius: 10, cursor: 'pointer', fontSize: 14,
                    fontWeight: 500, color: 'white', transition: 'background 0.2s'
                  }}
                >
                  ✕ Clear All
                </button>
              )}
            </div>

            {showFilters && (
              <div style={{
                marginTop: 16, padding: 16, background: '#F9FAFB', borderRadius: 10,
                border: '1px solid #E5E7EB', display: 'flex', gap: 16, flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }}
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, marginBottom: 20, color: '#991B1B', fontSize: 14 }}>
            ❌ {error}
          </div>
        )}
        
        {successMsg && (
          <div style={{ padding: '12px 16px', background: '#D1FAE5', borderRadius: 10, marginBottom: 20, color: '#065F46', fontSize: 14 }}>
            ✅ {successMsg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #E5E7EB', borderTopColor: '#065F46',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 16px'
            }} />
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280', background: '#F9FAFB', borderRadius: 12 }}>
            {hasActiveFilters ? (
              <>
                🔍 No results found for your search criteria<br />
                <button onClick={clearFilters} style={{ marginTop: 16, padding: '8px 20px', background: '#10B981', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
                  Clear Filters
                </button>
              </>
            ) : 'No salary advance requests found.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: 13 }}>Employee Details</th>
                  <th style={{ padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: 13 }}>Amount</th>
                  <th style={{ padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: 13 }}>Reason</th>
                  <th style={{ padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: 13 }}>Date</th>
                  <th style={{ padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: 13 }}>Status</th>
                  <th style={{ padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const statusColors = getStatusColor(req.status);
                  const formattedDate = req.appliedAt ? new Date(req.appliedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  }) : 'N/A';
                  const sym = getCurrencySymbol(req.currency);

                  return (
                    <tr key={req.requestId} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827', cursor: 'pointer' }}
                             onClick={() => fetchEmployeeDetails(req.employeeId || req.employeeNumber)}>
                          {req.employeeName} 🔍
                        </div>
                        {req.employeeNumber && (
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                            <strong>Emp No:</strong> {req.employeeNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 500, color: '#111827' }}>
                        {sym}{req.amount?.toLocaleString() || 0} {req.currency}
                       </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => setReasonModal({ isOpen: true, reason: req.reason, employeeName: req.employeeName })}
                          style={{
                            background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB',
                            padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                            fontSize: 12, fontWeight: 500, transition: 'all 0.2s'
                          }}
                        >
                          👁 View Reason
                        </button>
                       </td>
                      <td style={{ padding: '16px', color: '#4B5563', fontSize: 14 }}>
                        {formattedDate}
                       </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          background: statusColors.bg, color: statusColors.text,
                          padding: '4px 10px', borderRadius: 9999, fontSize: 12,
                          fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          {statusColors.icon} {req.status}
                        </span>
                        {req.adminRemarks && req.status !== 'PENDING' && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
                            <strong>Remarks:</strong> {req.adminRemarks}
                          </div>
                        )}
                       </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {req.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => setActionModal({ isOpen: true, action: 'approve', requestId: req.requestId, remarks: '' })}
                              style={{
                                background: '#10B981', color: 'white', border: 'none',
                                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                                fontSize: 13, fontWeight: 500
                              }}
                            >✓ Approve</button>
                            <button
                              onClick={() => setActionModal({ isOpen: true, action: 'reject', requestId: req.requestId, remarks: '' })}
                              style={{
                                background: '#EF4444', color: 'white', border: 'none',
                                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                                fontSize: 13, fontWeight: 500
                              }}
                            >✗ Reject</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: '#9CA3AF' }}>Processed</span>
                        )}
                       </td>
                     </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Analytics Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          overflow: 'auto'
        }}
          onClick={() => setShowEmployeeModal(false)}
        >
          <div style={{
            background: 'white', borderRadius: 20, width: '90%', maxWidth: 700,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Employee Analytics</h3>
                <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: 13 }}>Salary Advance History & Eligibility</p>
              </div>
              <button 
                onClick={() => setShowEmployeeModal(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', fontSize: 24, cursor: 'pointer', color: 'white', width: 32, height: 32, borderRadius: 8 }}
              >×</button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: 24, padding: 16, background: '#F9FAFB', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Employee Name</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>{selectedEmployee.employeeName}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      <strong>Emp Number:</strong> {selectedEmployee.employeeNumber}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Nationality</div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>{selectedEmployee.nationality}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 14, color: '#111827' }}>{selectedEmployee.email}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 16, background: '#ECFDF5', borderRadius: 12, border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: 12, color: '#065F46', marginBottom: 4 }}>Utilized (Approved) Amount</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#065F46' }}>
                    ₹{(selectedEmployee.salaryAdvanceUsed || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: 16, background: '#FEE2E2', borderRadius: 12, border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: 12, color: '#991B1B', marginBottom: 4 }}>Total Rejected Amount</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#991B1B' }}>
                    ₹{getEmployeeRejectedAmount(selectedEmployee.employeeNumber).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: 16, background: '#EFF6FF', borderRadius: 12, border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: 12, color: '#1E40AF', marginBottom: 4 }}>Remaining Eligible Balance</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1E40AF' }}>
                    ₹{(selectedEmployee.salaryAdvanceRemaining || 0).toLocaleString()}
                  </div>
                </div>
                
                <div style={{ padding: 16, background: selectedEmployee.salaryAdvanceEligible ? '#D1FAE5' : '#FEE2E2', borderRadius: 12, border: `1px solid ${selectedEmployee.salaryAdvanceEligible ? '#34D399' : '#F87171'}` }}>
                  <div style={{ fontSize: 12, color: selectedEmployee.salaryAdvanceEligible ? '#065F46' : '#991B1B', marginBottom: 4 }}>Current Eligibility</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: selectedEmployee.salaryAdvanceEligible ? '#065F46' : '#991B1B' }}>
                    {selectedEmployee.salaryAdvanceEligible ? '✅ Eligible' : '❌ Not Eligible'}
                  </div>
                  {!selectedEmployee.salaryAdvanceEligible && (
                    <div style={{ fontSize: 11, color: '#991B1B', marginTop: 4 }}>Limit Reached</div>
                  )}
                </div>
              </div>

              <div style={{ padding: 16, background: '#F9FAFB', borderRadius: 12, marginBottom: 24, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>Repayment Status</h4>
                    <div style={{ fontSize: 13, color: '#4B5563' }}>
                      {selectedEmployee.isRepaid ? (
                        <>
                          <span style={{ color: '#059669', fontWeight: 600 }}>Repaid</span> on {new Date(selectedEmployee.repaidDate).toLocaleDateString()}
                          <div style={{ marginTop: 4 }}><strong>By:</strong> {selectedEmployee.repaidBy}</div>
                          <div style={{ marginTop: 4 }}><strong>Remarks:</strong> {selectedEmployee.repaymentRemarks}</div>
                        </>
                      ) : (
                        <span style={{ color: '#D97706', fontWeight: 600 }}>Outstanding Balance</span>
                      )}
                    </div>
                  </div>
                  {(selectedEmployee.salaryAdvanceUsed || 0) > 0 && (
                    <button
                      onClick={() => setRepayModal({ isOpen: true, employeeNumber: selectedEmployee.employeeNumber, remarks: '' })}
                      style={{
                        background: '#3B82F6', color: 'white', border: 'none', padding: '8px 16px',
                        borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14
                      }}
                    >
                      Mark as Repaid
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {repayModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={() => setRepayModal({ isOpen: false, employeeNumber: '', remarks: '' })}
        >
          <div style={{
            background: 'white', borderRadius: 16, width: '90%', maxWidth: 480,
            padding: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                💳 Mark as Repaid
              </h3>
              <button 
                onClick={() => setRepayModal({ isOpen: false, employeeNumber: '', remarks: '' })}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}
              >×</button>
            </div>
            <form onSubmit={submitRepay}>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: 14, color: '#4B5563', marginBottom: 16 }}>
                  This will reset the employee's utilized amount to 0 and restore their eligibility to request new salary advances.
                </p>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                  Repayment Remarks *
                </label>
                <textarea
                  value={repayModal.remarks}
                  onChange={(e) => setRepayModal({ ...repayModal, remarks: e.target.value })}
                  placeholder="e.g. Recovered from April payroll"
                  rows={3}
                  required
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, resize: 'vertical' }}
                />
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setRepayModal({ isOpen: false, employeeNumber: '', remarks: '' })}
                  style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, color: '#374151' }}
                >Cancel</button>
                <button 
                  type="submit"
                  disabled={submittingRepay || !repayModal.remarks.trim()}
                  style={{ background: '#3B82F6', border: 'none', padding: '10px 20px', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                >
                  {submittingRepay ? 'Processing...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {reasonModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={() => setReasonModal({ isOpen: false, reason: '', employeeName: '' })}
        >
          <div style={{
            background: 'white', borderRadius: 16, width: '90%', maxWidth: 450,
            padding: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                📝 Reason for Salary Advance
              </h3>
              <button 
                onClick={() => setReasonModal({ isOpen: false, reason: '', employeeName: '' })}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}
              >×</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                <strong>Employee:</strong> {reasonModal.employeeName}
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '16px', border: '1px solid #E5E7EB', color: '#374151', fontSize: 14, whiteSpace: 'pre-wrap', minHeight: 60 }}>
                {reasonModal.reason || 'No reason provided.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={() => setActionModal({ isOpen: false, action: '', requestId: '', remarks: '' })}
        >
          <div style={{
            background: 'white', borderRadius: 16, width: '90%', maxWidth: 480,
            padding: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                {actionModal.action === 'approve' ? '✅ Approve Salary Advance' : '❌ Reject Salary Advance'}
              </h3>
              <button 
                onClick={() => setActionModal({ isOpen: false, action: '', requestId: '', remarks: '' })}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}
              >×</button>
            </div>
            <form onSubmit={submitAction}>
              <div style={{ padding: '20px 24px' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                  {actionModal.action === 'approve' ? 'Approval Remarks *' : 'Rejection Reason *'}
                </label>
                <textarea
                  value={actionModal.remarks}
                  onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                  rows={4}
                  required
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, resize: 'vertical' }}
                />
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, action: '', requestId: '', remarks: '' })}
                  style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, color: '#374151' }}
                >Cancel</button>
                <button 
                  type="submit"
                  disabled={submittingAction || !actionModal.remarks.trim()}
                  style={{
                    background: actionModal.action === 'approve' ? '#10B981' : '#EF4444',
                    border: 'none', padding: '10px 20px', color: 'white',
                    borderRadius: 8, cursor: 'pointer', fontWeight: 600
                  }}
                >
                  {submittingAction ? 'Processing...' : `Confirm ${actionModal.action === 'approve' ? 'Approve' : 'Reject'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminSalaryAdvance;