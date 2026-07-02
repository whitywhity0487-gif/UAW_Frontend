import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download, Plus, Edit, Trash2, Calendar, Users, Briefcase, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, getYear } from 'date-fns';
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCard from '../../components/dashboard/StatCard';

const AdminMyclient = () => {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState([]);
  const [metrics, setMetrics] = useState({ totalEmployees: 0, billable: 0, support: 0, bench: 0, utilization: 0 });
  const [employees, setEmployees] = useState([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    employeeNumber: '',
    employeeName: '',
    projectName: '',
    type: 'Billable',
    startDate: '',
    endDate: ''
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const statusColors = {
    'Billable': 'bg-green-500',
    'Support': 'bg-yellow-400',
    'On Bench': 'bg-red-500'
  };

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllocations();
    fetchMetrics();
    fetchEmployees();
  }, [searchTerm]); // Re-fetch on search change, metrics can also reload but mostly for list

  const fetchAllocations = async () => {
    try {
      const url = searchTerm ? `http://localhost:5000/api/allocations?search=${encodeURIComponent(searchTerm)}` : 'http://localhost:5000/api/allocations';
      const res = await axios.get(url);
      if (res.data.success) {
        setAllocations(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching allocations:", err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/allocations/metrics');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/personal-details');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const handleEmployeeChange = (e) => {
    const empNo = e.target.value;
    const emp = employees.find(emp => emp.employeeNumber === empNo);
    setFormData({
      ...formData,
      employeeNumber: empNo,
      employeeName: emp ? emp.fullName : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/allocations/${editingId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/allocations', formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ employeeNumber: '', employeeName: '', projectName: '', type: 'Billable', startDate: '', endDate: '' });
      fetchAllocations();
      fetchMetrics();
    } catch (err) {
      alert("Error saving allocation: " + err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this allocation?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/allocations/${id}`);
      fetchAllocations();
      fetchMetrics();
    } catch (err) {
      alert("Error deleting allocation");
    }
  };

  const openEditModal = (alloc) => {
    setFormData({
      employeeNumber: alloc.employeeNumber,
      employeeName: alloc.employeeName,
      projectName: alloc.projectName || '',
      type: alloc.type,
      startDate: alloc.startDate,
      endDate: alloc.endDate
    });
    setEditingId(alloc.id);
    setIsModalOpen(true);
  };

  const exportToExcel = () => {
    const dataToExport = allocations.map(a => ({
      'Employee Number': a.employeeNumber,
      'Employee Name': a.employeeName,
      'Project Name': a.projectName,
      'Type': a.type,
      'Start Date': a.startDate,
      'End Date': a.endDate
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Allocations");
    XLSX.writeFile(wb, "Resource_Allocations.xlsx");
  };

  return (
    <DashboardLayout>
      <DashboardHeader 
        title="My Client"
        subtitle="Manage and track employee utilization"
        actions={
          <>
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm cursor-pointer">
              <Download size={18} /> Export
            </button>
            <button onClick={() => { setEditingId(null); setFormData({ employeeNumber: '', employeeName: '', projectName: '', type: 'Billable', startDate: '', endDate: '' }); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md cursor-pointer">
              <Plus size={18} /> New Allocation
            </button>
          </>
        }
      />

      <DashboardContainer>
        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: Users,
              title: "Total Employees",
              value: (metrics.billable || 0) + (metrics.support || 0) + (metrics.bench || 0),
              colorClass: "text-blue-600 bg-blue-50"
            },
            {
              icon: Briefcase,
              title: "Billable",
              value: metrics.billable,
              colorClass: "text-emerald-600 bg-emerald-50"
            },
            {
              icon: Clock,
              title: "Support",
              value: metrics.support,
              colorClass: "text-yellow-600 bg-yellow-50"
            },
            {
              icon: Calendar,
              title: "On Bench",
              value: metrics.bench,
              colorClass: "text-rose-600 bg-rose-50"
            }
          ].map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

      {/* Detailed List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">All Allocations</h2>
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Employee</th>
                <th className="p-4 font-semibold text-gray-600">Project</th>
                <th className="p-4 font-semibold text-gray-600">Type</th>
                <th className="p-4 font-semibold text-gray-600">Duration</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map(alloc => (
                <tr key={alloc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">
                    {alloc.employeeName}
                    <div className="text-xs text-gray-500">{alloc.employeeNumber}</div>
                  </td>
                  <td className="p-4">{alloc.projectName || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusColors[alloc.type]}`}>
                      {alloc.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{alloc.startDate} to {alloc.endDate}</td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => openEditModal(alloc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(alloc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Allocation' : 'New Allocation'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <select required value={formData.employeeNumber} onChange={handleEmployeeChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.employeeNumber} value={emp.employeeNumber}>{emp.fullName} ({emp.employeeNumber})</option>
                    ))}
                  </select>
                </div>
              )}
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <input type="text" readOnly value={`${formData.employeeName} (${formData.employeeNumber})`} className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="Billable">Billable</option>
                  <option value="Support">Support</option>
                  <option value="On Bench">On Bench</option>
                </select>
              </div>

              {formData.type !== 'On Bench' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input type="text" required value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter project name" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Save Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </DashboardContainer>
    </DashboardLayout>
  );
};

export default AdminMyclient;
