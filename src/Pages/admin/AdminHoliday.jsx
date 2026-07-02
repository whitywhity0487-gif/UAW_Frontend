import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AdminHoliday = () => {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentHoliday, setCurrentHoliday] = useState(null);
  const [formData, setFormData] = useState({ name: "", date: "", day: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userClient, setUserClient] = useState("");

  const today = () => new Date().toISOString().split("T")[0];

  const getDayOfWeek = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00").toLocaleString("en-US", { weekday: "long" });
  };

  // Get current user from localStorage - FIXED: Only called once
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUserRole(storedUser.role || "");
      setUserClient(storedUser.clientName || storedUser.assignedClient || "");
    }
  }, []); // Empty dependency array - runs only once

  const fetchHolidays = async () => {
    try {
      setLoading(true);

      // Get current user from localStorage directly (not from state)
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const role = storedUser?.role;
      const client = storedUser?.clientName || storedUser?.assignedClient;

      // For Admin: fetch all holidays
      // For others: fetch only their client's holidays
      let url = "http://localhost:5000/api/holiday/all";

      if (role !== "Admin" && client) {
        url = `http://localhost:5000/api/holiday/group/${encodeURIComponent(client)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const arr = data.data || data.holidays || data;

      if (Array.isArray(arr)) {
        setHolidays(arr);
        if (arr.length > 0 && !selectedGroup) {
          // For non-admin, auto-select their client group
          if (role !== "Admin" && client) {
            setSelectedGroup(client);
          } else {
            setSelectedGroup(arr[0].group.name);
          }
        }
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
      alert("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []); // Empty dependency array - runs only once

  // Get unique groups based on user role
  const getUniqueGroups = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const role = storedUser?.role;
    const client = storedUser?.clientName || storedUser?.assignedClient;

    // For non-admin users, only show their assigned client
    if (role !== "Admin" && client) {
      return [client];
    }

    // For admin, show all groups
    return [...new Set(holidays.map((h) => h.group.name))];
  };

  const filteredByGroup = Array.isArray(holidays)
    ? holidays.filter((h) => h.group.name === selectedGroup)
    : [];

  const filteredHolidays = selectedMonth !== null
    ? filteredByGroup.filter((h) => new Date(h.holiday.date).getMonth() === selectedMonth)
    : filteredByGroup;

  const monthsWithCounts = MONTHS.map((m, i) => ({
    name: m,
    index: i,
    count: filteredByGroup.filter((h) => new Date(h.holiday.date).getMonth() === i).length
  })).filter((m) => m.count > 0);

  const uniqueGroups = getUniqueGroups();

  const handleAddHoliday = () => {
    // Only Admin can add holidays
    if (userRole !== "Admin") {
      alert("Only Admin can add holidays");
      return;
    }

    setModalMode("add");
    setCurrentHoliday(null);
    const todayDate = today();
    setFormData({ name: "", date: todayDate, day: getDayOfWeek(todayDate), notes: "" });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    // Only Admin can edit holidays
    if (userRole !== "Admin") {
      alert("Only Admin can edit holidays");
      return;
    }

    setModalMode("edit");
    setCurrentHoliday(item);
    setFormData({
      name: item.holiday.name,
      date: item.holiday.date,
      day: item.holiday.day,
      notes: item.holiday.notes || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    // Only Admin can delete holidays
    if (userRole !== "Admin") {
      alert("Only Admin can delete holidays");
      return;
    }

    if (!window.confirm(`Delete "${item.holiday.name}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/holiday/${item.holiday.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: item.group.name })
      });
      const data = await res.json();
      if (data.success) await fetchHolidays();
      else alert("Failed to delete: " + (data.message || "Unknown error"));
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "date") updated.day = getDayOfWeek(value);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only Admin can add/edit holidays
    if (userRole !== "Admin") {
      alert("Only Admin can add/edit holidays");
      return;
    }

    const holidayData = {
      ...formData,
      day: formData.day || getDayOfWeek(formData.date),
      groupName: selectedGroup,
      type: "holiday" // Add this line - specify the type
    };

    try {
      setLoading(true);
      const url = modalMode === "add"
        ? "http://localhost:5000/api/holiday/add"
        : `http://localhost:5000/api/holiday/${currentHoliday.holiday.id}`;
      const res = await fetch(url, {
        method: modalMode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holidayData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        await fetchHolidays();
      }
      else alert("Failed: " + data.message);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDateParts = (dateStr) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      month: d.toLocaleString("en-US", { month: "short" }).toUpperCase()
    };
  };

  if (loading && holidays.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-base">Loading holidays...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        title="Holiday Calendar"
        subtitle="Manage company holidays and schedules"
        actions={
          userRole === "Admin" && (
            <button
              onClick={handleAddHoliday}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <span>+</span> Add Holiday
            </button>
          )
        }
      />
      <DashboardContainer>

      {/* User Info Banner for Non-Admin */}
      {userRole !== "Admin" && userClient && (
        <div className="max-w-6xl mx-auto mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p>📅 Showing holidays for <strong>{userClient}</strong> based on your assigned client.</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Month Navigator */}
        <div className="lg:w-56 w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Months</p>
            {selectedMonth !== null && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
          {monthsWithCounts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No holidays in any month</p>
          )}
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {monthsWithCounts.map((m) => (
              <button
                key={m.index}
                onClick={() => setSelectedMonth(selectedMonth === m.index ? null : m.index)}
                className={`w-full flex justify-between items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${selectedMonth === m.index
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <span className="text-base">{m.name}</span>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 min-w-[32px] text-center
                  ${selectedMonth === m.index
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                  {m.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Company Selector - Only show for Admin */}
          {userRole === "Admin" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">🏢 Company</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                      className="flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 min-w-[200px] transition"
                    >
                      <span className="text-base font-medium text-gray-800">{selectedGroup || "Select company"}</span>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showCompanyDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCompanyDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {uniqueGroups.map((group) => (
                          <button
                            key={group}
                            onClick={() => {
                              setSelectedGroup(group);
                              setShowCompanyDropdown(false);
                              setSelectedMonth(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition ${selectedGroup === group ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            {group}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 rounded-full px-3 py-1.5">
                    <span className="text-sm font-semibold text-blue-700">{filteredHolidays.length}</span>
                    <span className="text-sm text-blue-600 ml-1">{filteredHolidays.length === 1 ? "holiday" : "holidays"}</span>
                  </div>
                  {selectedMonth !== null && (
                    <div className="bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-600">
                      {MONTHS[selectedMonth]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* For non-admin, show client name as header */}
          {userRole !== "Admin" && userClient && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">🏢 Company</span>
                  <div className="bg-blue-50 rounded-xl px-4 py-2.5">
                    <span className="text-base font-medium text-blue-700">{userClient}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 rounded-full px-3 py-1.5">
                    <span className="text-sm font-semibold text-blue-700">{filteredHolidays.length}</span>
                    <span className="text-sm text-blue-600 ml-1">{filteredHolidays.length === 1 ? "holiday" : "holidays"}</span>
                  </div>
                  {selectedMonth !== null && (
                    <div className="bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-600">
                      {MONTHS[selectedMonth]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Holiday Cards */}
          {filteredHolidays.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 text-base">No holidays found for this period</p>
              <p className="text-sm text-gray-400 mt-1">Try changing company or month filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHolidays.map((item) => {
                const { day, month } = getDateParts(item.holiday.date);
                return (
                  <div
                    key={item.holiday.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    {/* Date Badge */}
                    <div className="flex sm:flex-col items-center sm:items-center gap-2 sm:gap-1 min-w-[80px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl py-3 px-4">
                      <span className="text-3xl font-bold text-blue-700 leading-none">{day}</span>
                      <span className="text-xs font-semibold text-blue-500 tracking-wide">{month}</span>
                    </div>

                    {/* Holiday Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.holiday.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{item.holiday.day}</span>
                        {item.holiday.notes && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          </>
                        )}
                      </div>
                      {/* Show group name for Admin */}
                      {userRole === "Admin" && (
                        <div className="mt-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {item.group.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Only for Admin */}
                    {userRole === "Admin" && (
                      <div className="flex gap-2 sm:ml-auto">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Only shown for Admin */}
      {showModal && userRole === "Admin" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {modalMode === "add" ? "➕ Add New Holiday" : "✏️ Edit Holiday"}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {modalMode === "add" ? "Fill in the details below" : "Update holiday information"}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Holiday Name *</label>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleInputChange} required placeholder="e.g. Diwali, Christmas"
                    className="w-full text-base px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                  <input
                    type="date" name="date" value={formData.date}
                    onChange={handleInputChange} required
                    className="w-full text-base px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Day of Week</label>
                  <input
                    type="text" value={formData.day} readOnly
                    className="w-full text-base px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Auto-calculated from selected date</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                  <textarea
                    name="notes" value={formData.notes} onChange={handleInputChange}
                    rows={3} placeholder="Additional information about this holiday"
                    className="w-full text-base px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button" onClick={() => setShowModal(false)} disabled={loading}
                    className="px-5 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={loading}
                    className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                  >
                    {loading ? "Processing..." : (modalMode === "add" ? "Add Holiday" : "Save Changes")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </DashboardContainer>
    </DashboardLayout>
  );
};

export default AdminHoliday;