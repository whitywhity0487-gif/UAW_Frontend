  import React, { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import axios from "axios";

  /* ─── Style injection ─────────────────────────────────────────── */
  const STYLE = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap');

    .saf-root * { box-sizing: border-box; }

    .saf-root {
      font-family: 'Inter', sans-serif;
      background: #FAFAF8;
      min-height: 100vh;
      color: #0F0F0E;
    }

    .saf-display { font-family: 'DM Serif Display', serif; }

    /* Layout */
    .saf-shell {
      max-width: 760px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }

    /* Header */
    .saf-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 40px;
      padding-bottom: 32px;
      border-bottom: 1px solid #E8E6E1;
    }
    .saf-title {
      font-size: 32px;
      line-height: 1.15;
      margin: 0 0 4px;
      font-weight: 400;
      letter-spacing: -0.5px;
      color: #0F0F0E;
    }
    .saf-subtitle {
      font-size: 13px;
      color: #9B9793;
      margin: 0;
      font-weight: 400;
    }
    .saf-employee-pill {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      flex-shrink: 0;
    }
    .saf-emp-name {
      font-size: 14px;
      font-weight: 600;
      color: #0F0F0E;
    }
    .saf-emp-id {
      font-size: 12px;
      color: #9B9793;
      font-variant-numeric: tabular-nums;
    }

    /* Limit bar */
    .saf-limit-block {
      background: #fff;
      border: 1px solid #E8E6E1;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .saf-limit-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #9B9793;
      margin: 0 0 4px;
    }
    .saf-limit-amount {
      font-size: 28px;
      font-weight: 600;
      color: #0F0F0E;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      margin: 0;
    }
    .saf-limit-currency {
      font-size: 13px;
      color: #9B9793;
      margin-left: 4px;
      font-weight: 400;
    }
    .saf-limit-bar-wrap {
      flex: 1;
    }
    .saf-limit-bar-track {
      height: 4px;
      background: #E8E6E1;
      border-radius: 99px;
      overflow: hidden;
    }
    .saf-limit-bar-fill {
      height: 100%;
      background: #1A3C34;
      border-radius: 99px;
      transition: width 0.6s ease;
    }
    .saf-limit-bar-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 11px;
      color: #9B9793;
    }

    /* Tabs */
    .saf-tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid #E8E6E1;
      margin-bottom: 36px;
    }
    .saf-tab {
      padding: 10px 0;
      margin-right: 28px;
      font-size: 14px;
      font-weight: 500;
      color: #9B9793;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
    }
    .saf-tab:hover { color: #0F0F0E; }
    .saf-tab.active {
      color: #0F0F0E;
      border-bottom-color: #1A3C34;
      font-weight: 600;
    }
    .saf-tab-count {
      display: inline-block;
      margin-left: 6px;
      background: #F0EFEC;
      color: #64625E;
      font-size: 11px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 99px;
    }

    /* Form */
    .saf-form { display: flex; flex-direction: column; gap: 24px; }

    .saf-field {}
    .saf-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #64625E;
      margin-bottom: 8px;
    }
    .saf-required { color: #C0392B; margin-left: 2px; }

    .saf-amount-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .saf-amount-symbol {
      position: absolute;
      left: 16px;
      font-size: 22px;
      font-weight: 500;
      color: #64625E;
      pointer-events: none;
      font-variant-numeric: tabular-nums;
    }
    .saf-amount-input {
      width: 100%;
      padding: 14px 16px 14px 38px;
      font-size: 22px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      border: 1px solid #E8E6E1;
      border-radius: 10px;
      outline: none;
      background: #fff;
      color: #0F0F0E;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .saf-amount-input:focus {
      border-color: #1A3C34;
      box-shadow: 0 0 0 3px rgba(26,60,52,0.08);
    }
    .saf-amount-input::-webkit-inner-spin-button,
    .saf-amount-input::-webkit-outer-spin-button { -webkit-appearance: none; }

    .saf-textarea {
      width: 100%;
      padding: 12px 14px;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      border: 1px solid #E8E6E1;
      border-radius: 10px;
      outline: none;
      background: #fff;
      color: #0F0F0E;
      resize: none;
      line-height: 1.6;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .saf-textarea:focus {
      border-color: #1A3C34;
      box-shadow: 0 0 0 3px rgba(26,60,52,0.08);
    }
    .saf-textarea.error {
      border-color: #C0392B;
      box-shadow: 0 0 0 3px rgba(192,57,43,0.08);
    }
    .saf-field-error {
      margin-top: 6px;
      font-size: 12px;
      color: #C0392B;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Quick chips */
    .saf-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .saf-chip {
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid #E8E6E1;
      border-radius: 99px;
      background: #fff;
      color: #64625E;
      cursor: pointer;
      transition: all 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .saf-chip:hover {
      border-color: #1A3C34;
      color: #1A3C34;
      background: #F0F6F4;
    }
    .saf-chip.selected {
      border-color: #1A3C34;
      color: #1A3C34;
      background: #EAF2EF;
      font-weight: 600;
    }

    /* Banners */
    .saf-banner {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      line-height: 1.5;
    }
    .saf-banner.error {
      background: #FEF3F1;
      border: 1px solid #F5C6C0;
      color: #8B2F27;
    }
    .saf-banner.success {
      background: #EDF7F3;
      border: 1px solid #A8D9C4;
      color: #1E5C43;
    }
    .saf-banner-icon { flex-shrink: 0; margin-top: 1px; }

    /* Submit */
    .saf-submit {
      width: 100%;
      padding: 14px;
      background: #1A3C34;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.01em;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .saf-submit:hover:not(:disabled) { background: #2D6A5A; }
    .saf-submit:disabled { opacity: 0.55; cursor: not-allowed; }

    /* Divider */
    .saf-divider { height: 1px; background: #E8E6E1; margin: 0; border: none; }

    /* State screens */
    .saf-state-screen {
      padding: 64px 0 48px;
      text-align: center;
    }
    .saf-state-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 24px;
    }
    .saf-state-icon.amber { background: #FEF9EC; }
    .saf-state-icon.red   { background: #FEF3F1; }
    .saf-state-title {
      font-family: 'DM Serif Display', serif;
      font-size: 22px;
      margin: 0 0 8px;
      font-weight: 400;
      color: #0F0F0E;
    }
    .saf-state-body {
      font-size: 14px;
      color: #64625E;
      margin: 0 0 24px;
      max-width: 320px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }
    .saf-state-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid #E8E6E1;
      background: #fff;
      color: #0F0F0E;
      text-decoration: none;
    }
    .saf-state-cta:hover { background: #F0EFEC; }

    /* History cards */
    .saf-history-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    @media (min-width: 600px) {
      .saf-history-grid { grid-template-columns: 1fr 1fr; }
    }
    .saf-history-card {
      background: #fff;
      border: 1px solid #E8E6E1;
      border-radius: 12px;
      padding: 18px 20px;
      transition: border-color 0.15s;
    }
    .saf-history-card:hover { border-color: #C8C5BF; }
    .saf-hcard-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }
    .saf-hcard-amount {
      font-size: 20px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #0F0F0E;
    }
    .saf-hcard-curr {
      font-size: 11px;
      color: #9B9793;
      background: #F0EFEC;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      margin-left: 6px;
      font-variant-numeric: tabular-nums;
    }
    .saf-hcard-reason {
      font-size: 13px;
      color: #64625E;
      margin: 0 0 8px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .saf-hcard-date {
      font-size: 11px;
      color: #9B9793;
    }
    .saf-hcard-remark {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #F0EFEC;
      font-size: 12px;
      color: #64625E;
      line-height: 1.5;
    }
    .saf-hcard-remark strong { color: #0F0F0E; font-weight: 600; }

    /* Status badges */
    .saf-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.03em;
      flex-shrink: 0;
    }
    .saf-badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .saf-badge.approved { background: #EDF7F3; color: #1E5C43; }
    .saf-badge.approved .saf-badge-dot { background: #2ECC71; }
    .saf-badge.rejected { background: #FEF3F1; color: #8B2F27; }
    .saf-badge.rejected .saf-badge-dot { background: #E74C3C; }
    .saf-badge.pending  { background: #FEF9EC; color: #7D5A0F; }
    .saf-badge.pending  .saf-badge-dot { background: #F39C12; animation: pulse 1.5s infinite; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    /* Spinner */
    .saf-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Loading */
    .saf-loading {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FAFAF8;
    }
    .saf-loading-inner { text-align: center; }
    .saf-loading-bar {
      width: 120px;
      height: 2px;
      background: #E8E6E1;
      border-radius: 99px;
      overflow: hidden;
      margin: 0 auto 16px;
    }
    .saf-loading-fill {
      height: 100%;
      background: #1A3C34;
      border-radius: 99px;
      animation: loadingSlide 1.4s ease-in-out infinite;
    }
    @keyframes loadingSlide {
      0%   { width: 0%; margin-left: 0; }
      50%  { width: 60%; margin-left: 20%; }
      100% { width: 0%; margin-left: 100%; }
    }
    .saf-loading-text {
      font-size: 13px;
      color: #9B9793;
      font-family: 'Inter', sans-serif;
    }

    @media (max-width: 600px) {
      .saf-header { flex-direction: column; align-items: flex-start; }
      .saf-employee-pill { align-items: flex-start; }
      .saf-limit-block { flex-direction: column; gap: 16px; align-items: flex-start; }
      .saf-limit-bar-wrap { width: 100%; }
    }
  `;

  /* ─── Constants ──────────────────────────────────────────────── */
  const CURRENCY_CONFIG = {
    INDIA: { currency: "INR", symbol: "₹" },
    USA:   { currency: "USD", symbol: "$" },
    CHINA: { currency: "CNY", symbol: "¥" },
  };
  const getCfg    = (nat) => CURRENCY_CONFIG[(nat || "").toUpperCase()] ?? CURRENCY_CONFIG.INDIA;
  const getSymbol = (c)   => ({ INR: "₹", USD: "$", CNY: "¥" }[c] ?? "₹");

  const QUICK_REASONS = [
    "Medical emergency", "Education fees",
    "Home renovation", "Family function", "Travel expense",
  ];

  /* ─── Sub-components ─────────────────────────────────────────── */
  const StatusBadge = ({ status }) => {
    const s = (status || "PENDING").toUpperCase();
    const cls = { APPROVED: "approved", REJECTED: "rejected", PENDING: "pending" }[s] || "pending";
    const label = s.charAt(0) + s.slice(1).toLowerCase();
    return (
      <span className={`saf-badge ${cls}`}>
        <span className="saf-badge-dot" />
        {label}
      </span>
    );
  };

  /* ─── Main component ─────────────────────────────────────────── */
  export default function SalaryAdvanceForm() {
    const navigate = useNavigate();
    const [amount, setAmount]               = useState("");
    const [reason, setReason]               = useState("");
    const [reasonError, setReasonError]     = useState("");
    const [message, setMessage]             = useState("");
    const [error, setError]                 = useState("");
    const [employeeId, setEmployeeId]       = useState("");
    const [hasPending, setHasPending]       = useState(false);
    const [isEligible, setIsEligible]       = useState(true);
    const [salaryAdvanceRemaining, setSalaryAdvanceRemaining] = useState(100000);
    const [totalLimit, setTotalLimit]       = useState(100000);
    const [employeeDetails, setEmployeeDetails] = useState(null);
    const [requests, setRequests]           = useState([]);
    const [activeTab, setActiveTab]         = useState("request");
    const [isSubmitting, setIsSubmitting]   = useState(false);

    useEffect(() => {
      const raw = localStorage.getItem("user");
      let user  = { nationality: "INDIA", name: "Guest User", email: "guest@example.com" };
      if (raw) { try { user = JSON.parse(raw); } catch {} }
      const id  = user.username || user.employeeId || user.id || "demo_employee";
      setEmployeeId(id);

      const fallback = {
        nationality:    user.nationality   || "INDIA",
        name:           user.name          || user.username || "Team Member",
        email:          user.email         || "employee@company.com",
        employeeNumber: user.employeeNumber || "EMP001",
      };

      axios.get(`https://uaw-backend.vercel.app/api/personal-details?userId=${id}`)
        .then((r) => {
          if (r.data.success && r.data.data) {
            setEmployeeDetails({
              nationality:    r.data.data.nationality    || "INDIA",
              name:           r.data.data.fullName       || fallback.name,
              email:          r.data.data.emailId        || fallback.email,
              employeeNumber: r.data.data.employeeNumber || fallback.employeeNumber,
            });
          } else {
            setEmployeeDetails(fallback);
          }
        })
        .catch(() => setEmployeeDetails(fallback));

      axios.get(`https://uaw-backend.vercel.app/api/salary-advance/pending/${id}`)
        .then((r) => r.data.success && setHasPending(r.data.hasPending))
        .catch(() => {});

      axios.get(`https://uaw-backend.vercel.app/api/salary-advance/employee-analytics/${id}`)
        .then((r) => {
          if (r.data.success && r.data.data) {
            setIsEligible(r.data.data.salaryAdvanceEligible);
            const rem = r.data.data.salaryAdvanceRemaining;
            const tot = r.data.data.salaryAdvanceLimit || rem;
            setSalaryAdvanceRemaining(rem);
            setTotalLimit(tot);
          }
        })
        .catch(() => {});

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
      setError(""); setMessage(""); setReasonError("");

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
        setError("Enter a valid amount greater than 0.");
        return;
      }
      if (numAmount > salaryAdvanceRemaining) {
        setError("Amount exceeds your remaining advance limit.");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await axios.post("https://uaw-backend.vercel.app/api/salary-advance/request", {
          employeeId, amount: numAmount, reason: trimmedReason,
        });
        if (res.data.success) {
          setMessage("Request submitted — the finance team will review it shortly.");
          setAmount(""); setReason(""); setHasPending(true);
          refreshRequests();
          setTimeout(() => setActiveTab("history"), 1600);
        } else {
          setError(res.data.message || "Submission failed.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to submit. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    /* Loading */
    if (!employeeDetails) {
      return (
        <>
          <style>{STYLE}</style>
          <div className="saf-loading">
            <div className="saf-loading-inner">
              <div className="saf-loading-bar"><div className="saf-loading-fill" /></div>
              <p className="saf-loading-text">Loading your profile</p>
            </div>
          </div>
        </>
      );
    }

    const cfg      = getCfg(employeeDetails.nationality);
    const usedPct  = Math.min(100, Math.round(((totalLimit - salaryAdvanceRemaining) / totalLimit) * 100));
    const remPct   = 100 - usedPct;

    return (
      <>
        <style>{STYLE}</style>
        <div className="saf-root">
          <div className="saf-shell">

            {/* ── Header ── */}
            <div className="saf-header">
              <div>
                <button 
                  onClick={() => navigate(-1)} 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'transparent', border: '1px solid #E8E6E1', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#64625E', fontFamily: 'Inter, sans-serif' }}
                >
                  ← Back
                </button>
                <h1 className="saf-title saf-display">Salary Advance</h1>
                <p className="saf-subtitle">Submit and track your advance requests</p>
              </div>
              <div className="saf-employee-pill">
                <span className="saf-emp-name">{employeeDetails.name}</span>
                <span className="saf-emp-id">{employeeDetails.employeeNumber}</span>
              </div>
            </div>

         

            {/* ── Tabs ── */}
            <div className="saf-tabs">
              <button
                className={`saf-tab ${activeTab === "request" ? "active" : ""}`}
                onClick={() => setActiveTab("request")}
              >
                New Request
              </button>
              <button
                className={`saf-tab ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                History
                {requests.length > 0 && (
                  <span className="saf-tab-count">{requests.length}</span>
                )}
              </button>
            </div>

            {/* ── Request Tab ── */}
            {activeTab === "request" && (
              <>
                {!isEligible ? (
                  <div className="saf-state-screen">
                    <div className="saf-state-icon red">🛑</div>
                    <h2 className="saf-state-title saf-display">Not Eligible</h2>
                    <p className="saf-state-body">
                      You are currently not eligible to submit a salary advance request.
                      Contact HR for further assistance.
                    </p>
                    <button className="saf-state-cta" onClick={() => setActiveTab("history")}>
                      View History →
                    </button>
                  </div>
                ) : hasPending ? (
                  <div className="saf-state-screen">
                    <div className="saf-state-icon amber">⏳</div>
                    <h2 className="saf-state-title saf-display">Under Review</h2>
                    <p className="saf-state-body">
                      Your request is with the finance team. You'll be notified once a decision is made.
                    </p>
                    <button className="saf-state-cta" onClick={() => setActiveTab("history")}>
                      Track in History →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="saf-form">
                    {/* Amount */}
                    <div className="saf-field">
                      <label className="saf-label">
                        Amount <span style={{ fontSize: 11, textTransform: "none", fontWeight: 400, letterSpacing: 0, color: "#9B9793" }}>({cfg.currency})</span>
                      </label>
                      <div className="saf-amount-wrap">
                        <span className="saf-amount-symbol">{cfg.symbol}</span>
                        <input
                          type="number"
                          className="saf-amount-input"
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
                              setError("Amount exceeds your remaining advance limit.");
                              val = salaryAdvanceRemaining.toString();
                            } else {
                              setError("");
                            }
                            setAmount(val);
                          }}
                        />
                      </div>
                    </div>

                    <hr className="saf-divider" />

                    {/* Reason */}
                    <div className="saf-field">
                      <label className="saf-label">
                        Reason <span className="saf-required">*</span>
                      </label>
                      <textarea
                        className={`saf-textarea${reasonError ? " error" : ""}`}
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
                        <p className="saf-field-error">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          {reasonError}
                        </p>
                      )}
                    </div>

                    {/* Quick chips */}
                    <div className="saf-chips">
                      {QUICK_REASONS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          className={`saf-chip${reason === chip ? " selected" : ""}`}
                          onClick={() => {
                            setReason(reason === chip ? "" : chip);
                            if (chip.length >= 10) setReasonError("");
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Banners */}
                    {error && (
                      <div className="saf-banner error">
                        <svg className="saf-banner-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="saf-banner success">
                        <svg className="saf-banner-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {message}
                      </div>
                    )}

                    <button type="submit" className="saf-submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><div className="saf-spinner" /> Submitting…</>
                      ) : "Submit Request"}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ── History Tab ── */}
            {activeTab === "history" && (
              <>
                {requests.length === 0 ? (
                  <div className="saf-state-screen">
                    <div className="saf-state-icon" style={{ background: "#F0EFEC" }}>📭</div>
                    <h2 className="saf-state-title saf-display">No requests yet</h2>
                    <p className="saf-state-body">
                      Your salary advance requests will appear here once submitted.
                    </p>
                    <button className="saf-state-cta" onClick={() => setActiveTab("request")}>
                      Make a Request →
                    </button>
                  </div>
                ) : (
                  <div className="saf-history-grid">
                    {requests.map((req, idx) => {
                      const sym  = getSymbol(req.currency || cfg.currency);
                      const date = new Date(req.appliedAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      });
                      return (
                        <div key={req.requestId || idx} className="saf-history-card">
                          <div className="saf-hcard-top">
                            <div>
                              <span className="saf-hcard-amount">
                                {sym}{req.amount?.toLocaleString()}
                              </span>
                              <span className="saf-hcard-curr">{req.currency || cfg.currency}</span>
                            </div>
                            <StatusBadge status={req.status} />
                          </div>
                          <p className="saf-hcard-reason">{req.reason || "No reason provided"}</p>
                          <span className="saf-hcard-date">{date}</span>
                          {req.adminRemarks && req.status !== "PENDING" && (
                            <div className="saf-hcard-remark">
                              <strong>Admin note:</strong> {req.adminRemarks}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </>
    );
  }
