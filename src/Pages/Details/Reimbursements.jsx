import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/Button';
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { API_BASE_URL as GLOBAL_API_BASE_URL } from '../../config/constants';

const API_BASE_URL = `${GLOBAL_API_BASE_URL}/api/reimbursements`;
const PD_API_URL = `${GLOBAL_API_BASE_URL}/api/personal-details`;

const REIMB_TYPES = ['Travel', 'Food', 'Medical', 'Internet/Phone', 'Relocation', 'Other'];

/* ── Status badge — strictly monochrome ───────────────────────── */
const StatusBadge = ({ status }) => {
  const s = (status || 'PENDING').toUpperCase();
  const map = {
    APPROVED: { bg: 'bg-[#1C1C1C]', text: 'text-white', border: 'border-[#1C1C1C]' },
    REJECTED: { bg: 'bg-white', text: 'text-[#1C1C1C]', border: 'border-[#1C1C1C]' },
    PENDING: { bg: 'bg-[#F0F0F0]', text: 'text-[#5A5A5A]', border: 'border-[#C8C8C8]' },
  };
  const dot = {
    APPROVED: 'bg-white',
    REJECTED: 'bg-[#1C1C1C]',
    PENDING: 'bg-[#9A9A9A]',
  };
  const style = map[s] || map.PENDING;
  const label = s.charAt(0) + s.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot[s] || dot.PENDING}`} />
      {label}
    </span>
  );
};

/* ── Spinner ──────────────────────────────────────────────────── */
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/* ── Shared input classes (from Mypersonaldetails) ──────────────── */
const inputCls =
  "w-full px-4 py-3 text-sm bg-gray-50/50 backdrop-blur-sm border border-gray-200 rounded-xl outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 shadow-sm placeholder:text-gray-400";

/* ── Section label ─────────────────────────────────────────────── */
const SectionLabel = ({ children, required }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
    {children}{required && <span className="ml-1 text-red-400">*</span>}
  </label>
);

/* ── Main ─────────────────────────────────────────────────────── */
const Reimbursements = () => {
  const [employeeDetails, setEmployeeDetails] = useState({ employeeNumber: '', employeeName: '', userId: '' });
  const [formData, setFormData] = useState({ reimbursementType: '', amount: '', description: '', document: null });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchEmployeeDetails(); }, []);

  const fetchEmployeeDetails = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) { navigate('/'); return; }
      const user = JSON.parse(storedUser);
      const userId = user.username || user.employeeId || user.id;
      const res = await axios.get(`${PD_API_URL}?userId=${userId}`);
      if (res.data.success && res.data.data) {
        const pd = res.data.data;
        const num = pd.employeeNumber || '';
        const name = pd.fullName || '';
        setEmployeeDetails({ employeeNumber: num, employeeName: name, userId: userId });
        if (num) fetchReimbursementHistory(num);
        else { setFetchingHistory(false); toast.error('Employee number missing in Personal Details.'); }
      } else {
        setFetchingHistory(false);
        toast.error('Could not fetch profile. Please complete Personal Details first.');
      }
    } catch {
      setFetchingHistory(false);
      toast.error('Failed to load employee details. Please try again.');
    }
  };

  const fetchReimbursementHistory = async (empNum) => {
    try {
      setFetchingHistory(true);
      const res = await axios.get(`${API_BASE_URL}/my?employeeNumber=${empNum}`);
      if (res.data.success) setHistory(res.data.data);
    } catch { /* silent */ }
    finally { setFetchingHistory(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      if (value === '' || /^\d+(\.\d{0,2})?$/.test(value))
        setFormData(f => ({ ...f, amount: value }));
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setFormData(f => ({ ...f, document: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeDetails.employeeNumber || !employeeDetails.employeeName) {
      toast.error('Employee details are missing.');
      return;
    }
    if (!formData.reimbursementType || !formData.amount || !formData.document) {
      toast.error('Please fill all required fields: Type, Amount, and Document.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('employeeNumber', employeeDetails.employeeNumber);
      data.append('employeeName', employeeDetails.employeeName);
      data.append('reimbursementType', formData.reimbursementType);
      data.append('amount', formData.amount);
      data.append('description', formData.description);
      data.append('document', formData.document);

      const res = await axios.post(API_BASE_URL, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Request submitted. The finance team will review it shortly.');
        setFormData({ reimbursementType: '', amount: '', description: '', document: null });
        if (fileRef.current) fileRef.current.value = '';
        fetchReimbursementHistory(employeeDetails.employeeNumber);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Reimbursements"
        subtitle="Submit and track your expense claims"
      />
      <DashboardContainer>
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ── Form card ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">

            {/* Card header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Expense claim form</h2>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{employeeDetails.userId || '—'}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{employeeDetails.employeeNumber || '—'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-7">

              {/* Description */}
              <div>
                <SectionLabel required>Claim title / Description</SectionLabel>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="For example: Client meeting lunch"
                  className={inputCls}
                />
              </div>

              {/* Type + Amount row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <SectionLabel required>Category</SectionLabel>
                  <div className="relative">
                    <select
                      name="reimbursementType"
                      value={formData.reimbursementType}
                      onChange={handleInputChange}
                      required
                      className={inputCls + ' appearance-none cursor-pointer'}
                    >
                      <option value="" className="cursor-pointer">Select a category</option>
                      {REIMB_TYPES.map(t => <option key={t} value={t} className="cursor-pointer">{t}</option>)}
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div>
                  <SectionLabel required>Amount (INR)</SectionLabel>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="1"
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Document upload */}
              <div>
                <SectionLabel required>Upload Receipt</SectionLabel>

                <label
                  htmlFor="document"
                  className={`
                  flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
                  ${formData.document
                      ? 'border-indigo-400 bg-indigo-50/50'
                      : 'border-gray-300 bg-gray-50/50 hover:border-indigo-400 hover:bg-indigo-50/30'}
                `}
                >
                  {formData.document ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{formData.document.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Click to replace file</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm font-medium text-gray-700">Drag and drop a file, or <span className="text-indigo-600 underline">Browse</span></p>
                      <p className="text-xs text-gray-400 mt-1.5">Max file size is 10MB</p>
                    </>
                  )}
                  <input
                    type="file"
                    id="document"
                    name="document"
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    className="hidden"
                    ref={fileRef}
                  />
                </label>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  {loading && <Spinner />}
                  {loading ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>

          {/* ── History ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Request History</h2>
              {history.length > 0 && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {history.length}
                </span>
              )}
            </div>

            <div className="bg-white">
              {fetchingHistory ? (
                <div className="flex items-center justify-center gap-3 py-16 text-gray-400 text-sm font-medium">
                  <Spinner /> Loading…
                </div>
              ) : history.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-gray-800 mb-1">No requests on record</p>
                  <p className="text-sm text-gray-500">Submitted requests will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        {['Date', 'Type', 'Amount', 'Description', 'Status'].map(h => (
                          <th key={h} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm font-medium tabular-nums">
                            {new Date(item.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 text-sm">
                            {item.reimbursementType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 tabular-nums text-sm">
                            ₹{Number(item.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm max-w-[180px] truncate" title={item.description}>
                            {item.description || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                            {item.status === 'REJECTED' && item.reason && (
                              <p className="text-[11px] text-gray-500 mt-1.5 max-w-[150px] truncate" title={item.reason}>
                                <span className="font-bold text-gray-700">Remarks: </span>{item.reason}
                              </p>
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
      </DashboardContainer>
    </DashboardLayout>
  );
};

export default Reimbursements;