import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Cake, Gift, Calendar, UserCircle, Loader2, AlertCircle,
  Clock, Users, Mail, X, Send, ChevronDown, CheckSquare,
  Square, Check, AlertTriangle
} from 'lucide-react';
import Navbar from '../../components/Header';

// ─── Birthday Templates ─────────────────────────────────────────────────────
const TEMPLATES = {
  professional: {
    label: 'Professional Birthday Wish',
    subject: '🎂 Happy Birthday {name}!',
    message:
      'Dear {name},\n\nWishing you a wonderful birthday and continued success in the year ahead. Your dedication and contributions are truly valued.\n\nWarm regards,\nHR Team',
  },
  friendly: {
    label: 'Friendly Birthday Wish',
    subject: '🎉 Happy Birthday {name}!',
    message:
      'Hey {name}! 🎉\n\nMay your special day be filled with happiness, laughter, and memorable moments. Enjoy your day to the fullest!\n\nCheers,\nHR Team',
  },
  team: {
    label: 'Team Celebration Wish',
    subject: '🎁 Happy Birthday from the Team!',
    message:
      'Dear {name},\n\nThe entire team wishes you a fantastic birthday and an amazing year ahead! We are grateful to have you as part of our team.\n\nBest wishes,\nThe Team',
  },
  custom: {
    label: 'Custom Message',
    subject: '',
    message: '',
  },
};

// ─── Send Wishes Modal ──────────────────────────────────────────────────────
const SendWishesModal = ({ employee, onClose, onSuccess }) => {
  const [template, setTemplate] = useState('professional');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendToEmployee, setSendToEmployee] = useState(true);
  const [sendToAllEmployees, setSendToAllEmployees] = useState(false);
  const [sendToManager, setSendToManager] = useState(false);
  const [sendToHRTeam, setSendToHRTeam] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { type: 'success'|'error', message }
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const name = employee?.fullName || '';

  // Initialize subject and message from template
  useEffect(() => {
    const t = TEMPLATES[template];
    if (template === 'custom') {
      // Don't overwrite custom edits
      if (!subject) setSubject(`🎂 Happy Birthday ${name}!`);
    } else {
      setSubject(t.subject.replace('{name}', name));
      setMessage(t.message.replace(/{name}/g, name));
    }
  }, [template, name]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setSendResult({ type: 'error', message: 'Subject and message are required.' });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const ccArr = ccInput.split(',').map(e => e.trim()).filter(Boolean);
      const bccArr = bccInput.split(',').map(e => e.trim()).filter(Boolean);

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        birthdayEmployeeId: employee.employeeNumber,
        template,
        subject,
        message,
        sendToEmployee,
        sendToAllEmployees,
        sendToManager,
        sendToHRTeam,
        cc: ccArr,
        bcc: bccArr,
        sentBy: user.name || user.username || 'Admin',
      };

      const res = await axios.post('http://localhost:5000/api/birthday/send-wishes', payload);

      if (res.data.success) {
        setSendResult({ type: 'success', message: res.data.message });
        if (onSuccess) onSuccess();
      } else {
        setSendResult({ type: 'error', message: res.data.message || 'Failed to send.' });
      }
    } catch (err) {
      console.error('Error sending wishes:', err);
      setSendResult({
        type: 'error',
        message: err.response?.data?.message || 'An error occurred while sending the email.',
      });
    } finally {
      setSending(false);
    }
  };

  const Checkbox = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-2.5 cursor-pointer group select-none py-1.5">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-[18px] h-[18px] rounded flex items-center justify-center border transition-all duration-150 flex-shrink-0 ${
          checked
            ? 'bg-blue-600 border-blue-600'
            : 'bg-white border-slate-300 group-hover:border-slate-400'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>
      <span className="text-sm text-slate-700 font-medium">{label}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Mail className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Send Birthday Wishes</h2>
              <p className="text-xs text-slate-500 mt-0.5">To: {employee.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4.5 h-4.5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: 'thin' }}>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Template
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 hover:border-slate-300 transition-colors"
              >
                <span className="font-medium">{TEMPLATES[template].label}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTemplateDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 overflow-hidden">
                  {Object.entries(TEMPLATES).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => { setTemplate(key); setShowTemplateDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                        template === key ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      {template === key && <Check className="w-3.5 h-3.5" />}
                      <span className={template === key ? '' : 'ml-5.5'}>{val.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your birthday message..."
              rows={6}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Recipient Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Recipients
            </label>
            <div className="bg-slate-50 rounded-lg border border-slate-100 p-3.5 space-y-0.5">
              <Checkbox
                checked={sendToEmployee}
                onChange={setSendToEmployee}
                label={`Send to Birthday Employee${employee.emailId ? ` (${employee.emailId})` : ''}`}
              />
              <Checkbox
                checked={sendToAllEmployees}
                onChange={setSendToAllEmployees}
                label="Send to All Employees (via BCC)"
              />
              <Checkbox
                checked={sendToManager}
                onChange={setSendToManager}
                label={`Send to Reporting Manager${employee.supervisor ? ` (${employee.supervisor})` : ''}`}
              />
              <Checkbox
                checked={sendToHRTeam}
                onChange={setSendToHRTeam}
                label="Send to HR Team"
              />
            </div>
          </div>

          {/* CC / BCC Manual Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                CC <span className="text-slate-400 font-normal normal-case">(comma separated)</span>
              </label>
              <input
                type="text"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                placeholder="email1@example.com, ..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                BCC <span className="text-slate-400 font-normal normal-case">(comma separated)</span>
              </label>
              <input
                type="text"
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                placeholder="email1@example.com, ..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Result Messages */}
          {sendResult && (
            <div className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-sm font-medium ${
              sendResult.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {sendResult.type === 'success'
                ? <Check className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              }
              <span>{sendResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sendResult?.type === 'success' ? 'Close' : 'Cancel'}
          </button>
          {sendResult?.type !== 'success' && (
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !message.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Wishes
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const Birthdaywishes = () => {
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishModal, setWishModal] = useState(null); // employee object or null

  // Role detection (same pattern as Home.jsx)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/personal-details/birthdays');
      if (response.data.success) {
        setTodayBirthdays(response.data.todayBirthdays || []);
        setUpcomingBirthdays(response.data.upcomingBirthdays || []);
      } else {
        setError('Failed to load birthdays');
      }
    } catch (err) {
      console.error('Error fetching birthdays:', err);
      setError('An error occurred while fetching birthdays');
    } finally {
      setLoading(false);
    }
  };

  const getDaysText = (daysRemaining) => {
    if (daysRemaining === 1) return 'Tomorrow';
    return `In ${daysRemaining} Days`;
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
      /\/d\/([a-zA-Z0-9_-]{10,})\//,
      /[?&]id=([a-zA-Z0-9_-]{10,})/,
      /open\?id=([a-zA-Z0-9_-]{10,})/,
    ];
    let driveId = null;
    for (const p of patterns) {
      const m = url.match(p);
      if (m) {
        driveId = m[1];
        break;
      }
    }
    if (driveId) {
      return `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
    }
    return url;
  };

  // Helper component for fallback images
  const ProfileImage = ({ src, alt, className, iconClassName }) => {
    const [imgError, setImgError] = useState(false);
    const resolvedSrc = getImageUrl(src);

    if (!resolvedSrc || imgError) {
      return (
        <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 ${className}`}>
          <UserCircle className={iconClassName || "w-1/2 h-1/2 text-slate-300"} />
        </div>
      );
    }

    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={`object-cover ${className}`}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#f4f6f9]">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
            <span className="text-sm text-slate-500 font-medium">Loading birthdays...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-[#f4f6f9]">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="bg-white text-red-600 p-5 rounded-xl shadow-sm border border-red-100 flex items-center gap-3 max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      <Navbar />

      {/* Send Wishes Modal */}
      {wishModal && (
        <SendWishesModal
          employee={wishModal}
          onClose={() => setWishModal(null)}
          onSuccess={() => {}}
        />
      )}

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Cake className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">Birthday Wishes</h1>
              <p className="text-sm text-slate-500 mt-0.5">Celebrate your team members' special days</p>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200/80 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Cake className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 leading-none">{todayBirthdays.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Today's Birthdays</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 leading-none">{upcomingBirthdays.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Upcoming (30 Days)</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 leading-none">{todayBirthdays.length + upcomingBirthdays.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Total Celebrations</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">

          {/* ── Section: Today's Birthdays ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Today's Birthdays
              </h2>
              {todayBirthdays.length > 0 && (
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                  {todayBirthdays.length} {todayBirthdays.length === 1 ? 'person' : 'people'}
                </span>
              )}
            </div>

            {todayBirthdays.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Calendar className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No birthdays today</p>
                <p className="text-xs text-slate-400 mt-1">Check back tomorrow!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {todayBirthdays.map((employee, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-200 group"
                  >
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500"></div>

                    <div className="p-5 flex flex-col items-center text-center">
                      {/* Avatar */}
                      <div className="relative mb-4">
                        <div className="ring-2 ring-blue-100 ring-offset-2 rounded-full group-hover:ring-blue-200 transition-all duration-200">
                          <ProfileImage
                            src={employee.profilePhotoLink}
                            alt={employee.fullName}
                            className="w-20 h-20 rounded-full"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                          <Cake className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="text-base font-semibold text-slate-800 leading-snug">{employee.fullName}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{employee.jobTitle}</p>

                      {/* Badge + Send Wishes */}
                      <div className="mt-3 flex flex-col items-center gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-emerald-100">
                            🎂 Today
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ID: {employee.employeeNumber}
                          </span>
                        </div>

                        {/* Send Wishes Button — Admin Only */}
                        {isAdmin && (
                          <button
                            onClick={() => setWishModal(employee)}
                            className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full justify-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send Wishes
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Section: Upcoming Birthdays ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-blue-600" />
                </div>
                Upcoming Birthdays
              </h2>
              {upcomingBirthdays.length > 0 && (
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                  {upcomingBirthdays.length} upcoming
                </span>
              )}
            </div>

            {upcomingBirthdays.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Gift className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No upcoming birthdays</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="hidden sm:grid sm:grid-cols-[auto_1fr_1fr_120px_100px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="w-10"></span>
                  <span>Employee</span>
                  <span>Job Title</span>
                  <span>Birthday In</span>
                  <span>Employee ID</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {upcomingBirthdays.map((employee, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_120px_100px] gap-3 sm:gap-4 items-center px-5 py-3.5 hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Avatar */}
                      <div className="hidden sm:block">
                        <ProfileImage
                          src={employee.profilePhotoLink}
                          alt={employee.fullName}
                          className="w-10 h-10 rounded-lg"
                        />
                      </div>

                      {/* Name - mobile shows full card, desktop shows inline */}
                      <div className="flex items-center gap-3 sm:gap-0">
                        <div className="sm:hidden">
                          <ProfileImage
                            src={employee.profilePhotoLink}
                            alt={employee.fullName}
                            className="w-12 h-12 rounded-lg"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-800 truncate" title={employee.fullName}>
                            {employee.fullName}
                          </h3>
                          <p className="sm:hidden text-xs text-slate-500 mt-0.5">{employee.jobTitle}</p>
                          <div className="sm:hidden mt-1.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">
                              <Clock className="w-3 h-3" />
                              {getDaysText(employee.daysRemaining)}
                            </span>
                            <span className="text-[10px] text-slate-400">#{employee.employeeNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Job Title - desktop */}
                      <p className="hidden sm:block text-sm text-slate-600 truncate" title={employee.jobTitle}>
                        {employee.jobTitle}
                      </p>

                      {/* Days remaining - desktop */}
                      <div className="hidden sm:block">
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-100">
                          <Clock className="w-3.5 h-3.5" />
                          {getDaysText(employee.daysRemaining)}
                        </span>
                      </div>

                      {/* Employee ID - desktop */}
                      <span className="hidden sm:block text-xs text-slate-400 font-medium">
                        #{employee.employeeNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default Birthdaywishes;