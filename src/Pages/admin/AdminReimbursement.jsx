import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCard from '../../components/dashboard/StatCard';
import { API_BASE_URL as GLOBAL_API_BASE_URL } from '../../config/constants.js';

const API_BASE_URL = `${GLOBAL_API_BASE_URL}/api/reimbursements`;

const AdminReimbursement = () => {
  const [reimbursements, setReimbursements] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [adminName, setAdminName] = useState('Admin');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ id: null, action: '' });
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role !== 'Admin') {
          navigate('/home');
          return;
        }
        setAdminName(user.name || user.username || 'Admin');
      } catch (err) {
        console.error("Error parsing user data", err);
      }
    } else {
      navigate('/');
      return;
    }

    fetchReimbursements();
  }, [navigate]);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin?t=${new Date().getTime()}`);
      if (response.data.success) {
        const data = response.data.data;
        setReimbursements(data);
        setFilteredData(data);
        calculateStats(data);
      }
    } catch (err) {
      console.error('Error fetching reimbursements:', err);
      setError('Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      pending: data.filter(r => r.status === 'PENDING').length,
      approved: data.filter(r => r.status === 'APPROVED').length,
      rejected: data.filter(r => r.status === 'REJECTED').length
    });
  };

  useEffect(() => {
    filterData();
  }, [searchTerm, statusFilter, reimbursements]);

  const filterData = () => {
    let filtered = reimbursements;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => r.status === statusFilter.toUpperCase());
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.employeeNumber || '').toLowerCase().includes(term) ||
        (r.employeeName || '').toLowerCase().includes(term)
      );
    }

    setFilteredData(filtered);
  };

  const handleAction = (id, newStatus) => {
    setModalData({ id, action: newStatus });
    setReason('');
    setIsModalOpen(true);
  };

  const submitAction = async () => {
    if (reason.trim() === '') {
      toast.error('Reason is mandatory!');
      return;
    }

    const { id, action: newStatus } = modalData;
    setIsSubmitting(true);

    try {
      const response = await axios.put(`${API_BASE_URL}/admin/${id}/status`, {
        status: newStatus,
        adminName,
        reason: reason.trim()
      });

      if (response.data.success) {
        // Update local state
        const updatedData = reimbursements.map(r =>
          r.id === id ? { ...r, status: newStatus, actionDate: new Date().toISOString(), approvedBy: adminName, reason: reason.trim() } : r
        );
        setReimbursements(updatedData);
        calculateStats(updatedData);
        toast.success(`Reimbursement request ${newStatus.toLowerCase()} successfully!`);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">APPROVED</span>;
      case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">REJECTED</span>;
      default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">PENDING</span>;
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Reimbursement Management"
        subtitle="Review and manage employee reimbursement requests"
      />

      <DashboardContainer>
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            {
              icon: FileText,
              title: "Total Requests",
              value: stats.total,
              colorClass: "text-blue-600 bg-blue-50"
            },
            {
              icon: Clock,
              title: "Pending Requests",
              value: stats.pending,
              colorClass: "text-yellow-600 bg-yellow-50"
            },
            {
              icon: CheckCircle,
              title: "Approved Requests",
              value: stats.approved,
              colorClass: "text-green-600 bg-green-50"
            },
            {
              icon: XCircle,
              title: "Rejected Requests",
              value: stats.rejected,
              colorClass: "text-red-600 bg-red-50"
            }
          ].map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              placeholder="Search by Employee No. or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter By:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Loading reimbursements...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-500 bg-red-50">{error}</div>
          ) : filteredData.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <p className="text-lg">No reimbursement requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type & Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{item.employeeName}</div>
                        <div className="text-xs text-gray-500">{item.employeeNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.reimbursementType}</div>
                        <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-800">₹{item.amount}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[120px]" title={item.description}>{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.documentUrl ? (
                          <a href={item.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                            <svg className="-ml-0.5 mr-2 h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No document</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                        {item.actionDate && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            by {item.approvedBy} on {new Date(item.actionDate).toLocaleDateString()}
                          </div>
                        )}
                        {item.reason && (
                          <div className="text-[11px] text-gray-500 mt-1 italic max-w-[150px] truncate" title={item.reason}>
                            Remarks: {item.reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {item.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleAction(item.id, 'APPROVED')}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(item.id, 'REJECTED')}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Action Taken</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">
                  {modalData.action === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a mandatory reason for {modalData.action === 'APPROVED' ? 'approving' : 'rejecting'} this request.
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter your reason here..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                  autoFocus
                />
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAction}
                  disabled={isSubmitting || reason.trim() === ''}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2 ${
                    modalData.action === 'APPROVED'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardContainer>
    </DashboardLayout>
  );
};

export default AdminReimbursement;
