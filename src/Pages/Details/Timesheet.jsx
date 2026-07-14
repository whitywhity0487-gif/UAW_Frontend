import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, Save, CheckCircle, Edit2, Calendar } from "lucide-react";
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { API_BASE_URL } from '../../config/constants';
import toast from 'react-hot-toast';

const Timesheet = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timesheetData, setTimesheetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.role === "Admin" ? "all" : "personal";
  }); // 'personal', 'team', 'all'
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Exception Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [exceptionHours, setExceptionHours] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionType, setExceptionType] = useState("Manual");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);
    if (storedUser.role !== "Admin") {
      setSelectedUser(storedUser.username || storedUser.employeeId || storedUser.userId);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (viewMode === "personal") {
        if (selectedUser) fetchTimesheet(selectedUser);
      } else {
        fetchTeamList();
      }
    }
  }, [user, currentMonth, viewMode]);

  useEffect(() => {
    if (viewMode !== "personal" && selectedUser) {
      fetchTimesheet(selectedUser);
    }
  }, [selectedUser, currentMonth]);

  const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  const fetchTimesheet = async (uid) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/timesheet/user/${uid}?month=${monthStr}`);
      if (res.data.success) {
        setTimesheetData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch timesheet", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamList = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === "all" ? "all" : `team/${user.username || user.userId}`;
      const res = await axios.get(`${API_BASE_URL}/api/timesheet/${endpoint}?month=${monthStr}`);
      if (res.data.success) {
        setTeamMembers(res.data.data);
        if (res.data.data.length > 0 && !res.data.data.find(m => m.userId === selectedUser)) {
          setSelectedUser(res.data.data[0].userId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch team list", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleEditException = (day) => {
    setEditingDay(day);
    setExceptionHours(day.hours);
    setExceptionReason(day.notes || "");
    setIsModalOpen(true);
  };

  const saveException = async () => {
    if (!exceptionReason.trim()) {
      toast.error("Reason is required when overriding hours.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/timesheet/exception`, {
        userId: selectedUser,
        date: editingDay.date,
        hours: exceptionHours,
        reason: exceptionReason,
        type: exceptionType
      });
      setIsModalOpen(false);
      toast.success("Exception saved successfully");
      fetchTimesheet(selectedUser);
    } catch (err) {
      toast.error("Failed to save exception");
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.post(`${API_BASE_URL}/api/timesheet/status`, {
        userId: selectedUser,
        monthStr: monthStr,
        status: newStatus,
        approvedBy: user.username || user.userId,
        totals: timesheetData.summary
      });
      toast.success(`Status updated to ${newStatus}`);
      fetchTimesheet(selectedUser);
    } catch (err) {
      toast.error(`Failed to update status to ${newStatus}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Holiday": return "bg-pink-100 text-pink-700";
      case "Leave": return "bg-yellow-100 text-yellow-700";
      case "LOP": return "bg-red-100 text-red-700";
      case "Weekend": return "bg-gray-200 text-gray-700";
      case "Exception": return "bg-purple-100 text-purple-700";
      case "WFH": return "bg-teal-100 text-teal-700";
      default: return "bg-blue-50 text-blue-700";
    }
  };

  if (!user) return <div className="p-8">Loading...</div>;

  const isAdmin = user.role === "Admin";
  const isSupervisor = isAdmin || user.role === "Manager"; // Replace with your actual supervisor logic
  const canEdit = isSupervisor && timesheetData?.status !== "Locked";
  const canApprove = isSupervisor && timesheetData?.status !== "Approved" && timesheetData?.status !== "Locked";

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Timesheet Management"
        subtitle="Review and manage working hours"
        actions={
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-inner">
            <button onClick={handlePrevMonth} className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
            <span className="font-semibold text-white min-w-[140px] text-center">
              {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            <button onClick={handleNextMonth} className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"><ChevronRight size={20} /></button>
          </div>
        }
      />
      <DashboardContainer>
        <div className="max-w-7xl mx-auto font-['DM_Sans',sans-serif]">

          {/* VIEW TABS */}
          {isSupervisor && (
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              {!isAdmin && (
                <>
                  <button
                    className={`pb-3 px-2 font-medium ${viewMode === 'personal' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => { setViewMode('personal'); setSelectedUser(user.username || user.userId); }}
                  >
                    My Timesheet
                  </button>
                  <button
                    className={`pb-3 px-2 font-medium ${viewMode === 'team' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setViewMode('team')}
                  >
                    My Team
                  </button>
                </>
              )}
              {isAdmin && (
                <button
                  className={`pb-3 px-2 font-medium ${viewMode === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setViewMode('all')}
                >
                  All Employees
                </button>
              )}
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* SIDEBAR FOR TEAM/ALL VIEW */}
            {viewMode !== 'personal' && (
              <div className="lg:w-1/4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-[600px] flex flex-col">
                <h3 className="font-bold text-gray-700 mb-2 px-2">Employees</h3>
                <div className="px-2 mb-4">
                  <input
                    type="text"
                    placeholder="Search name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto flex-1 px-1">
                  {teamMembers.filter(m =>
                    (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.employeeNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.userId || "").toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(member => (
                    <button
                      key={member.userId}
                      onClick={() => setSelectedUser(member.userId)}
                      className={`text-left px-4 py-3 rounded-xl transition-colors ${selectedUser === member.userId ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{member.name}</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full ${member.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{member.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TIMESHEET TABLE */}
            <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading timesheet data...</div>
              ) : !timesheetData ? (
                <div className="p-12 text-center text-gray-500">No timesheet data found for this selection.</div>
              ) : (
                <>
                  {/* SUMMARY HEADER */}
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{timesheetData.employeeName}</h2>
                      <p className="text-sm text-gray-500">Status: <strong className={timesheetData.status === 'Approved' ? 'text-green-600' : 'text-blue-600'}>{timesheetData.status}</strong></p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm text-center">
                        <p className="text-gray-500 text-xs">Total Hours</p>
                        <p className="font-bold text-lg text-blue-600">{timesheetData.summary.totalWorkingHours}</p>
                      </div>

                      {timesheetData.summary.weeklyHours && timesheetData.summary.weeklyHours.length > 0 && (
                        <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                          <p className="text-gray-500 text-xs text-center border-b border-gray-100 pb-1 mb-1">Weekly Hours</p>
                          <div className="flex gap-3 justify-center text-sm">
                            {timesheetData.summary.weeklyHours.map(w => (
                              <span key={w.week} className="text-gray-600">
                                W{w.week}: <strong className="text-gray-900">{w.hours}h</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm text-center">
                        <p className="text-gray-500 text-xs">Overtime</p>
                        <p className="font-bold text-lg text-purple-600">{timesheetData.summary.totalOvertimeHours}h</p>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm text-center">
                        <p className="text-gray-500 text-xs">LOP / Leaves</p>
                        <p className="font-bold text-lg text-red-600">{timesheetData.summary.totalLopDays} / {timesheetData.summary.totalLeaveDays}</p>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex items-center gap-2 ml-2">
                        {canApprove && (
                          <button onClick={() => handleStatusUpdate("Approved")} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors">
                            <CheckCircle size={16} /> Approve
                          </button>
                        )}
                        {isAdmin && timesheetData.status === "Approved" && (
                          <button onClick={() => handleStatusUpdate("Locked")} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-sm transition-colors">
                            <Save size={16} /> Lock Month
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                          <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Hours</th>
                          <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                          {canEdit && <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {timesheetData.days.map((day, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-6 text-sm">
                              <span className="font-medium text-gray-800">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </td>
                            <td className="py-3 px-6 text-sm">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(day.status)}`}>
                                {day.status}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-sm font-medium text-gray-700">
                              {day.hours > 0 ? `${day.hours} hrs` : '-'}
                            </td>
                            <td className="py-3 px-6 text-sm text-gray-500 max-w-[200px] truncate">
                              {day.notes || '-'}
                            </td>
                            {canEdit && (
                              <td className="py-3 px-6 text-right">
                                <button
                                  onClick={() => handleEditException(day)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* EXCEPTION MODAL */}
          {isModalOpen && editingDay && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Edit Timesheet Entry</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="font-semibold text-gray-800">{new Date(editingDay.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                    <input
                      type="number"
                      min="0" max="24" step="0.5"
                      value={exceptionHours}
                      onChange={(e) => setExceptionHours(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exception Type</label>
                    <select
                      value={exceptionType}
                      onChange={(e) => setExceptionType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="Manual">Manual Override</option>
                      <option value="Overtime">Overtime</option>
                      <option value="Short Hours">Short Hours</option>
                      <option value="Weekend Work">Weekend Work</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes *</label>
                    <textarea
                      rows="3"
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      placeholder="Required: Explain why the hours were modified..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      required
                    />
                  </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                  <button onClick={saveException} className="px-5 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardContainer>
    </DashboardLayout>
  );
};

export default Timesheet;
