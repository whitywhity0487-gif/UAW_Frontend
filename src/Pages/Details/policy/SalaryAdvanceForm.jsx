import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import toast from 'react-hot-toast';
import DashboardLayout, { DashboardContainer } from '../../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../../components/dashboard/DashboardHeader';
import { API_BASE_URL } from '../../../config/constants.js';

/* ── Shared input classes (from Mypersonaldetails) ──────────────── */
const inputCls =
  "w-full px-4 py-3 text-sm bg-gray-50/50 backdrop-blur-sm border border-gray-200 rounded-xl outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 shadow-sm placeholder:text-gray-400";

/* ── Section label ─────────────────────────────────────────────── */
const SectionLabel = ({ children, required }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
    {children}{required && <span className="ml-1 text-red-400">*</span>}
  </label>
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

/* ─── Constants ──────────────────────────────────────────────── */
const CURRENCY_CONFIG = {
  INDIA: { currency: "INR", symbol: "₹" },
  USA: { currency: "USD", symbol: "$" },
  CHINA: { currency: "CNY", symbol: "¥" },
};
const getCfg = (nat) => CURRENCY_CONFIG[(nat || "").toUpperCase()] ?? CURRENCY_CONFIG.INDIA;
const getSymbol = (c) => ({ INR: "₹", USD: "$", CNY: "¥" }[c] ?? "₹");

const QUICK_REASONS = [
  "Medical emergency", "Education fees",
  "Home renovation", "Family function", "Travel expense",
];

/* ─── Sub-components ─────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const s = (status || "PENDING").toUpperCase();
  const map = {
    APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  };
  const style = map[s] || map.PENDING;
  const label = s.charAt(0) + s.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide border rounded-full ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
      {label}
    </span>
  );
};

/* ─── Main component ─────────────────────────────────────────── */
export default function SalaryAdvanceForm() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [hasPending, setHasPending] = useState(false);
  const [isEligible, setIsEligible] = useState(true);
  const [salaryAdvanceRemaining, setSalaryAdvanceRemaining] = useState(100000);
  const [totalLimit, setTotalLimit] = useState(100000);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("request");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    let user = { nationality: "INDIA", name: "Guest User", email: "guest@example.com" };
    if (raw) { try { user = JSON.parse(raw); } catch { } }
    const id = user.username || user.employeeId || user.id || "demo_employee";
    setEmployeeId(id);

    const fallback = {
      nationality: user.nationality || "INDIA",
      name: user.name || user.username || "Team Member",
      email: user.email || "employee@company.com",
      employeeNumber: user.employeeNumber || "EMP001",
    };

    axios.get(`${API_BASE_URL}/api/personal-details?userId=${id}`)
      .then((r) => {
        if (r.data.success && r.data.data) {
          setEmployeeDetails({
            nationality: r.data.data.nationality || "INDIA",
            name: r.data.data.fullName || fallback.name,
            email: r.data.data.emailId || fallback.email,
            employeeNumber: r.data.data.employeeNumber || fallback.employeeNumber,
          });
        } else {
          setEmployeeDetails(fallback);
        }
      })
      .catch(() => setEmployeeDetails(fallback));

    axios.get(`${API_BASE_URL}/api/salary-advance/pending/${id}`)
      .then((r) => r.data.success && setHasPending(r.data.hasPending))
      .catch(() => { });

    axios.get(`${API_BASE_URL}/api/salary-advance/employee-analytics/${id}`)
      .then((r) => {
        if (r.data.success && r.data.data) {
          setIsEligible(r.data.data.salaryAdvanceEligible);
          const rem = r.data.data.salaryAdvanceRemaining;
          const tot = r.data.data.salaryAdvanceLimit || rem;
          setSalaryAdvanceRemaining(rem);
          setTotalLimit(tot);
        }
      })
      .catch(() => { });

    axios.get(`${API_BASE_URL}/api/salary-advance/employee-requests/${id}`)
      .then((r) => r.data.success && setRequests(r.data.data || []))
      .catch(() => { });
  }, []);

  const refreshRequests = () => {
    if (!employeeId) return;
    axios.get(`${API_BASE_URL}/api/salary-advance/employee-requests/${employeeId}`)
      .then((r) => r.data.success && setRequests(r.data.data || []))
      .catch(() => { });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeDetails) return;
    setReasonError("");

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setReasonError("A reason is required — please describe why you need this advance.");
      return;
    }
    if (trimmedReason.length < 10) {
      setReasonError("Please provide a bit more detail (at least 10 characters).");
      return;
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid amount greater than 0.");
      return;
    }
    if (numAmount > salaryAdvanceRemaining) {
      toast.error("Amount exceeds your remaining advance limit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/salary-advance/request`, {
        employeeId, amount: numAmount, reason: trimmedReason,
      });
      if (res.data.success) {
        toast.success("Request submitted — the finance team will review it shortly.");
        setAmount(""); setReason(""); setHasPending(true);
        refreshRequests();
        setTimeout(() => setActiveTab("history"), 1600);
      } else {
        toast.error(res.data.message || "Submission failed.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Loading */
  if (!employeeDetails) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div className="w-1/2 h-full bg-indigo-600 rounded-full animate-[loadingSlide_1.4s_ease-in-out_infinite]" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading your profile...</p>
        <style>{`@keyframes loadingSlide { 0% { margin-left: -50%; } 100% { margin-left: 100%; } }`}</style>
      </div>
    );
  }

  const cfg = getCfg(employeeDetails.nationality);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Salary Advance"
        subtitle="Request and track your salary advances"
      />
      <DashboardContainer>
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ── Tabs ── */}
          <div className="flex gap-6 border-b border-gray-200 mb-6">
            <button
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'request' ? 'border-indigo-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('request')}
            >
              New Request
            </button>
            <button
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'history' ? 'border-indigo-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('history')}
            >
              History
              {requests.length > 0 && (
                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>
              )}
            </button>
          </div>

          {activeTab === 'request' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">

              {/* Card header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Salary Advance Form</h2>
                  {/* <p className="text-xs text-gray-500 mt-1">Available Limit: {cfg.symbol}{salaryAdvanceRemaining.toLocaleString()}</p> */}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{employeeId || '—'}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{employeeDetails.employeeNumber || '—'}</p>
                </div>
              </div>

              {!isEligible ? (
                <div className="py-20 text-center">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 text-2xl">
                    🛑
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Not Eligible</h2>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                    You are currently not eligible to submit a salary advance request. Contact HR for further assistance.
                  </p>
                  <button onClick={() => setActiveTab("history")} className="px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                    View History
                  </button>
                </div>
              ) : hasPending ? (
                <div className="py-20 text-center">
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 text-2xl">
                    ⏳
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Under Review</h2>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                    Your request is with the finance team. You'll be notified once a decision is made.
                  </p>
                  <button onClick={() => setActiveTab("history")} className="px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                    Track in History
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8 space-y-7">

                  {/* Amount */}
                  <div>
                    <SectionLabel required>Amount ({cfg.currency})</SectionLabel>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none select-none font-medium">{cfg.symbol}</span>
                      <input
                        type="number"
                        className={inputCls + " pl-9 text-lg font-bold tabular-nums"}
                        value={amount}
                        placeholder="0"
                        max={salaryAdvanceRemaining}
                        disabled={isSubmitting}
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-", ".", " "].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, "");
                          if (val && parseFloat(val) > salaryAdvanceRemaining) {
                            toast.error("Amount exceeds your remaining advance limit.");
                            val = salaryAdvanceRemaining.toString();
                          }
                          setAmount(val);
                        }}
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <SectionLabel required>Reason</SectionLabel>
                    <textarea
                      className={inputCls + " resize-none leading-relaxed"}
                      rows={3}
                      maxLength={500}
                      placeholder="Briefly describe why you need this advance…"
                      value={reason}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (e.target.value.trim().length >= 10) setReasonError("");
                      }}
                    />
                    {reasonError && (
                      <p className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {reasonError}
                      </p>
                    )}
                  </div>

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUICK_REASONS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${reason === chip
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        onClick={() => {
                          setReason(reason === chip ? "" : chip);
                          if (chip.length >= 10) setReasonError("");
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                    >
                      {isSubmitting && <Spinner />}
                      {isSubmitting ? 'Submitting…' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Request History</h2>
              </div>

              {requests.length === 0 ? (
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
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        {['Date', 'Amount', 'Reason', 'Status'].map(h => (
                          <th key={h} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {requests.map((req, idx) => {
                        const sym = getSymbol(req.currency || cfg.currency);
                        const date = new Date(req.appliedAt).toLocaleDateString("en-IN", {
                          year: "numeric", month: "short", day: "numeric",
                        });
                        return (
                          <tr key={req.requestId || idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm font-medium tabular-nums">
                              {date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 tabular-nums text-sm">
                              {sym}{req.amount?.toLocaleString()} <span className="text-xs text-gray-400 font-medium ml-1">{req.currency || cfg.currency}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-sm max-w-[250px] truncate" title={req.reason}>
                              {req.reason || <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={req.status} />
                              {req.adminRemarks && req.status !== "PENDING" && (
                                <p className="text-[11px] text-gray-500 mt-1.5 max-w-[150px] truncate" title={req.adminRemarks}>
                                  <span className="font-bold text-gray-700">Remarks: </span>{req.adminRemarks}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardContainer>
    </DashboardLayout>
  );
}