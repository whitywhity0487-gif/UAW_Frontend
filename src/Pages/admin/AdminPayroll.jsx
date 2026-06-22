import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Search, Plus, Calendar, Save, AlertCircle, CheckCircle, RefreshCcw, DollarSign, Upload } from 'lucide-react';

const API_BASE_URL = 'https://uaw-backend.vercel.app/api/payroll';
const DETAILS_API_URL = 'https://uaw-backend.vercel.app/api/personal-details';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function AdminPayroll({ user }) {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState(MONTHS[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    employeeName: '',
    month: MONTHS[new Date().getMonth()],
    year: CURRENT_YEAR,
    baseSalary: '',
    allowances: '0',
    otherDeductions: '0'
  });
  const [payslipFile, setPayslipFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Employee Selection State
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [filterMonth, filterYear]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/all?month=${filterMonth}&year=${filterYear}`);
      if (res.data.success) {
        setPayrolls(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching payrolls:", err);
      setError("Failed to load payroll data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(DETAILS_API_URL);
      if (res.data && res.data.success) {
        setEmployees(res.data.data);
      } else if (Array.isArray(res.data)) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setPayslipFile(e.target.files[0]);
  };

  const selectEmployee = (emp) => {
    setFormData(prev => ({
      ...prev,
      employeeNumber: emp.employeeNumber || emp.userId || emp.id,
      employeeName: emp.fullName || emp.name || '',
    }));
    setEmpSearch(`${emp.fullName || emp.name} (${emp.employeeNumber || emp.userId})`);
    setShowEmpDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      if (payslipFile) {
        submitData.append('payslip', payslipFile);
      }

      const res = await axios.post(`${API_BASE_URL}/admin/upload`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setSuccess("Payroll record saved successfully.");
        setShowForm(false);
        setFormData({
          employeeNumber: '', employeeName: '', month: filterMonth, year: filterYear, baseSalary: '', allowances: '0', otherDeductions: '0'
        });
        setPayslipFile(null);
        setEmpSearch('');
        fetchPayrolls();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save payroll record.");
    } finally {
      setFormLoading(false);
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  const filteredPayrolls = payrolls.filter(p => 
    (p.employeeNumber && p.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (p.employeeName && p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEmployees = employees.filter(emp => {
    const term = empSearch.toLowerCase();
    const name = (emp.fullName || emp.name || '').toLowerCase();
    const id = (emp.employeeNumber || emp.userId || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    return name.includes(term) || id.includes(term) || email.includes(term);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><DollarSign size={28} /></div>
              Payroll Management
            </h1>
            <p className="text-gray-500 mt-2">Manage employee salaries, upload payslips via Google Drive, and process LOP.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            {showForm ? 'Cancel' : <><Plus size={20} /> Add Payroll Record</>}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" /> {success}
          </div>
        )}

        {/* Upload Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 animate-slide-in-up">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">New Payroll Record</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Employee Selection */}
                <div className="lg:col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee *</label>
                  <input 
                    type="text" 
                    required 
                    value={empSearch} 
                    onChange={(e) => {
                      setEmpSearch(e.target.value);
                      setShowEmpDropdown(true);
                    }}
                    onFocus={() => setShowEmpDropdown(true)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Search by name, ID or email..." 
                  />
                  {showEmpDropdown && empSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => selectEmployee(emp)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            <div className="font-semibold text-gray-800">{emp.fullName || emp.name}</div>
                            <div className="text-xs text-gray-500 flex gap-3">
                              <span>ID: {emp.employeeNumber || emp.userId}</span>
                              {emp.email && <span>Email: {emp.email}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-sm">No employees found.</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <select name="month" value={formData.month} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <select name="year" value={formData.year} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (₹) *</label>
                  <input type="number" required min="0" step="0.01" name="baseSalary" value={formData.baseSalary} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowances (₹)</label>
                  <input type="number" min="0" step="0.01" name="allowances" value={formData.allowances} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Deductions (₹)</label>
                  <input type="number" min="0" step="0.01" name="otherDeductions" value={formData.otherDeductions} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Payslip (PDF)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden" 
                      id="payslip-upload"
                    />
                    <label 
                      htmlFor="payslip-upload" 
                      className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors text-gray-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500"
                    >
                      <Upload size={20} className="text-gray-400" />
                      {payslipFile ? (
                        <span className="font-medium text-blue-600 truncate">{payslipFile.name}</span>
                      ) : (
                        <span>Click to browse or drag and drop PDF</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {formLoading ? <><RefreshCcw size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Record</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-40">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-24 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <RefreshCcw className="animate-spin h-8 w-8 text-blue-600 mb-4" />
              Loading payroll records...
            </div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-600">No records found</p>
              <p className="text-sm mt-1 text-gray-400">There are no payroll records for {filterMonth} {filterYear}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4 text-right">Base Salary</th>
                    <th className="px-6 py-4 text-right">Allowances</th>
                    <th className="px-6 py-4 text-right">Reimbursements</th>
                    <th className="px-6 py-4 text-center">AL Used</th>
                    <th className="px-6 py-4 text-center">LOP Days</th>
                    <th className="px-6 py-4 text-right">LOP Deduction</th>
                    <th className="px-6 py-4 text-right">Other Deduct</th>
                    <th className="px-6 py-4 text-right text-blue-700 font-bold border-l border-gray-200 bg-blue-50/30">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayrolls.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{p.employeeName || p.employeeNumber}</div>
                        {p.employeeName && <div className="text-xs text-gray-500">{p.employeeNumber}</div>}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">₹{p.baseSalary?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">+₹{p.allowances?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">+₹{p.reimbursementsAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">{p.annualLeaveUsed || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-orange-600">{p.lopDays || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 font-medium">
                        <div>-₹{p.lopDeductionAmount?.toLocaleString() || 0}</div>
                        {p.lopDeductionPercentage > 0 && <div className="text-[10px] mt-0.5"><span className="bg-red-100 px-1 rounded">({p.lopDeductionPercentage}%)</span></div>}
                        {p.deductionReason && (
                          <div className="text-[10px] text-gray-500 font-normal leading-tight mt-1 max-w-[120px] ml-auto truncate" title={p.deductionReason}>
                            {p.deductionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 font-medium">-₹{p.otherDeductions?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right border-l border-gray-200 bg-blue-50/30">
                        <div className="font-bold text-gray-900 text-base">₹{p.finalSalary?.toLocaleString()}</div>
                        {p.needsRecalculation && (
                          <div className="mt-1 flex justify-end">
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded" title={p.recalculationReason || 'Leave adjusted'}>
                              <AlertCircle size={10} /> Needs Recalc
                            </span>
                          </div>
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
  );
}
