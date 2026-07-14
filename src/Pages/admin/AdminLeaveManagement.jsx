import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Briefcase, FileText, ChevronLeft, X, Eye, Users, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCard from '../../components/dashboard/StatCard';
import { API_BASE_URL as GLOBAL_API_BASE_URL } from '../../config/constants.js';

const API_BASE_URL = `${GLOBAL_API_BASE_URL}/api/leave`;

const AdminLeaveManagement = () => {
  const [employeeStats, setEmployeeStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [totals, setTotals] = useState({
    activeEmployees: 0,
    onLeave: 0,
    onWfh: 0
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [allLeavesRaw, setAllLeavesRaw] = useState([]);
  const [allUsersRaw, setAllUsersRaw] = useState([]);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  const [adjustingLeave, setAdjustingLeave] = useState(null);
  const [adjustDays, setAdjustDays] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

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
      } catch (err) {
        console.error("Error parsing user data", err);
      }
    } else {
      navigate('/');
      return;
    }

    fetchAllLeaves();
  }, [navigate]);

  const fetchAllLeaves = async () => {
    setLoading(true);
    try {
      const [leavesRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/all?t=${new Date().getTime()}`),
        axios.get(`${GLOBAL_API_BASE_URL}/api/users`)
      ]);

      if (leavesRes.data.success) {
        setAllLeavesRaw(leavesRes.data.data);
        processLeaveData(leavesRes.data.data);
      } else {
        setError('Failed to fetch leave data');
      }

      if (usersRes.data && usersRes.data.users) {
        setAllUsersRaw(usersRes.data.users);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustLeave = async () => {
    if (!adjustDays || isNaN(adjustDays) || adjustDays < 0 || adjustDays > adjustingLeave.totalDays) {
      toast.error("Please enter a valid number of days less than or equal to total approved days.");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Please enter a reason for adjustment.");
      return;
    }

    setAdjustLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const adminName = storedUser?.name || storedUser?.fullName || 'Admin';

      const res = await axios.put(`${API_BASE_URL}/adjust/${adjustingLeave.id}`, {
        actualUsedDays: parseFloat(adjustDays),
        adjustmentReason: adjustReason,
        adjustedBy: adminName
      });

      if (res.data.success) {
        setAdjustingLeave(null);
        setAdjustDays('');
        setAdjustReason('');
        setSelectedEmployee(null); // Close details modal to refresh data on next open
        fetchAllLeaves();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to adjust leave");
    } finally {
      setAdjustLoading(false);
    }
  };

  const processLeaveData = (leaves) => {
    const empMap = {};
    let tLeaves = 0;
    let tWfh = 0;

    leaves.forEach(leave => {
      // Use userId or employeeNumber as a unique identifier
      const key = leave.userId || leave.employeeNumber;
      if (!key) return;

      if (!empMap[key]) {
        empMap[key] = {
          userId: leave.userId,
          employeeName: leave.employeeName || 'Unknown',
          employeeNumber: leave.employeeNumber || 'N/A',
          company: leave.company || '',
          leaveTaken: 0,
          wfhTaken: 0,
          pendingRequests: 0,
          totalRequests: 0,
          leavesList: []
        };
      }

      empMap[key].totalRequests += 1;
      empMap[key].leavesList.push(leave);
      const days = leave.actualUsedDays !== undefined && leave.actualUsedDays !== null ? parseFloat(leave.actualUsedDays) : (parseFloat(leave.totalDays) || 0);

      if (leave.status === 'Approved') {
        if (leave.leaveType === 'Work From Home') {
          empMap[key].wfhTaken += days;
          tWfh += days;
        } else {
          empMap[key].leaveTaken += days;
          tLeaves += days;
        }
      } else if (leave.status === 'Pending') {
        empMap[key].pendingRequests += 1;
      }
    });

    const statsArray = Object.values(empMap);

    // Sort leavesList for each employee
    statsArray.forEach(emp => {
      emp.leavesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    setEmployeeStats(statsArray);
    setFilteredStats(statsArray);
    // setTotals is handled in the useEffect now
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStats(employeeStats);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = employeeStats.filter(emp =>
        (emp.employeeName && emp.employeeName.toLowerCase().includes(term)) ||
        (emp.employeeNumber && String(emp.employeeNumber).toLowerCase().includes(term))
      );
      setFilteredStats(filtered);
    }
  }, [searchTerm, employeeStats]);

  useEffect(() => {
    let activeEmpCount = 0;
    if (allUsersRaw.length > 0) {
      activeEmpCount = allUsersRaw.filter(u => u.role === 'Employee').length;
    }

    const leaveEmployees = new Set();
    const wfhEmployees = new Set();

    let checkStart, checkEnd;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter.start && dateFilter.end) {
      checkStart = new Date(dateFilter.start);
      checkEnd = new Date(dateFilter.end);
      checkStart.setHours(0, 0, 0, 0);
      checkEnd.setHours(23, 59, 59, 999);
    } else {
      checkStart = today;
      checkEnd = new Date(today);
      checkEnd.setHours(23, 59, 59, 999);
    }

    allLeavesRaw.forEach(leave => {
      if (leave.status === 'Approved') {
        const lStart = new Date(leave.startDate);
        const lEnd = leave.endDate ? new Date(leave.endDate) : new Date(leave.startDate);
        lStart.setHours(0, 0, 0, 0);
        lEnd.setHours(23, 59, 59, 999);

        // Check for overlap between leave period and filter period
        if (lStart <= checkEnd && lEnd >= checkStart) {
          const key = leave.userId || leave.employeeNumber;
          if (key) {
            if (leave.leaveType === 'Work From Home') {
              wfhEmployees.add(key);
            } else {
              leaveEmployees.add(key);
            }
          }
        }
      }
    });

    setTotals({
      activeEmployees: activeEmpCount,
      onLeave: leaveEmployees.size,
      onWfh: wfhEmployees.size
    });
  }, [allLeavesRaw, allUsersRaw, dateFilter]);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Employee Leave Stats"
        subtitle="Overview of all employees' leaves and WFH balances"
      />

      <DashboardContainer>
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            {
              icon: Users,
              title: "Total Employees",
              value: totals.activeEmployees,
              description: "Active Employees",
              colorClass: "text-blue-600 bg-blue-50"
            },
            {
              icon: Calendar,
              title: "Employees on Leave",
              value: totals.onLeave,
              description: "Currently on Leave",
              colorClass: "text-rose-600 bg-rose-50"
            },
            {
              icon: Home,
              title: "Employees on WFH",
              value: totals.onWfh,
              description: "Working from Home",
              colorClass: "text-emerald-600 bg-emerald-50"
            }
          ].map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by Employee Name or Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-gray-50/50"
            />
            <span className="text-gray-500 font-medium">to</span>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-gray-50/50"
            />
            {(dateFilter.start || dateFilter.end) && (
              <button
                onClick={() => setDateFilter({ start: '', end: '' })}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear date filter"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Loading employee statistics...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-500 bg-red-50">{error}</div>
          ) : filteredStats.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-lg">No employee leave data found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4 text-center">Company</th>
                    <th className="px-6 py-4 text-center">Leave Taken</th>
                    <th className="px-6 py-4 text-center">WFH Taken</th>
                    <th className="px-6 py-4 text-center">Remaining (Annual)</th>
                    <th className="px-6 py-4 text-center">Pending</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredStats.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{emp.employeeName}</div>
                        <div className="text-xs text-gray-500">{emp.employeeNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                        {emp.company || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-bold text-gray-800 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">{emp.leaveTaken}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-bold text-gray-800 bg-purple-50 text-purple-700 px-3 py-1 rounded-lg">{emp.wfhTaken}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg">{11 - emp.leaveTaken}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {emp.pendingRequests > 0 ? (
                          <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-semibold">{emp.pendingRequests} Pending</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </DashboardContainer>

      {/* Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedEmployee.employeeName}</h2>
                <p className="text-sm text-gray-500">{selectedEmployee.employeeNumber} • {selectedEmployee.company}</p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">Leave Taken</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedEmployee.leaveTaken} <span className="text-sm font-normal text-blue-700">days</span></p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-sm text-purple-600 font-medium mb-1">WFH Taken</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedEmployee.wfhTaken} <span className="text-sm font-normal text-purple-700">days</span></p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-600 font-medium mb-1">Remaining Leaves</p>
                  <p className="text-2xl font-bold text-emerald-900">{11 - selectedEmployee.leaveTaken} <span className="text-sm font-normal text-emerald-700">days</span></p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Leave History</h3>
              {selectedEmployee.leavesList.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No leave history found.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Dates</th>
                        <th className="px-4 py-3 text-center">Days</th>
                        <th className="px-4 py-3 text-center">AL Used</th>
                        <th className="px-4 py-3 text-center">LOP</th>
                        <th className="px-4 py-3 text-center">Salary Impact</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedEmployee.leavesList.map((req, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{req.leaveType}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            {req.endDate && req.startDate !== req.endDate ? ` → ${new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-gray-700">
                            {req.actualUsedDays !== undefined && req.actualUsedDays !== null ? (
                              <div className="flex flex-col items-center">
                                <span>{req.actualUsedDays}</span>
                                <span className="text-[10px] text-gray-400 line-through">({req.totalDays})</span>
                              </div>
                            ) : req.totalDays}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{req.annualLeaveDays || (req.leaveType === 'Leave' || req.leaveType === 'Annual Leave' ? req.actualUsedDays || req.totalDays : 0)}</td>
                          <td className="px-4 py-3 text-center font-medium text-amber-600">{req.lopDays || 0}</td>
                          <td className="px-4 py-3 text-center">
                            {req.isLOP ? <span className="px-2 py-1 text-[10px] bg-red-50 text-red-600 font-semibold rounded">Yes</span> : <span className="text-gray-400 text-xs">-</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                              req.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                              {req.status || 'Pending'}
                            </span>
                            {req.adjustmentReason && (
                              <div className="text-[10px] text-gray-500 mt-1 max-w-[120px] truncate" title={req.adjustmentReason}>
                                Adj: {req.adjustmentReason}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {req.status === 'Approved' && (
                              <button
                                onClick={() => { setAdjustingLeave(req); setAdjustDays(req.actualUsedDays || req.totalDays); }}
                                className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold hover:bg-blue-100 transition-colors"
                              >
                                Adjust
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Adjust Leave Modal */}
      {adjustingLeave && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Adjust Leave (Early Return)</h3>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Employee:</span>
                <span className="font-semibold text-gray-900">{adjustingLeave.employeeName}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Originally Approved:</span>
                <span className="font-semibold text-gray-900">{adjustingLeave.totalDays} days</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Used Days *</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  max={adjustingLeave.totalDays}
                  value={adjustDays}
                  onChange={(e) => setAdjustDays(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={`e.g. ${Math.max(0, adjustingLeave.totalDays - 1)}`}
                />
                <p className="text-xs text-gray-500 mt-1">Must be less than or equal to {adjustingLeave.totalDays}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Adjustment *</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  placeholder="e.g. Employee returned from sick leave 2 days early..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setAdjustingLeave(null); setAdjustDays(''); setAdjustReason(''); }}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                disabled={adjustLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustLeave}
                disabled={adjustLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {adjustLoading ? 'Saving...' : 'Save Adjustment'}
              </button>
            </div>
          </div>
        </div>

      )}
    </DashboardLayout>
  );
};

export default AdminLeaveManagement;
