import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Briefcase, Clock, FileText, ArrowLeft } from 'lucide-react';
import { endOfMonth, parseISO } from 'date-fns';
import { useUser } from '../../context/UserContext';
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { API_BASE_URL } from '../../config/constants.js';

const Myclient = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employeeDetails, setEmployeeDetails] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const statusColors = {
    'Billable': 'bg-green-500',
    'Support': 'bg-yellow-400',
    'On Bench': 'bg-red-500'
  };

  useEffect(() => {
    fetchUserDataAndAllocations();
  }, [currentUser, selectedYear]);

  const fetchUserDataAndAllocations = async () => {
    try {
      // First get personal details to get the employee number
      const username = currentUser?.username || JSON.parse(localStorage.getItem('user'))?.username;
      if (!username) return;

      const pdRes = await axios.get(`${API_BASE_URL}/api/personal-details?userId=${username}`);

      if (pdRes.data.success && pdRes.data.data) {
        const emp = pdRes.data.data;
        setEmployeeDetails(emp);

        // Then fetch allocations for this employee
        const allocRes = await axios.get(`${API_BASE_URL}/api/allocations?employeeNumber=${emp.employeeNumber}`);
        if (allocRes.data.success) {
          setAllocations(allocRes.data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching allocations:", err);
    }
  };

  const renderTimelineBars = () => {
    return months.map((month, index) => {
      const monthStart = new Date(selectedYear, index, 1);
      const monthEnd = endOfMonth(monthStart);

      const activeAlloc = allocations.find(a => {
        const start = parseISO(a.startDate);
        const end = parseISO(a.endDate);
        return start <= monthEnd && end >= monthStart;
      });

      if (activeAlloc) {
        return (
          <div key={index} className="flex-1 border-r border-gray-100 p-1 relative group">
            <div className={`h-full w-full rounded-md ${statusColors[activeAlloc.type]} shadow-sm transition-transform hover:scale-105 flex items-center justify-center`}>
              {/* Tooltip */}
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-50 bottom-full mb-2 bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap shadow-xl pointer-events-none">
                <p>Project: {activeAlloc.projectName || 'None'}</p>
                <p>Type: {activeAlloc.type}</p>
                <p>{activeAlloc.startDate} to {activeAlloc.endDate}</p>
              </div>
            </div>
          </div>
        );
      }

      return <div key={index} className="flex-1 border-r border-gray-100 bg-gray-50/30"></div>;
    });
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="My Client"
        subtitle="View your project assignments and timeline"
      />
      <DashboardContainer>
        <div className="max-w-5xl mx-auto">

          {/* Current Assignment Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Briefcase className="text-blue-600" /> Current Assignments</h2>
            {allocations.length === 0 ? (
              <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-lg">You currently have no recorded allocations.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allocations.map(alloc => (
                  <div key={alloc.id} className="border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{alloc.projectName || 'Internal Bench'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusColors[alloc.type]}`}>
                        {alloc.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                      <Calendar size={14} /> {alloc.startDate} to {alloc.endDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline View */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">My Timeline</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Billable</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> Support</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Bench</span>
                </div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium">
                  {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header Row */}
                <div className="flex border-b border-gray-200 bg-white">
                  {months.map(m => <div key={m} className="flex-1 p-3 text-center font-semibold text-gray-600 text-sm border-r border-gray-200">{m}</div>)}
                </div>

                {/* Employee Row */}
                <div className="flex h-16 hover:bg-gray-50">
                  {renderTimelineBars()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardContainer>
    </DashboardLayout>
  );
};

export default Myclient;
