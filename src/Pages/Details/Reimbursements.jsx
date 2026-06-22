import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';

const API_BASE_URL   = 'http://localhost:5000/api/reimbursements';
const PD_API_URL     = 'http://localhost:5000/api/personal-details';

const REIMB_TYPES = ['Travel', 'Food', 'Medical', 'Internet/Phone', 'Relocation', 'Other'];

/* ── Status badge ─────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    PENDING:  'bg-amber-50  text-amber-700  border-amber-200',
  };
  const dot = {
    APPROVED: 'bg-emerald-500',
    REJECTED: 'bg-rose-500',
    PENDING:  'bg-amber-400 animate-pulse',
  };
  const s = (status || 'PENDING').toUpperCase();
  const label = s.charAt(0) + s.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[s] || map.PENDING}`}>
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

/* ── Main ─────────────────────────────────────────────────────── */
const Reimbursements = () => {
  const [employeeDetails, setEmployeeDetails] = useState({ employeeNumber: '', employeeName: '' });
  const [formData, setFormData]   = useState({ reimbursementType: '', amount: '', description: '', document: null });
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [error, setError]         = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchEmployeeDetails(); }, []);

  const fetchEmployeeDetails = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) { navigate('/'); return; }
      const user   = JSON.parse(storedUser);
      const userId = user.username || user.employeeId || user.id;
      const res    = await axios.get(`${PD_API_URL}?userId=${userId}`);
      if (res.data.success && res.data.data) {
        const pd  = res.data.data;
        const num = pd.employeeNumber || '';
        const name = pd.fullName || '';
        setEmployeeDetails({ employeeNumber: num, employeeName: name });
        if (num) fetchReimbursementHistory(num);
        else { setFetchingHistory(false); setError('Employee number missing in Personal Details.'); }
      } else {
        setFetchingHistory(false);
        setError('Could not fetch profile. Please complete Personal Details first.');
      }
    } catch {
      setFetchingHistory(false);
      setError('Failed to load employee details. Please try again.');
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
    setError(null); setSuccessMsg('');

    if (!employeeDetails.employeeNumber || !employeeDetails.employeeName)
      return setError('Employee details are missing.');
    if (!formData.reimbursementType || !formData.amount || !formData.document)
      return setError('Please fill all required fields: Type, Amount, and Document.');

    setLoading(true);
    try {
      const data = new FormData();
      data.append('employeeNumber',    employeeDetails.employeeNumber);
      data.append('employeeName',      employeeDetails.employeeName);
      data.append('reimbursementType', formData.reimbursementType);
      data.append('amount',            formData.amount);
      data.append('description',       formData.description);
      data.append('document',          formData.document);

      const res = await axios.post(API_BASE_URL, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSuccessMsg('Request submitted — the finance team will review it shortly.');
        setFormData({ reimbursementType: '', amount: '', description: '', document: null });
        if (fileRef.current) fileRef.current.value = '';
        fetchReimbursementHistory(employeeDetails.employeeNumber);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared input classes ─────────────────────────────────────── */
  const inputCls =
    'w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-900 ' +
    'outline-none focus:ring-2 focus:ring-slate-800/15 focus:border-slate-700 transition-all placeholder:text-stone-400';

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="flex items-end justify-between border-b border-stone-200 pb-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/home')}
              className="mb-4"
            >
              Back to Home
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Reimbursements</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-stone-800">{employeeDetails.employeeName || '—'}</p>
            <p className="text-xs text-stone-400 font-mono">{employeeDetails.employeeNumber || '—'}</p>
          </div>
        </div>

        {/* ── Banners ─────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {successMsg}
          </div>
        )}

        {/* ── Form card ───────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-900">New Request</h2>
            <p className="text-xs text-stone-400 mt-0.5">All fields marked * are required</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Type + Amount row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                  Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="reimbursementType"
                  value={formData.reimbursementType}
                  onChange={handleInputChange}
                  required
                  className={inputCls + ' appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] pr-9'}
                >
                  <option value="">Select type</option>
                  {REIMB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                  Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-base font-medium pointer-events-none">₹</span>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                    className={inputCls + ' pl-8 font-semibold tabular-nums'}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-stone-100" />

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief description of the expense…"
                className={inputCls + ' resize-none leading-relaxed'}
              />
            </div>

            {/* Document upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Supporting Document <span className="text-rose-500">*</span>
              </label>

              <label
                htmlFor="document"
                className={`
                  flex items-center gap-4 px-4 py-4 border rounded-lg cursor-pointer transition-all
                  ${formData.document
                    ? 'border-slate-700 bg-slate-50'
                    : 'border-stone-200 bg-stone-50 hover:border-slate-400 hover:bg-white'}
                `}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${formData.document ? 'bg-slate-800' : 'bg-stone-200'}`}>
                  {formData.document ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {formData.document ? (
                    <>
                      <p className="text-sm font-semibold text-slate-800 truncate">{formData.document.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-stone-700">Upload a file</p>
                      <p className="text-xs text-stone-400 mt-0.5">PDF, PNG, JPG — up to 5 MB</p>
                    </>
                  )}
                </div>

                <input
                  id="document"
                  ref={fileRef}
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </label>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </div>

        {/* ── History ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-900">
              Request History
              {history.length > 0 && (
                <span className="ml-2 inline-block bg-stone-100 text-stone-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </h2>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {fetchingHistory ? (
              <div className="flex items-center justify-center gap-3 py-16 text-stone-400 text-sm">
                <Spinner /> Loading history…
              </div>
            ) : history.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-stone-700 mb-1">No requests yet</p>
                <p className="text-xs text-stone-400">Submitted requests will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      {['Date', 'Type', 'Amount', 'Description', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {history.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-stone-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-stone-500 text-xs tabular-nums">
                          {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-stone-800">
                          {item.reimbursementType}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-semibold text-stone-900 tabular-nums">
                          ₹{Number(item.amount).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-stone-500 max-w-[180px] truncate" title={item.description}>
                          {item.description || <span className="text-stone-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                          {item.reason && (
                            <p className="text-[11px] text-stone-500 mt-1 max-w-[150px] truncate" title={item.reason}>
                              <span className="font-medium text-stone-600">Remarks:</span> {item.reason}
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
    </div>
  );
};

export default Reimbursements;