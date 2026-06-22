import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Calendar, FileText, Download, AlertCircle, Info, ChevronLeft } from 'lucide-react';

const API_BASE_URL = 'https://uaw-backend.vercel.app/api/payroll';

export default function PayrollDashboard({ user }) {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyPayrolls();
  }, []);

  const fetchMyPayrolls = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const employeeNumber = storedUser?.username || storedUser?.employeeId || storedUser?.id;
      
      if (!employeeNumber) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/user/${employeeNumber}`);
      if (res.data.success && res.data.data) {
        const records = res.data.data;
        setPayrolls(records);
        if (records.length > 0) {
          setSelectedPayroll(records[0]); // Default to most recent
        }
      }
    } catch (err) {
      console.error("Error fetching payroll:", err);
      setError("Failed to load payroll data.");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    const pId = e.target.value;
    const found = payrolls.find(p => p.id === pId);
    if (found) setSelectedPayroll(found);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
     
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/home')}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} /> Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><DollarSign size={28} /></div>
              My Payroll
            </h1>
            <p className="text-gray-500 mt-2">View your salary details, leave deductions, and payroll history.</p>
          </div>
          
          {payrolls.length > 0 && (
            <div className="relative">
              <select 
                value={selectedPayroll?.id || ''} 
                onChange={handleMonthChange}
                className="pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none cursor-pointer"
              >
                {payrolls.map(p => (
                  <option key={p.id} value={p.id}>{p.month} {p.year}</option>
                ))}
              </select>
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center text-gray-500 flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Loading your payroll data...
          </div>
        ) : payrolls.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Payroll Records Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Payroll records are not available for your account yet. Please contact HR or the Admin department for assistance.
            </p>
          </div>
        ) : selectedPayroll ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Salary Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium opacity-90">Net Salary ({selectedPayroll.month} {selectedPayroll.year})</h2>
                    <p className="text-4xl font-bold mt-1">₹{selectedPayroll.finalSalary?.toLocaleString()}</p>
                  </div>
                  {selectedPayroll.payslipUrl ? (
                    <a 
                      href={selectedPayroll.payslipUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition flex items-center gap-2 font-medium"
                    >
                      <Download size={20} /> View Payslip
                    </a>
                  ) : (
                    <button disabled className="p-3 bg-white/10 text-white/50 rounded-xl backdrop-blur-sm cursor-not-allowed flex items-center gap-2 font-medium" title="No payslip available">
                      <FileText size={20} /> No Payslip
                    </button>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Earnings</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50">
                      <span className="text-gray-600 font-medium">Base Salary</span>
                      <span className="text-gray-900 font-bold">₹{selectedPayroll.baseSalary?.toLocaleString()}</span>
                    </div>
                    {selectedPayroll.allowances > 0 && (
                      <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50">
                        <span className="text-gray-600 font-medium">Allowances</span>
                        <span className="text-emerald-600 font-bold">+₹{selectedPayroll.allowances?.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedPayroll.reimbursementsAmount > 0 && (
                      <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50">
                        <span className="text-gray-600 font-medium">Reimbursements</span>
                        <span className="text-emerald-600 font-bold">+₹{selectedPayroll.reimbursementsAmount?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Deductions</h3>
                  <div className="space-y-4">
                    {selectedPayroll.lopDeductionAmount > 0 && (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-red-50/50 border border-red-100">
                        <div>
                          <span className="text-gray-800 font-medium flex items-center gap-2">
                            Loss of Pay (LOP)
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold">{selectedPayroll.lopDeductionPercentage}%</span>
                          </span>
                        </div>
                        <span className="text-red-600 font-bold">-₹{selectedPayroll.lopDeductionAmount?.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedPayroll.otherDeductions > 0 && (
                      <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50">
                        <span className="text-gray-600 font-medium">Other Deductions</span>
                        <span className="text-red-600 font-bold">-₹{selectedPayroll.otherDeductions?.toLocaleString()}</span>
                      </div>
                    )}
                    {(selectedPayroll.lopDeductionAmount === 0 && selectedPayroll.otherDeductions === 0) && (
                      <div className="p-3 text-gray-500 italic">No deductions applied.</div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedPayroll.deductionReason && selectedPayroll.lopDeductionAmount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex gap-4 items-start">
                  <div className="text-orange-500 mt-0.5"><Info size={24} /></div>
                  <div>
                    <h4 className="font-bold text-orange-900">Deduction Reason</h4>
                    <p className="text-orange-800 mt-1 text-sm leading-relaxed">{selectedPayroll.deductionReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Leave Summary Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" />
                  Leave Overview
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-500 font-medium">Annual Leave Used</span>
                      <span className="text-gray-900 font-bold">{selectedPayroll.annualLeaveUsed || 0} days</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, ((selectedPayroll.annualLeaveUsed || 0) / 11) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500 font-medium">Loss Of Pay (LOP) Days</span>
                      <span className="text-red-600 font-bold">{selectedPayroll.lopDays || 0} days</span>
                    </div>
                    {selectedPayroll.lopDays > 0 && (
                      <p className="text-xs text-gray-500">
                        {selectedPayroll.lopDays} days have exceeded your allowed balance and directly impacted your net salary.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
}
