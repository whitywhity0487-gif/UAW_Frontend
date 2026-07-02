import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, CheckCircle, XCircle,
  FileText, Activity, Briefcase, Plus, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import Button from '../../components/Button';
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';

const API_BASE_URL = 'http://localhost:5000/api/leave';
const PD_API_URL = 'http://localhost:5000/api/personal-details';

const LEAVE_TYPES = ['Leave', 'Work From Home'];
const REASONS = [
  'Family Function', 'Medical Emergency', 'Personal Work',
  'Vacation', 'Marriage', 'Child Care', 'Travel', 'Other'
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LeaveManagement() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = storedUser?.role;
  
  const [employeeDetails, setEmployeeDetails] = useState({
    employeeNumber: '', employeeName: '', company: '', userId: ''
  });

  const [balances, setBalances] = useState({
    annualEntitlement: 11, annualUsed: 0, annualBalance: 11,
    wfhUsed: 0, totalSubmitted: 0, pendingRequests: 0,
    approvedRequests: 0, rejectedRequests: 0
  });

  const [history, setHistory] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedViewLeave, setSelectedViewLeave] = useState(null);
  const [selectedEmployeeBalances, setSelectedEmployeeBalances] = useState(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const handleViewLeave = async (req) => {
    setSelectedViewLeave(req);
    setShowViewModal(true);
    setSelectedEmployeeBalances(null);
    setLoadingBalances(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/user/${req.userId}`);
      if (res.data.success) {
        setSelectedEmployeeBalances(res.data.balances);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBalances(false);
    }
  };

  // Inline selection state for mini calendar
  const [inlineStartDate, setInlineStartDate] = useState(null);
  const [inlineEndDate, setInlineEndDate] = useState(null);
  const [inlineLeaveType, setInlineLeaveType] = useState('');
  const [inlineReason, setInlineReason] = useState('');
  const [inlineCustomReason, setInlineCustomReason] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    reason: '',
    customReason: '',
    totalDays: 0
  });

  const [lopConsent, setLopConsent] = useState(false);
  const [inlineLopConsent, setInlineLopConsent] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) { navigate('/'); return; }
      const user = JSON.parse(storedUser);
      const userId = user.username || user.employeeId || user.id;

      // 1. Fetch Personal Details
      const pdRes = await axios.get(`${PD_API_URL}?userId=${userId}`);
      let empNum = '', empName = '', company = '';

      if (pdRes.data.success && pdRes.data.data) {
        const pd = pdRes.data.data;
        empNum = pd.employeeNumber || '';
        empName = pd.fullName || '';
        company = pd.assignedCompany || pd.assignedClient || pd.clientName || '';

        setEmployeeDetails({ employeeNumber: empNum, employeeName: empName, company, userId });
      }

      // 2. Fetch Leave Details
      if (userId) {
        await fetchLeaveData(userId);
        await checkSupervisorAndFetchTeamLeaves(userId);
      }

      // 3. Fetch Company Holidays
      if (company) {
        try {
          const holidayRes = await fetch(`http://localhost:5000/api/holiday/group/${encodeURIComponent(company)}`);
          const data = await holidayRes.json();
          let arr = data.data || data.holidays || data;
          if (Array.isArray(arr)) {
            // Flatten to simple map of YYYY-MM-DD strings
            const holidayDates = arr.map(h => {
              const rawDate = h.holiday ? h.holiday.date : h.date;
              if (!rawDate) return null;
              const d = new Date(rawDate);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            }).filter(Boolean);
            setCompanyHolidays(holidayDates);
          }
        } catch (e) { console.error("Failed to fetch holidays", e); }
      }

    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveData = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/user/${userId}`);
      if (res.data.success) {
        setBalances(res.data.balances);
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkSupervisorAndFetchTeamLeaves = async (userId) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const role = storedUser?.role;
      
      if (role === 'HR') {
        setIsSupervisor(true); // Reuse the same UI state for simplicity
        const leavesRes = await axios.get(`${API_BASE_URL}/hr/${userId}`);
        if (leavesRes.data.success) {
          setTeamLeaves(leavesRes.data.data);
        }
      } else {
        const teamRes = await axios.get(`http://localhost:5000/api/teams/user/${userId}`);
        if (teamRes.data.success && teamRes.data.data.supervises && teamRes.data.data.supervises.length > 0) {
          setIsSupervisor(true);
          const leavesRes = await axios.get(`${API_BASE_URL}/team/${userId}`);
          if (leavesRes.data.success) {
            setTeamLeaves(leavesRes.data.data);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching team leaves", err);
    }
  };

  const handleUpdateLeaveStatus = async (id, newStatus) => {
    if (window.confirm(`Are you sure you want to mark this request as ${newStatus}?`)) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const role = storedUser?.role;
        const approverRole = role === 'HR' ? 'HR' : 'Supervisor';
        
        const res = await axios.put(`${API_BASE_URL}/status/${id}`, { 
          status: newStatus,
          approverRole: approverRole
        });
        if (res.data.success) {
          setSuccessMsg(`Leave request ${newStatus.toLowerCase()} successfully.`);
          setTimeout(() => setSuccessMsg(''), 3000);
          checkSupervisorAndFetchTeamLeaves(employeeDetails.userId);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update status.');
      }
    }
  };

  // Utility to calculate days
  const calculateTotalDays = (start, end, sTime, eTime) => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (d1 > d2) return 0;

    // Simple calculation: 1 day per date (excluding weekends)
    let count = 0;
    let curDate = new Date(d1);
    while (curDate <= d2) {
      const dayOfWeek = curDate.getDay();
      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Skip company holidays
        const dateStr = curDate.toISOString().split('T')[0];
        if (!companyHolidays.includes(dateStr)) {
          count++;
        }
      }
      curDate.setDate(curDate.getDate() + 1);
    }

    // Fractional adjustments if same day
    if (d1.getTime() === d2.getTime() && count === 1) {
      // Check hours
      const h1 = parseInt(sTime.split(':')[0]);
      const h2 = parseInt(eTime.split(':')[0]);
      const diff = h2 - h1;
      if (diff <= 4) { count = 0.5; }
    }

    return count;
  };

  useEffect(() => {
    const days = calculateTotalDays(formData.startDate, formData.endDate, formData.startTime, formData.endTime);
    setFormData(prev => ({ ...prev, totalDays: days }));
  }, [formData.startDate, formData.endDate, formData.startTime, formData.endTime, companyHolidays]);

  const handleMiniCalendarClick = (dateStr) => {
    if (!inlineStartDate || (inlineStartDate && inlineEndDate)) {
      setInlineStartDate(dateStr);
      setInlineEndDate(null);
    } else {
      if (dateStr < inlineStartDate) {
        setInlineStartDate(dateStr);
      } else {
        setInlineEndDate(dateStr);
      }
    }
  };

  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccessMsg('');

    if (!inlineStartDate || !inlineEndDate) {
      setError("Please select both start and end date on the calendar.");
      return;
    }
    const days = calculateTotalDays(inlineStartDate, inlineEndDate, '09:00', '18:00');
    if (days <= 0) {
      setError("Total chargeable days must be greater than 0.");
      return;
    }
    if (!inlineLeaveType) {
      setError("Please select a leave type.");
      return;
    }
    if (!inlineReason) {
      setError("Please select a reason.");
      return;
    }

    const isAnnualLeave = inlineLeaveType === 'Annual Leave' || inlineLeaveType === 'Leave';
    const inlineLopDays = isAnnualLeave ? Math.max(0, days - balances.annualBalance) : 0;

    if (inlineLopDays > 0 && !inlineLopConsent) {
      setError("Please check the LOP consent checkbox.");
      return;
    }

    setSubmitLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const payload = {
        userId: employeeDetails.userId,
        employeeName: employeeDetails.employeeName,
        employeeNumber: employeeDetails.employeeNumber,
        company: employeeDetails.company,
        leaveType: inlineLeaveType,
        startDate: inlineStartDate,
        startTime: '09:00',
        endDate: inlineEndDate,
        endTime: '18:00',
        reason: inlineReason,
        customReason: inlineCustomReason,
        totalDays: days,
        role: storedUser?.role
      };

      const res = await axios.post(`${API_BASE_URL}/apply`, payload);
      if (res.data.success) {
        setSuccessMsg('Leave request submitted successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
        setInlineStartDate(null);
        setInlineEndDate(null);
        setInlineLeaveType('');
        setInlineReason('');
        setInlineCustomReason('');
        setInlineLopConsent(false);
        fetchLeaveData(employeeDetails.userId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccessMsg('');

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }
    if (formData.totalDays <= 0) {
      setError("Total days must be greater than 0 (Check weekends/holidays).");
      return;
    }
    if (!formData.reason) {
      setError("Please select a reason for the leave.");
      return;
    }

    const isAnnualLeave = formData.leaveType === 'Annual Leave' || formData.leaveType === 'Leave';
    const lopDays = isAnnualLeave ? Math.max(0, formData.totalDays - balances.annualBalance) : 0;

    if (lopDays > 0 && !lopConsent) {
      setError("Please check the LOP consent checkbox.");
      return;
    }

    setSubmitLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const payload = {
        userId: employeeDetails.userId,
        employeeName: employeeDetails.employeeName,
        employeeNumber: employeeDetails.employeeNumber,
        company: employeeDetails.company,
        ...formData,
        role: storedUser?.role
      };

      const res = await axios.post(`${API_BASE_URL}/apply`, payload);
      if (res.data.success) {
        setSuccessMsg('Leave request submitted successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
        setShowApplyModal(false);
        setFormData({ leaveType: '', startDate: '', startTime: '09:00', endDate: '', endTime: '18:00', reason: '', customReason: '', totalDays: 0 });
        setLopConsent(false);
        fetchLeaveData(employeeDetails.userId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Calendar render helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else { setCurrentMonth(m => m - 1); }
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else { setCurrentMonth(m => m + 1); }
  };

  const generateCalendarCells = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  // Custom Day Renderer for DatePicker
  const renderDayContents = (day, date) => {
    const d = new Date(date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const isHoliday = companyHolidays.includes(dateStr);

    if (isHoliday) {
      return (
        <div className="relative flex justify-center items-center w-full h-full" title="Holiday">
          <span>{day}</span>
          <span className="absolute -top-1 -right-1 text-[8px] leading-none">😊</span>
        </div>
      );
    }
    return <span>{day}</span>;
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const s = status || 'Pending';
    if (s === 'N/A') {
      return <span className="font-bold text-gray-400 flex items-center justify-center">-</span>;
    }
    const config = {
      Approved: 'bg-emerald-100 text-emerald-800',
      Rejected: 'bg-rose-100 text-rose-800',
      Pending: 'bg-amber-100 text-amber-800'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config[s] || 'bg-gray-100 text-gray-800'}`}>
        {s}
      </span>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Activity className="animate-spin w-8 h-8 text-blue-600" /></div>;
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        title="Leave Dashboard"
        subtitle="Manage your leaves and view your balances"
        actions={
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block text-white/90">
              <p className="text-sm font-semibold text-white">{employeeDetails.userId}</p>
              <p className="text-xs opacity-75 font-mono">{employeeDetails.employeeNumber} • {employeeDetails.company}</p>
            </div>
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md cursor-pointer transition-colors text-sm font-medium border border-blue-500/30"
            >
              <Plus size={16} /> Apply Leave
            </button>
          </div>
        }
      />
      <DashboardContainer>
        <div className="max-w-7xl mx-auto">

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100">
            <XCircle size={20} /> {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100">
            <CheckCircle size={20} /> {successMsg}
          </div>
        )}

        {/* Top Cards - Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Annual Leave */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><CalendarIcon size={20} /></div>
              <h3 className="font-semibold text-gray-800">Annual Leave</h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{balances.annualBalance}</p>
                <p className="text-xs text-gray-500 font-medium">Days Available</p>
              </div>
              <div className="text-right text-xs text-gray-500 space-y-1">
                <p>Total: {balances.annualEntitlement}</p>
                <p>Used: {balances.annualUsed}</p>
              </div>
            </div>
          </div>

          {/* WFH & Comp Off */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Briefcase size={20} /></div>
              <h3 className="font-semibold text-gray-800">WFH Used</h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{balances.wfhUsed}</p>
                <p className="text-xs text-gray-500 font-medium">Days Taken</p>
              </div>
            </div>
          </div>

          {/* Request Status */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center"><FileText size={20} /></div>
              <h3 className="font-semibold text-gray-800">Requests</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <div className="bg-gray-50 p-2 rounded-lg text-gray-600">Total: {balances.totalSubmitted}</div>
              <div className="bg-amber-50 p-2 rounded-lg text-amber-700">Pending: {balances.pendingRequests}</div>
              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-700">Approved: {balances.approvedRequests}</div>
              <div className="bg-rose-50 p-2 rounded-lg text-rose-700">Rejected: {balances.rejectedRequests}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* History Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-800">Leave History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">Leave Type</th>
                      <th className="px-6 py-3">From - To</th>
                      <th className="px-6 py-3 text-center">Days</th>
                      <th className="px-6 py-3 text-center">AL Used</th>
                      <th className="px-6 py-3 text-center">LOP</th>
                      <th className="px-6 py-3 text-center">Salary Impact</th>
                      <th className="px-6 py-3">Reason</th>
                      {!isSupervisor && <th className="px-6 py-3">Sup. Status</th>}
                      <th className="px-6 py-3">HR Status</th>
                      <th className="px-6 py-3">Overall Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                          No leave requests found.
                        </td>
                      </tr>
                    ) : (
                      history.map((req, idx) => (
                        <tr key={req.id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{req.leaveType}</td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            <span className="mx-1 text-gray-400">→</span>
                            {new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-gray-700">
                            {req.actualUsedDays !== undefined && req.actualUsedDays !== null ? (
                              <div className="flex flex-col items-center">
                                <span>{req.actualUsedDays}</span>
                                <span className="text-[10px] text-gray-400 line-through">({req.totalDays})</span>
                              </div>
                            ) : req.totalDays}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">{req.annualLeaveDays || (req.leaveType === 'Leave' || req.leaveType === 'Annual Leave' ? req.actualUsedDays || req.totalDays : 0)}</td>
                          <td className="px-6 py-4 text-center font-medium text-amber-600">{req.lopDays || 0}</td>
                          <td className="px-6 py-4 text-center">
                            {req.isLOP ? <span className="px-2 py-1 text-xs bg-red-50 text-red-600 font-semibold rounded-md">Applicable</span> : <span className="text-gray-400 text-xs">No</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-[150px] truncate" title={req.reason}>
                            {req.reason}
                          </td>
                          {!isSupervisor && (
                            <td className="px-6 py-4">
                              <StatusBadge status={req.supervisorStatus} />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <StatusBadge status={req.hrStatus} />
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={req.status} />
                            {req.adjustmentReason && (
                              <div className="text-[10px] text-gray-500 mt-1 max-w-[120px] truncate" title={req.adjustmentReason}>
                                Adj: {req.adjustmentReason}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team Leave Requests (For Supervisors only) */}
            {isSupervisor && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
                  <h2 className="text-lg font-semibold text-gray-800">Team Leave Requests</h2>
                </div>
                {/* Removed Team Leave Summary Cards as requested */}                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Leave Type</th>
                        <th className="px-6 py-3">From - To</th>
                        <th className="px-6 py-3 text-center">Days</th>
                        <th className="px-6 py-3">Reason</th>
                        <th className="px-6 py-3">Sup. Status</th>
                        <th className="px-6 py-3">HR Status</th>
                        <th className="px-6 py-3">Overall Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teamLeaves.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                            No team leave requests found.
                          </td>
                        </tr>
                      ) : (
                        teamLeaves.map((req, idx) => (
                          <tr key={req.id || idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {req.employeeName}<br />
                              <span className="text-xs text-gray-500 font-normal">{req.userId}</span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-700">{req.leaveType}</td>
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                              {new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              <span className="mx-1 text-gray-400">→</span>
                              {new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-6 py-4 text-center font-medium text-gray-700">{req.totalDays}</td>
                            <td className="px-6 py-4 text-gray-600 max-w-[150px] truncate" title={req.reason}>
                              {req.reason}
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={req.supervisorStatus} /></td>
                            <td className="px-6 py-4"><StatusBadge status={req.hrStatus} /></td>
                            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                            <td className="px-6 py-4 text-right">
                              {(() => {
                                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                                const role = storedUser?.role;
                                // If they are HR, check hrStatus. If they are Supervisor, check supervisorStatus.
                                const isPendingForMe = role === 'HR' 
                                  ? (req.hrStatus === 'Pending' || !req.hrStatus) 
                                  : (req.supervisorStatus === 'Pending' || !req.supervisorStatus);
                                  
                                return (
                                  <div className="flex justify-end gap-2 items-center">
                                    <button 
                                      onClick={() => handleViewLeave(req)} 
                                      className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      View
                                    </button>
                                    
                                    {isPendingForMe ? (
                                      <>
                                        <button onClick={() => handleUpdateLeaveStatus(req.id, 'Approved')} className="px-3 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-semibold transition-colors">Approve</button>
                                        <button onClick={() => handleUpdateLeaveStatus(req.id, 'Rejected')} className="px-3 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-xs font-semibold transition-colors">Reject</button>
                                      </>
                                    ) : (
                                      <span className="text-xs text-gray-400 ml-1">Processed</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Mini Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{employeeDetails.company} Calendar</h2>

              <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
                <span className="font-medium text-gray-800">{MONTHS[currentMonth]} {currentYear}</span>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {DAYS_SHORT.map(d => <div key={d} className="text-xs font-semibold text-gray-400">{d[0]}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarCells().map((day, idx) => {
                  if (!day) return <div key={idx} />;

                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isWeekend = new Date(currentYear, currentMonth, day).getDay() === 0 || new Date(currentYear, currentMonth, day).getDay() === 6;
                  const isHoliday = companyHolidays.includes(dateStr);

                  // Check if approved leave, excluding weekends and holidays
                  const approvedLeave = (!isHoliday && !isWeekend) ? history.find(l =>
                    l.status === 'Approved' &&
                    dateStr >= l.startDate && dateStr <= l.endDate
                  ) : null;

                  let cellClass = "w-8 h-8 flex items-center justify-center rounded-full text-sm mx-auto";

                  const isSelectedStart = dateStr === inlineStartDate;
                  const isSelectedEnd = dateStr === inlineEndDate;
                  const isWithinRange = inlineStartDate && inlineEndDate && dateStr > inlineStartDate && dateStr < inlineEndDate;
                  const isSelected = isSelectedStart || isSelectedEnd || isWithinRange;

                  if (isSelectedStart || isSelectedEnd) {
                    cellClass += " bg-blue-600 text-white font-bold shadow-md";
                  } else if (isWithinRange) {
                    cellClass += " bg-blue-100 text-blue-900";
                  }

                  if (approvedLeave) {
                    const isWfh = approvedLeave.leaveType === 'Work From Home';
                    return (
                      <div key={idx} className="py-1 flex flex-col items-center justify-center group" title={approvedLeave.leaveType}>
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full mx-auto
                          ${isWfh ? 'bg-purple-50 border border-purple-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                          <span className="text-sm leading-none select-none">{isWfh ? '💻' : '🏖️'}</span>
                        </div>
                        <span className={`block text-center text-[10px] font-semibold leading-tight mt-0.5 ${isWfh ? 'text-purple-700' : 'text-emerald-700'}`}>{day}</span>
                      </div>
                    );
                  }
                  else if (isHoliday) {
                    return (
                      <div key={idx} className="py-1 flex flex-col items-center justify-center group" title="Holiday">
                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-50 border border-amber-200 mx-auto">
                          <span className="text-sm leading-none select-none">😊</span>
                        </div>
                        <span className="block text-center text-[10px] font-semibold text-amber-700 leading-tight mt-0.5">{day}</span>
                      </div>
                    );
                  }
                  else if (isWeekend && !isSelected) cellClass += " text-red-400 font-medium";
                  else if (!isSelected) cellClass += " text-gray-700 hover:bg-gray-100";

                  return (
                    <div key={idx} className="py-1 flex flex-col items-center justify-center">
                      <div
                        className={`${cellClass} cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all`}
                        onClick={() => handleMiniCalendarClick(dateStr)}
                        title="Click to select start and end date"
                      >
                        {day}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center gap-2"><div className="w-6 h-6 flex justify-center items-center rounded-full bg-amber-50 border border-amber-200 text-sm">😊</div> <span className="text-gray-600">Company Holiday</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 flex justify-center items-center rounded-full bg-emerald-50 border border-emerald-200 text-sm">🏖️</div> <span className="text-gray-600">Approved Leave</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 flex justify-center items-center rounded-full bg-purple-50 border border-purple-200 text-sm">💻</div> <span className="text-gray-600">Work From Home</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full text-red-400 bg-red-50 ml-1.5"></div> <span className="text-gray-600 ml-1.5">Weekend</span></div>
              </div>

              {/* Inline Apply Form */}
              {(inlineStartDate || inlineEndDate) && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Apply Leave</h3>
                    <button onClick={() => { setInlineStartDate(null); setInlineEndDate(null); }} className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer">Cancel</button>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm flex justify-between">
                    <span className="text-blue-800 font-medium">Selected:</span>
                    <span className="text-blue-900 font-bold">
                      {new Date(inlineStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {inlineEndDate ? ` → ${new Date(inlineEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}
                    </span>
                  </div>

                  <form onSubmit={handleInlineSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Leave Type *</label>
                      <select
                        required value={inlineLeaveType} onChange={(e) => setInlineLeaveType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Type</option>
                        {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Reason *</label>
                      <select
                        required value={inlineReason} onChange={(e) => setInlineReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-2"
                      >
                        <option value="">Select Reason</option>
                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <textarea
                        value={inlineCustomReason} onChange={(e) => setInlineCustomReason(e.target.value)}
                        placeholder="Additional notes (optional)..." rows="2"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    {(() => {
                      const days = inlineStartDate && inlineEndDate ? calculateTotalDays(inlineStartDate, inlineEndDate, '09:00', '18:00') : 0;
                      const isAL = inlineLeaveType === 'Annual Leave' || inlineLeaveType === 'Leave';
                      const lopDays = isAL ? Math.max(0, days - balances.annualBalance) : 0;
                      const alUsed = isAL ? Math.min(days, balances.annualBalance) : 0;
                      
                      return (
                        <>
                          {days > 0 && isAL && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1 mb-4">
                              <div className="flex justify-between"><span className="text-gray-500">Requested Days:</span> <span className="font-semibold">{days}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Available AL:</span> <span className="font-semibold">{balances.annualBalance}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">AL Used:</span> <span className="font-semibold text-emerald-600">{alUsed}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">LOP Days:</span> <span className="font-semibold text-red-600">{lopDays}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Salary Impact:</span> <span className="font-semibold">{lopDays > 0 ? 'Applicable' : 'Not Applicable'}</span></div>
                            </div>
                          )}
                          
                          {lopDays > 0 && (
                            <div className="mb-4">
                              <label className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-100 cursor-pointer">
                                <input type="checkbox" className="mt-0.5" checked={inlineLopConsent} onChange={(e) => setInlineLopConsent(e.target.checked)} />
                                <span>I understand that this leave exceeds my available Annual Leave balance. The excess leave days will be treated as Loss Of Pay (LOP), and salary deductions will be applied.</span>
                              </label>
                            </div>
                          )}

                          <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={!inlineEndDate || (lopDays > 0 && !inlineLopConsent)}
                            isLoading={submitLoading}
                          >
                            Submit Leave
                          </Button>
                        </>
                      );
                    })()}
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Apply Leave</h2>
              <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Employee Info Readonly */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <div className="text-sm"><span className="text-gray-500 w-32 inline-block">Name:</span> <span className="font-semibold">{employeeDetails.employeeName}</span></div>
                  <div className="text-sm"><span className="text-gray-500 w-32 inline-block">Employee Number:</span> <span className="font-semibold">{employeeDetails.employeeNumber}</span></div>
                  <div className="text-sm"><span className="text-gray-500 w-32 inline-block">Company:</span> <span className="font-semibold">{employeeDetails.company}</span></div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Leave Type *</label>
                  <select
                    name="leaveType" required value={formData.leaveType} onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select Type</option>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
                    <DatePicker
                      selected={formData.startDate ? new Date(formData.startDate) : null}
                      onChange={(date) => {
                        if (!date) return;
                        const d = new Date(date);
                        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                        setFormData(prev => ({ ...prev, startDate: dateStr }));
                      }}
                      renderDayContents={renderDayContents}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="dd-mm-yyyy"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                      wrapperClassName="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date *</label>
                    <DatePicker
                      selected={formData.endDate ? new Date(formData.endDate) : null}
                      onChange={(date) => {
                        if (!date) return;
                        const d = new Date(date);
                        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                        setFormData(prev => ({ ...prev, endDate: dateStr }));
                      }}
                      minDate={formData.startDate ? new Date(formData.startDate) : null}
                      renderDayContents={renderDayContents}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="dd-mm-yyyy"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 flex justify-between items-center">
                  <span className="text-sm font-medium">Total Days:</span>
                  <span className="text-lg font-bold">{formData.totalDays}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason *</label>
                  <select
                    name="reason" required value={formData.reason} onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Reason</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <textarea
                    name="customReason" value={formData.customReason} onChange={handleInputChange}
                    placeholder="Additional details (optional)..." rows="3"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment (Optional)</label>
                  <input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              {(() => {
                const isAL = formData.leaveType === 'Annual Leave' || formData.leaveType === 'Leave';
                const lopDays = isAL ? Math.max(0, formData.totalDays - balances.annualBalance) : 0;
                const alUsed = isAL ? Math.min(formData.totalDays, balances.annualBalance) : 0;
                
                return (
                  <>
                    {formData.totalDays > 0 && isAL && (
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-2 mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Leave Summary</h4>
                        <div className="flex justify-between"><span className="text-gray-500">Requested Days:</span> <span className="font-semibold">{formData.totalDays}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Available Annual Leave:</span> <span className="font-semibold">{balances.annualBalance}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Annual Leave Used:</span> <span className="font-semibold text-emerald-600">{alUsed}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">LOP Days:</span> <span className="font-semibold text-red-600">{lopDays}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Salary Impact:</span> <span className="font-semibold">{lopDays > 0 ? 'Applicable' : 'Not Applicable'}</span></div>
                      </div>
                    )}

                    {lopDays > 0 && (
                      <div className="mb-4">
                        <label className="flex items-start gap-3 text-sm text-red-700 bg-red-50 p-3 rounded-xl border border-red-100 cursor-pointer">
                          <input type="checkbox" className="mt-1 w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500" checked={lopConsent} onChange={(e) => setLopConsent(e.target.checked)} />
                          <span>I understand that this leave exceeds my available Annual Leave balance. The excess leave days will be treated as Loss Of Pay (LOP), and salary deductions will be applied according to company payroll policies.</span>
                        </label>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => setShowApplyModal(false)}
                        className="flex-1 py-3"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={lopDays > 0 && !lopConsent}
                        isLoading={submitLoading}
                        className="flex-1 py-3"
                      >
                        Submit
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* View Leave Modal */}
      {showViewModal && selectedViewLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowViewModal(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-in-right overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h2 className="text-xl font-bold text-gray-800">Leave Request Details</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {selectedViewLeave.employeeName ? selectedViewLeave.employeeName.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedViewLeave.employeeName}</h3>
                  <p className="text-sm text-gray-500 font-mono">{selectedViewLeave.userId}</p>
                </div>
              </div>

              {/* Mini Dashboard */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Employee Leave Dashboard</h4>
                {loadingBalances ? (
                  <div className="flex justify-center p-4">
                    <Activity className="animate-spin w-5 h-5 text-blue-500" />
                  </div>
                ) : selectedEmployeeBalances ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">This Year</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <p className="text-[10px] font-semibold text-blue-600 uppercase">Available</p>
                          <p className="text-xl font-bold text-blue-900">{selectedEmployeeBalances.annualBalance}</p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-semibold text-emerald-600 uppercase">Used AL</p>
                          <p className="text-xl font-bold text-emerald-900">{selectedEmployeeBalances.annualUsed}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                          <p className="text-[10px] font-semibold text-purple-600 uppercase">WFH Used</p>
                          <p className="text-xl font-bold text-purple-900">{selectedEmployeeBalances.wfhUsed}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                          <p className="text-[10px] font-semibold text-red-600 uppercase">LOP Days</p>
                          <p className="text-xl font-bold text-red-900">{selectedEmployeeBalances.lopUsed}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">This Month</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-semibold text-emerald-600 uppercase">Leave Taken</p>
                          <p className="text-lg font-bold text-emerald-900">{selectedEmployeeBalances.monthlyAL}</p>
                        </div>
                        <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                          <p className="text-[10px] font-semibold text-purple-600 uppercase">WFH Taken</p>
                          <p className="text-lg font-bold text-purple-900">{selectedEmployeeBalances.monthlyWFH}</p>
                        </div>
                        <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100">
                          <p className="text-[10px] font-semibold text-red-600 uppercase">LOP Taken</p>
                          <p className="text-lg font-bold text-red-900">{selectedEmployeeBalances.monthlyLOP}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Failed to load balances</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Leave Type</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedViewLeave.leaveType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Days</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedViewLeave.totalDays} Days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Dates</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {new Date(selectedViewLeave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} 
                    <span className="text-gray-400 mx-1">to</span> 
                    {new Date(selectedViewLeave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Loss Of Pay (LOP)</p>
                  <p className="text-sm font-semibold text-red-600 mt-1">{selectedViewLeave.isLOP ? `${selectedViewLeave.lopDays || 0} Days` : 'None'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Reason</p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-800 font-medium">{selectedViewLeave.reason}</p>
                  {selectedViewLeave.customReason && (
                    <p className="text-sm text-gray-600 mt-2 italic">{selectedViewLeave.customReason}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Supervisor Status</p>
                  <StatusBadge status={selectedViewLeave.supervisorStatus} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">HR Status</p>
                  <StatusBadge status={selectedViewLeave.hrStatus} />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              {(() => {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const role = storedUser?.role;
                const isPendingForMe = role === 'HR' 
                  ? (selectedViewLeave.hrStatus === 'Pending' || !selectedViewLeave.hrStatus)
                  : (selectedViewLeave.supervisorStatus === 'Pending' || !selectedViewLeave.supervisorStatus);
                  
                if (isPendingForMe) {
                  return (
                    <>
                      <Button variant="ghost" onClick={() => setShowViewModal(false)} className="mr-auto">Close</Button>
                      <button onClick={() => { handleUpdateLeaveStatus(selectedViewLeave.id, 'Rejected'); setShowViewModal(false); }} className="px-5 py-2.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl text-sm font-bold transition-colors">Reject</button>
                      <button onClick={() => { handleUpdateLeaveStatus(selectedViewLeave.id, 'Approved'); setShowViewModal(false); }} className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-bold shadow-sm transition-colors">Approve</button>
                    </>
                  );
                }
                return <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>;
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      </DashboardContainer>
    </DashboardLayout>
  );
}
