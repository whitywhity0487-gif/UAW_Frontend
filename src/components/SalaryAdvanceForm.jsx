import React, { useState, useEffect } from "react";
import axios from "axios";

/* ─────────────────────────────────────────────────────────────────────────────
   Professional Salary Advance Form - Full Width Layout
   Employee info at top, no email footer, full screen width coverage
───────────────────────────────────────────────────────────────────────────── */

const CURRENCY_CONFIG = {
  INDIA: { currency: "INR", symbol: "₹", max: 100000, min: 1000, employeeType: "Indian", locale: "en-IN", flag: "🇮🇳" },
  USA:   { currency: "USD", symbol: "$",  max: 1000,   min: 100,   employeeType: "US",      locale: "en-US", flag: "🇺🇸" },
  CHINA: { currency: "CNY", symbol: "¥",  max: 7000,   min: 500,   employeeType: "Chinese", locale: "zh-CN", flag: "🇨🇳" },
};

const getCfg = (nat) => CURRENCY_CONFIG[(nat || "").toUpperCase()] ?? CURRENCY_CONFIG.INDIA;
const formatAmount = (n, nat) => n?.toLocaleString(getCfg(nat).locale) || "0";
const getSymbol = (currency) => ({ INR: "₹", USD: "$", CNY: "¥" }[currency] ?? "₹");

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_COLORS = [
  "bg-gradient-to-br from-blue-600 to-indigo-600",
  "bg-gradient-to-br from-emerald-600 to-teal-600",
  "bg-gradient-to-br from-amber-600 to-orange-600",
  "bg-gradient-to-br from-rose-600 to-pink-600",
  "bg-gradient-to-br from-purple-600 to-violet-600",
  "bg-gradient-to-br from-cyan-600 to-sky-600",
];

const getAvatarColor = (name = "") => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// Status badge component
const StatusBadge = ({ status }) => {
  const styles = {
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    PENDING:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  const dotColors = {
    APPROVED: "bg-emerald-400",
    REJECTED: "bg-rose-400",
    PENDING:  "bg-amber-400 animate-pulse",
  };
  const currentStyle = styles[status] || styles.PENDING;
  const dotColor = dotColors[status] || dotColors.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status?.charAt(0) + status?.slice(1).toLowerCase() || "Pending"}
    </span>
  );
};

// Main Component
export default function SalaryAdvanceForm() {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [hasPending, setHasPending] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("request");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch employee data on mount
  useEffect(() => {
    const raw = localStorage.getItem("user");
    let user = { nationality: "INDIA", name: "Guest User", email: "guest@example.com" };
    if (raw) {
      try {
        user = JSON.parse(raw);
      } catch (e) {}
    }
    const id = user.username || user.employeeId || user.id || "demo_employee";
    setEmployeeId(id);

    const fallbackDetails = {
      nationality: user.nationality || "INDIA",
      name: user.name || user.username || "Team Member",
      email: user.email || "employee@company.com",
      employeeNumber: user.employeeNumber || "EMP001"
    };

    // Fetch personal details
    axios.get(`https://uaw-backend.vercel.app/api/personal-details?userId=${id}`)
      .then((r) => {
        if (r.data.success && r.data.data) {
          setEmployeeDetails({
            nationality: r.data.data.nationality || "INDIA",
            name: r.data.data.fullName || fallbackDetails.name,
            email: r.data.data.emailId || fallbackDetails.email,
            employeeNumber: r.data.data.employeeNumber || fallbackDetails.employeeNumber
          });
        } else {
          setEmployeeDetails(fallbackDetails);
        }
      })
      .catch(() => setEmployeeDetails(fallbackDetails));

    // Check pending request
    axios.get(`https://uaw-backend.vercel.app/api/salary-advance/pending/${id}`)
      .then((r) => r.data.success && setHasPending(r.data.hasPending))
      .catch(() => {});

    // Fetch request history
    axios.get(`https://uaw-backend.vercel.app/api/salary-advance/employee-requests/${id}`)
      .then((r) => r.data.success && setRequests(r.data.data || []))
      .catch(() => {});
  }, []);

  const refreshRequests = () => {
    if (!employeeId) return;
    axios.get(`https://uaw-backend.vercel.app/api/salary-advance/employee-requests/${employeeId}`)
      .then((r) => r.data.success && setRequests(r.data.data || []))
      .catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeDetails) return;
    
    setError("");
    setMessage("");
    setIsSubmitting(true);
    
    const cfg = getCfg(employeeDetails.nationality);
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount.");
      setIsSubmitting(false);
      return;
    }
    if (numAmount < cfg.min) {
      setError(`Minimum amount is ${cfg.symbol}${formatAmount(cfg.min, employeeDetails.nationality)} ${cfg.currency}`);
      setIsSubmitting(false);
      return;
    }
    if (numAmount > cfg.max) {
      setError(`Maximum amount is ${cfg.symbol}${formatAmount(cfg.max, employeeDetails.nationality)} ${cfg.currency}`);
      setIsSubmitting(false);
      return;
    }
    
    try {
      const res = await axios.post("https://uaw-backend.vercel.app/api/salary-advance/request", {
        employeeId: employeeId,
        amount: numAmount,
        reason: reason.trim() || "Not specified",
      });
      if (res.data.success) {
        setMessage("✓ Request submitted successfully! Admin will review it shortly.");
        setAmount("");
        setReason("");
        setHasPending(true);
        refreshRequests();
        setTimeout(() => setActiveTab("history"), 1500);
      } else {
        setError(res.data.message || "Submission failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickReasons = [
    "Medical emergency", "Education fees", 
    "Home renovation", "Family function", "Travel expense"
  ];

  if (!employeeDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const cfg = getCfg(employeeDetails.nationality);
  const nationality = employeeDetails.nationality;
  const progressPercent = amount && !isNaN(parseFloat(amount)) 
    ? Math.min((parseFloat(amount) / cfg.max) * 100, 100) 
    : 0;
  const avatarColor = getAvatarColor(employeeDetails.name);
  const totalApproved = requests
    .filter(r => r.status === "APPROVED")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="w-full px-6 lg:px-12 py-6 lg:py-8">
        
        {/* Top Bar - Employee Info & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          {/* Left side - Title */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
              Salary Advance
            </h1>
          </div>
          
          {/* Right side - Employee Info Card */}
          <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-2.5">
           
            <div>
              <p className="text-sm font-semibold text-slate-800">{employeeDetails.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{cfg.employeeType}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="font-mono text-slate-600">EmployeeNmber:{employeeDetails.employeeNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row - Full width spread */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nationality</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{nationality} {cfg.flag}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Maximum Limit</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{cfg.symbol}{formatAmount(cfg.max, nationality)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Min: {cfg.symbol}{formatAmount(cfg.min, nationality)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Total</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {totalApproved > 0 ? `${cfg.symbol}${formatAmount(totalApproved, nationality)}` : "—"}
            </p>
          </div>
        </div>

        {/* Tabs - Full width */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-1.5 mb-6 flex gap-1 max-w-md lg:max-w-lg">
          <button
            onClick={() => setActiveTab("request")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "request"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>📝</span> New Request
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "history"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>📋</span> History {requests.length > 0 && `(${requests.length})`}
          </button>
        </div>

        {/* Content Area - Full width card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
          
          {activeTab === "request" && (
            <div className="p-6 lg:p-8">
              {hasPending ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <span className="text-4xl">⏳</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Under Review</h2>
                  <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Your salary advance request is currently being reviewed by the finance team. 
                    You'll receive an update shortly.
                  </p>
                  <button
                    onClick={() => setActiveTab("history")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-300 text-amber-700 bg-amber-50 rounded-xl font-medium hover:bg-amber-100 transition-colors"
                  >
                    Track in History →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Request Amount <span className="text-slate-400 text-xs font-normal">({cfg.currency})</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-slate-400">
                        {cfg.symbol}
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setError("");
                        }}
                        placeholder="0"
                        min={cfg.min}
                        max={cfg.max}
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-4 py-4 text-2xl font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                    
                    {amount && parseFloat(amount) > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progressPercent > 90 ? "bg-amber-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Min: {cfg.symbol}{formatAmount(cfg.min, nationality)}</span>
                          <span className="text-slate-500 font-medium">{Math.round(progressPercent)}% of limit</span>
                          <span className="text-slate-400">Max: {cfg.symbol}{formatAmount(cfg.max, nationality)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Reason <span className="text-slate-400 text-xs font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="Briefly describe why you need this advance..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                    />
                    <p className="text-right text-xs text-slate-400 mt-1">{reason.length}/300</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {quickReasons.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setReason(reason === chip ? "" : chip)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          reason === chip
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-rose-500 text-lg">⚠️</span>
                      <p className="text-rose-700 text-sm flex-1">{error}</p>
                    </div>
                  )}

                  {message && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-emerald-500 text-lg">✓</span>
                      <p className="text-emerald-700 text-sm flex-1">{message}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request →"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="p-6 lg:p-8">
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <span className="text-4xl">📭</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No requests yet</h3>
                  <p className="text-slate-500 mb-6">Your salary advance requests will appear here</p>
                  <button
                    onClick={() => setActiveTab("request")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Make a Request →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {requests.map((req, idx) => {
                    const sym = getSymbol(req.currency || cfg.currency);
                    const date = new Date(req.appliedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    });
                    return (
                      <div
                        key={req.requestId || idx}
                        className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xl font-bold text-slate-800">
                                {sym}{req.amount?.toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {req.currency || cfg.currency}
                              </span>
                            </div>
                            <p className="text-slate-600 text-sm mb-2 line-clamp-2">{req.reason || "No reason provided"}</p>
                            <p className="text-xs text-slate-400">{date}</p>
                          </div>
                          <div>
                            <StatusBadge status={req.status} />
                          </div>
                        </div>
                        {req.adminRemarks && req.status !== "PENDING" && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <p className="text-xs">
                              <span className="font-semibold text-slate-500">Admin note:</span>{" "}
                              <span className="text-slate-600">{req.adminRemarks}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
