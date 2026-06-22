import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const HolidayTooltip = ({ info, onClose, userRole, handleEdit, handleDelete, monthName }) => {
  const tooltipRef = useRef(null);
  const [style, setStyle] = useState({ opacity: 0 });

  useEffect(() => {
    if (!tooltipRef.current || !info?.rect) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const targetRect = info.rect;

    const spaceBottom = window.innerHeight - targetRect.bottom;
    const spaceTop = targetRect.top;

    let top = 0;
    let left = 0;

    // Vertical Positioning
    if (spaceBottom >= tooltipRect.height + 10) {
      top = targetRect.bottom + 10;
    } else if (spaceTop >= tooltipRect.height + 10) {
      top = targetRect.top - tooltipRect.height - 10;
    } else {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    // Horizontal Positioning
    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    setStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
      opacity: 1,
    });

  }, [info]);

  if (!info) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      style={style}
      className="w-48 sm:w-56 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 transition-opacity duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight pr-2">{info.item.holiday.name}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-lg leading-none shrink-0">&times;</button>
      </div>
      <p className="text-xs text-gray-500">{info.item.holiday.day}, {info.day} {monthName}</p>
      {info.item.holiday.notes && <p className="text-xs text-gray-500 mt-1.5 italic">{info.item.holiday.notes}</p>}
      {userRole === "Admin" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => { onClose(); handleEdit(info.item); }}
            className="flex-1 text-xs py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition font-medium"
          >✏️ Edit</button>
          <button
            onClick={() => { onClose(); handleDelete(info.item); }}
            className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition font-medium"
          >🗑️ Del</button>
        </div>
      )}
    </div>,
    document.body
  );
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Holiday = () => {
  const navigate = useNavigate();
  const { profileStatus, hasModuleAccess, isHydrated } = useUser();
  const [holidays, setHolidays] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentHoliday, setCurrentHoliday] = useState(null);
  const [formData, setFormData] = useState({ name: "", date: "", day: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userClient, setUserClient] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const today = () => new Date().toISOString().split("T")[0];

  const getDayOfWeek = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00").toLocaleString("en-US", { weekday: "long" });
  };

  // Check profile access on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const role = storedUser?.role;
    setUserRole(role || "");
    setUserClient(storedUser?.clientName || storedUser?.assignedClient || "");

    // Admin always has access
    if (role === 'Admin') {
      setCheckingAccess(false);
      return;
    }

    // Wait until user context is fully loaded
    if (!isHydrated) return;



    // APPROVED -> Full access
    if (profileStatus === 'APPROVED') {
      setCheckingAccess(false);
      return;
    }

    // PENDING -> Profile submitted, waiting for approval - SHOW MESSAGE, NO REDIRECT
    if (profileStatus === 'PENDING') {
      setCheckingAccess(false); // Allow showing pending message instead of redirecting
      return;
    }

    // REJECTED or NOT_SUBMITTED -> Redirect to profile page
    if (profileStatus === 'REJECTED' || (!profileStatus && !hasModuleAccess)) {
      alert("Please complete and submit your profile to access Holiday Calendar");
      navigate("/mypersonaldetails");
      return;
    }

    // If hasModuleAccess is true (from context), allow access
    if (hasModuleAccess === true) {
      setCheckingAccess(false);
      return;
    }

    // Default case - redirect
    alert("Please complete your profile to access Holiday Calendar");
    navigate("/mypersonaldetails");
  }, [hasModuleAccess, profileStatus, isHydrated, navigate]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const role = storedUser?.role;
      const userId = storedUser?.username;

      let client = null;

      // For employee, fetch assignedClient from database
      if (role === 'Employee' && userId) {
        try {
          const profileRes = await fetch(`https://uaw-backend.vercel.app/api/personal-details?userId=${userId}`);
          const profileData = await profileRes.json();
          if (profileData.success && profileData.data) {
            client = profileData.data.assignedClient ||
              profileData.data.assignedCompany ||
              profileData.data.clientName;
            setUserClient(client);
          }
        } catch (e) {
          console.error("Failed to fetch employee company:", e);
        }
      } else if (role !== "Admin") {
        client = storedUser?.clientName || storedUser?.assignedClient;
      }

      let url = "https://uaw-backend.vercel.app/api/holiday/all";
      if (role !== "Admin" && client) {
        url = `https://uaw-backend.vercel.app/api/holiday/group/${encodeURIComponent(client)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      let arr = data.data || data.holidays || data;

      // Normalize array structure if it came from /group/ API which returns flat objects
      if (url.includes('/group/') && Array.isArray(arr)) {
        arr = arr.map(h => {
          if (h.holiday && h.group) return h;
          return {
            group: { name: client },
            holiday: h
          };
        });
      }

      if (Array.isArray(arr)) {
        setHolidays(arr);
        if (role !== "Admin" && client) {
          setSelectedGroup(client);
        } else if (arr.length > 0 && !selectedGroup) {
          setSelectedGroup(arr[0].group.name);
        }
      } else {
        setHolidays([]);
      }

      // Fetch leaves for employees
      if (userId && role !== "Admin") {
         try {
           const leaveRes = await fetch(`https://uaw-backend.vercel.app/api/leave/user/${userId}`);
           const leaveData = await leaveRes.json();
           if (leaveData.success) {
             setApprovedLeaves(leaveData.history.filter(l => l.status === 'Approved'));
           }
         } catch (e) {
           console.error("Failed to fetch leaves", e);
         }
      }

    } catch (error) {
      console.error("Failed to fetch holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkingAccess) {
      fetchHolidays();
    }
  }, [checkingAccess]);

  useEffect(() => {
    const handleScrollOrResize = () => setTooltipInfo(null);
    const handleGlobalClick = () => setTooltipInfo(null);

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const getUniqueGroups = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const role = storedUser?.role;
    const client = storedUser?.clientName || storedUser?.assignedClient;
    if (role !== "Admin" && client) return [client];
    return [...new Set(holidays.map((h) => h.group.name))];
  };

  const filteredByGroup = Array.isArray(holidays)
    ? holidays.filter((h) => h.group.name === selectedGroup)
    : [];

  // Build a map: "YYYY-MM-DD" => holiday info
  const holidayMap = {};
  filteredByGroup.forEach((item) => {
    const d = new Date(item.holiday.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    holidayMap[key] = item;
  });

  const uniqueGroups = getUniqueGroups();

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleAddHoliday = () => {
    if (userRole !== "Admin") { alert("Only Admin can add holidays"); return; }
    setModalMode("add");
    setCurrentHoliday(null);
    const todayDate = today();
    setFormData({ name: "", date: todayDate, day: getDayOfWeek(todayDate), notes: "" });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    if (userRole !== "Admin") { alert("Only Admin can edit holidays"); return; }
    setModalMode("edit");
    setCurrentHoliday(item);
    setFormData({ name: item.holiday.name, date: item.holiday.date, day: item.holiday.day, notes: item.holiday.notes || "" });
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (userRole !== "Admin") { alert("Only Admin can delete holidays"); return; }
    if (!window.confirm(`Delete "${item.holiday.name}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`https://uaw-backend.vercel.app/api/holiday/${item.holiday.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: item.group.name })
      });
      const data = await res.json();
      if (data.success) await fetchHolidays();
      else alert("Failed to delete: " + (data.message || "Unknown error"));
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoading(false); }
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
        ? "https://uaw-backend.vercel.app/api/holiday/add"
        : `https://uaw-backend.vercel.app/api/holiday/${currentHoliday.holiday.id}`;
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
    }
    finally {
      setLoading(false);
    }
  };

  const totalHolidays = filteredByGroup.filter((h) => {
    const d = new Date(h.holiday.date);
    return d.getFullYear() === selectedYear;
  }).length;

  // Show loading while checking access
  if (checkingAccess || !isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  if (loading && holidays.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-base">Loading holidays...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-8">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/home")}
          className="inline-flex items-center gap-2 text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition"
        >
          <span>←</span> Back to Home
        </button>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">📅 Holiday Calendar</h1>
        {userRole === "Admin" && (
          <button
            onClick={handleAddHoliday}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            <span>+</span> Add Holiday
          </button>
        )}
      </div>

      {/* Controls Row */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* Company selector */}
        {userRole === "Admin" ? (
          <div className="relative">
            <button
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="flex items-center justify-between gap-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 min-w-[200px] transition"
            >
              <span className="flex items-center gap-2">
                <span>🏢</span>
                <span className="text-sm font-medium text-gray-800">{selectedGroup || "Select company"}</span>
              </span>
              <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showCompanyDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCompanyDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {uniqueGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => { setSelectedGroup(group); setShowCompanyDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition ${selectedGroup === group ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : userClient ? (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <span>🏢</span>
            <span className="text-sm font-medium text-blue-700">{userClient}</span>
          </div>
        ) : null}



        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 ml-auto text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="text-base">😊</span> Holiday</span>
          <span className="flex items-center gap-1">
             <div className="w-5 h-5 flex justify-center items-center rounded-full bg-emerald-50 border border-emerald-200 text-xs">🏖️</div> Leave
          </span>
          <span className="flex items-center gap-1">
             <div className="w-5 h-5 flex justify-center items-center rounded-full bg-purple-50 border border-purple-200 text-xs">💻</div> WFH
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-md bg-blue-600 inline-block ml-2"></span> Today
          </span>
        </div>
      </div>

      {/* 12-Month Calendar Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {MONTHS.map((monthName, monthIndex) => {
          const daysInMonth = getDaysInMonth(selectedYear, monthIndex);
          const firstDay = getFirstDayOfMonth(selectedYear, monthIndex);
          const todayDate = new Date();
          const isCurrentMonth = todayDate.getFullYear() === selectedYear && todayDate.getMonth() === monthIndex;
          const todayNum = isCurrentMonth ? todayDate.getDate() : null;

          const cells = [];
          for (let i = 0; i < firstDay; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);

          const monthHolidayCount = filteredByGroup.filter((h) => {
            const hd = new Date(h.holiday.date);
            return hd.getFullYear() === selectedYear && hd.getMonth() === monthIndex;
          }).length;

          return (
            <div key={monthIndex} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Month Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${isCurrentMonth ? "bg-blue-600" : "bg-gray-50 border-b border-gray-100"}`}>
                <span className={`text-sm font-semibold ${isCurrentMonth ? "text-white" : "text-gray-700"}`}>{monthName} {selectedYear}</span>
                {monthHolidayCount > 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${isCurrentMonth ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>
                    😊 {monthHolidayCount}
                  </span>
                )}
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 px-2 pt-2">
                {DAYS_SHORT.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d[0]}</div>
                ))}
              </div>

              {/* Date grid */}
              <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
                {cells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;

                  const dateKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const holidayItem = holidayMap[dateKey];
                  const approvedLeave = approvedLeaves.find(l => dateKey >= l.startDate && dateKey <= l.endDate);
                  const isToday = day === todayNum;
                  const isSunday = (firstDay + day - 1) % 7 === 0;
                  const isSaturday = (firstDay + day - 1) % 7 === 6;

                  return (
                    <div
                      key={day}
                      className="relative flex flex-col items-center justify-start py-0.5 group"
                      title={holidayItem ? holidayItem.holiday.name : ""}
                    >
                      {holidayItem ? (
                        <div>
                          <div
                            className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center cursor-pointer hover:bg-amber-100 transition mx-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltipInfo(tooltipInfo?.key === dateKey ? null : { key: dateKey, item: holidayItem, day, month: monthIndex, rect });
                            }}
                          >
                            <span className="text-base leading-none select-none">😊</span>
                          </div>
                          <span className="block text-center text-xs font-semibold text-amber-700 leading-tight mt-0.5">{day}</span>
                        </div>
                      ) : approvedLeave ? (
                        <div>
                          <div className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer mx-auto
                            ${approvedLeave.leaveType === 'Work From Home' ? 'bg-purple-50 border border-purple-200' : 'bg-emerald-50 border border-emerald-200'}`}
                          >
                             <span className="text-sm leading-none select-none">{approvedLeave.leaveType === 'Work From Home' ? '💻' : '🏖️'}</span>
                          </div>
                          <span className={`block text-center text-[10px] font-semibold leading-tight mt-0.5 ${approvedLeave.leaveType === 'Work From Home' ? 'text-purple-700' : 'text-emerald-700'}`}>{day}</span>
                        </div>
                      ) : (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center
                          ${isToday ? "bg-blue-600" : ""}
                        `}>
                          <span className={`text-xs font-medium
                            ${isToday ? "text-white font-bold" : isSunday ? "text-red-400" : isSaturday ? "text-blue-400" : "text-gray-600"}
                          `}>{day}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Holiday List Summary */}
      {filteredByGroup.filter(h => new Date(h.holiday.date).getFullYear() === selectedYear).length > 0 && (
        <div className="max-w-7xl mx-auto mt-8">
          <h2 className="text-base font-semibold text-gray-700 mb-4">😊 All Holidays in {selectedYear}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredByGroup
              .filter(h => new Date(h.holiday.date).getFullYear() === selectedYear)
              .sort((a, b) => new Date(a.holiday.date) - new Date(b.holiday.date))
              .map((item) => {
                const d = new Date(item.holiday.date);
                const dayNum = d.getDate();
                const mon = MONTHS[d.getMonth()].slice(0, 3).toUpperCase();
                return (
                  <div key={item.holiday.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-base font-bold text-amber-700 leading-none">{dayNum}</span>
                      <span className="text-xs font-semibold text-amber-500">{mon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.holiday.name}</p>
                      <p className="text-xs text-gray-500">{item.holiday.day}</p>
                    </div>
                    <span className="text-xl">😊</span>
                    {userRole === "Admin" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(item)} className="px-2 py-1 text-xs rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition">✏️</button>
                        <button onClick={() => handleDelete(item)} className="px-2 py-1 text-xs rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition">🗑️</button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Global Tooltip Portal */}
      {tooltipInfo && (
        <HolidayTooltip
          info={tooltipInfo}
          onClose={() => setTooltipInfo(null)}
          userRole={userRole}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          monthName={MONTHS[tooltipInfo.month]}
        />
      )}

      {/* Modal */}
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
                  >Cancel</button>
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
    </div>
  );
};

export default Holiday;
