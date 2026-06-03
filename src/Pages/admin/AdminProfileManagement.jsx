// src/pages/Admin/AdminProfileManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Eye, CheckCircle, XCircle, Clock,
  Users, FileText, X, RefreshCw, User,
  Phone, Mail, MapPin, Briefcase, Calendar, Globe, Building2,
  CreditCard, Lock, Link as LinkIcon, AlertCircle
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useCompany } from '../../context/CompanyContext';

// ─── Extract Google Drive file ID from any Drive URL format ──────────────────
const extractDriveId = (url) => {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,  // /file/d/ID/view
    /\/d\/([a-zA-Z0-9_-]{10,})\//,       // /d/ID/
    /[?&]id=([a-zA-Z0-9_-]{10,})/,       // ?id=ID
    /open\?id=([a-zA-Z0-9_-]{10,})/,     // open?id=ID
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// Returns array of image URLs to try in priority order
const getDriveImageSources = (url) => {
  if (!url) return [];
  const id = extractDriveId(url);
  if (!id) return [url]; // Not a Drive URL — use as-is
  return [
    `https://drive.google.com/thumbnail?id=${id}&sz=w400`, // Most reliable, no CORS
    `https://drive.google.com/uc?export=view&id=${id}`,    // Direct export
    `https://lh3.googleusercontent.com/d/${id}=s400`,      // CDN fallback
  ];
};

// ─── Reusable avatar that auto-tries all Drive URL fallbacks ─────────────────
const DriveAvatar = ({ photoLink, fallbackInitial, imgClassName = "", wrapClassName = "", fallbackClassName = "" }) => {
  const sources = getDriveImageSources(photoLink);
  const [idx, setIdx] = useState(0);
  const showImg = sources.length > 0 && idx < sources.length;

  // Reset index when photoLink changes (different profile opened)
  useEffect(() => { setIdx(0); }, [photoLink]);

  if (showImg) {
    return (
      <img
        key={idx}
        src={sources[idx]}
        alt="Profile"
        referrerPolicy="no-referrer"
        className={imgClassName}
        onError={() => setIdx(i => i + 1)}
      />
    );
  }

  // All sources failed or no photo — show initials
  return (
    <span className={fallbackClassName}>
      {fallbackInitial}
    </span>
  );
};

const AdminProfileManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const { availableCompanies: companies, companiesLoading } = useCompany();

  const computeCompletion = (data) => {
    if (!data) return 0;
    let fields = [
      "firstName", "lastName", "gender", "dateOfBirth", "mobileNumber",
      "emailId", "personalEmailId", "emergencyNumber", "city", "state",
      "currentResidentialAddress", "permanentResidentialAddress",
      "nationality", "maritalStatus", "employeeNumber",
      "bankName", "bankAccountNumber", "ifscCode", "bankBranch"
    ];
    if (data.nationality === "INDIA") fields.push("aadharNumber", "panNumber");
    else if (data.nationality === "USA") fields.push("ssnNumber");
    else if (data.nationality === "CHINA") fields.push("nationalId");

    let filled = fields.filter(f => data[f] && String(data[f]).trim() !== "").length;
    let extraRequired = 6;
    let extraFilled = 0;
    const emergencyRel = data.emergencyContactRelationship || data.emergencyRelationship;
    if (emergencyRel) extraFilled++;
    if (data.tenthCertificateLink) extraFilled++;
    if (data.twelfthCertificateLink) extraFilled++;
    if (data.resumeDocumentLink) extraFilled++;
    if (data.profilePhotoLink) extraFilled++;
    if (data.graduationCertificateLink) extraFilled++;
    if (data.nationality === "INDIA") {
      extraRequired += 2;
      if (data.aadharDocumentLink) extraFilled++;
      if (data.panDocumentLink) extraFilled++;
    }
    return Math.round(((filled + extraFilled) / (fields.length + extraRequired)) * 100);
  };

  const getMissingFields = (data) => {
    if (!data) return [];
    const missing = [];
    const fieldLabels = {
      firstName: "First Name", lastName: "Last Name", gender: "Gender",
      dateOfBirth: "Date of Birth", mobileNumber: "Mobile Number",
      emailId: "Work Email", personalEmailId: "Personal Email",
      emergencyNumber: "Emergency Number", city: "City", state: "State",
      currentResidentialAddress: "Current Residential Address",
      permanentResidentialAddress: "Permanent Residential Address",
      nationality: "Nationality", maritalStatus: "Marital Status",
      employeeNumber: "Employee Number", bankName: "Bank Name",
      bankAccountNumber: "Bank Account Number", ifscCode: "IFSC Code", bankBranch: "Bank Branch"
    };
    Object.keys(fieldLabels).forEach(key => {
      if (!data[key] || String(data[key]).trim() === "") missing.push(fieldLabels[key]);
    });
    const emergencyRel = data.emergencyContactRelationship || data.emergencyRelationship;
    if (!emergencyRel) missing.push("Emergency Contact Relationship");
    if (!data.tenthCertificateLink) missing.push("10th Mark Certificate");
    if (!data.twelfthCertificateLink) missing.push("12th / PUC Certificate");
    if (!data.resumeDocumentLink) missing.push("Resume / CV");
    if (!data.profilePhotoLink) missing.push("Profile Photo");
    if (!data.graduationCertificateLink) missing.push("Graduation Certificate");
    if (data.nationality === "INDIA") {
      if (!data.aadharNumber || String(data.aadharNumber).trim() === "") missing.push("Aadhaar Number");
      if (!data.panNumber || String(data.panNumber).trim() === "") missing.push("PAN Number");
      if (!data.aadharDocumentLink) missing.push("Aadhaar Document");
      if (!data.panDocumentLink) missing.push("PAN Card Document");
    } else if (data.nationality === "USA") {
      if (!data.ssnNumber || String(data.ssnNumber).trim() === "") missing.push("SSN Number");
    } else if (data.nationality === "CHINA") {
      if (!data.nationalId || String(data.nationalId).trim() === "") missing.push("National ID");
    }
    return missing;
  };

  const API_BASE = "http://localhost:5000/api/profile-approval";
  const PERSONAL_API = "http://localhost:5000/api/personal-details";

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/profiles`);
      const data = await response.json();
      if (data.success) {
        const mappedProfiles = data.data.map(profile => ({
          ...profile,
          approvalStatus: profile.profileStatus || profile.approvalStatus
        }));
        setProfiles(mappedProfiles);
        setFilteredProfiles(mappedProfiles);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/stats`);
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    const role = currentUser?.role || JSON.parse(localStorage.getItem('user') || '{}').role;
    if (role !== 'Admin') { navigate('/home'); return; }
    fetchProfiles();
    fetchStats();
  }, [currentUser]);

  useEffect(() => {
    let filtered = [...profiles];
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.pid?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'ALL') filtered = filtered.filter(p => p.approvalStatus === statusFilter);
    setFilteredProfiles(filtered);
  }, [searchTerm, statusFilter, profiles]);

  const viewProfile = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/profile/${userId}`);
      const data = await response.json();
      if (data.success) {
        const profileData = data.data;
        if (!profileData.emergencyContactRelationship && profileData.emergencyRelationship) {
          profileData.emergencyContactRelationship = profileData.emergencyRelationship;
        }
        setSelectedProfile(profileData);
        setEditForm(profileData);
        setIsEditing(false);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error("Error fetching profile details:", error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        emergencyRelationship: editForm.emergencyContactRelationship || editForm.emergencyRelationship,
        supervisor: editForm.supervisor || '',
        hr: editForm.hr || '',
        employmentLocation: editForm.employmentLocation || '',
        jobTitle: editForm.jobTitle || '',
        isAdmin: true
      };
      const response = await fetch(`${PERSONAL_API}/${selectedProfile.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setSelectedProfile(data.data);
        setIsEditing(false);
        await fetchProfiles();
        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label, key, type = "text", editable = true, options = []) => {
    let value = selectedProfile[key] || '';
    if (key === "emergencyContactRelationship") {
      value = selectedProfile.emergencyContactRelationship || selectedProfile.emergencyRelationship || '';
    }
    let isRequired = [
      "firstName", "lastName", "gender", "dateOfBirth", "mobileNumber",
      "emailId", "personalEmailId", "emergencyNumber", "emergencyContactRelationship", "city", "state",
      "currentResidentialAddress", "permanentResidentialAddress", "nationality", "maritalStatus", "employeeNumber"
    ].includes(key);
    if (selectedProfile.nationality === "INDIA" && (key === "aadharNumber" || key === "panNumber")) isRequired = true;
    if (selectedProfile.nationality === "USA" && key === "ssnNumber") isRequired = true;
    if (selectedProfile.nationality === "CHINA" && key === "nationalId") isRequired = true;
    const isMissing = isRequired && (!value || String(value).trim() === "");

    if (!isEditing) {
      return (
        <div className="mb-2">
          <span className="text-xs text-gray-500 inline-block w-44">{label}:</span>
          <span className={`text-sm font-medium ${isMissing ? 'text-red-500 flex items-center gap-1 inline-flex' : 'text-gray-800'}`}>
            {isMissing && <AlertCircle size={12} />}
            {value || (isMissing ? 'Missing Required Field' : 'N/A')}
          </span>
        </div>
      );
    }

    if (type === "select" && options.length) {
      return (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <select value={editForm[key] || ''} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200">
            <option value="">Select {label}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }
    if (type === "date") {
      return (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <input type="date" value={editForm[key] ? (editForm[key].split('T')[0] || editForm[key]) : ''}
            onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500" />
        </div>
      );
    }
    return (
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <input type={type} value={editForm[key] || ''} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500" />
      </div>
    );
  };

  const renderDocumentLink = (label, link, key = null) => {
    const isRequired = selectedProfile?.nationality === "INDIA" &&
      (key === 'aadharDocumentLink' || key === 'panDocumentLink');
    if (!link) {
      if (isRequired) {
        return (
          <div className="mb-2">
            <span className="text-xs text-gray-500 inline-block w-36">{label}:</span>
            <span className="text-sm font-medium text-red-500 flex items-center gap-1 inline-flex">
              <AlertCircle size={12} /> Missing Document
            </span>
          </div>
        );
      }
      return null;
    }
    return (
      <div className="mb-2">
        <span className="text-xs text-gray-500 inline-block w-36">{label}:</span>
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center gap-1 inline-flex font-medium">
          <CheckCircle size={14} /> View Document
        </a>
      </div>
    );
  };

  const approveProfile = async (userId) => {
    if (!window.confirm("Are you sure you want to approve this profile?")) return;
    try {
      const response = await fetch(`${API_BASE}/admin/approve/${userId}`, { method: 'PUT' });
      const data = await response.json();
      if (data.success) {
        await fetchProfiles(); await fetchStats();
        if (showProfileModal) setShowProfileModal(false);
        alert("Profile approved successfully!");
      }
    } catch (error) { alert("Failed to approve profile"); }
  };

  const rejectProfile = async () => {
    if (!rejectionReason.trim()) { alert("Please provide a rejection reason"); return; }
    try {
      const response = await fetch(`${API_BASE}/admin/reject/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason })
      });
      const data = await response.json();
      if (data.success) {
        setShowRejectModal(false); setRejectionReason(''); setSelectedUserId(null);
        await fetchProfiles(); await fetchStats();
        if (showProfileModal) setShowProfileModal(false);
        alert("Profile rejected successfully!");
      }
    } catch (error) { alert("Failed to reject profile"); }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING:  { color: 'bg-yellow-100 text-yellow-800', icon: Clock,         text: 'Pending'  },
      APPROVED: { color: 'bg-green-100 text-green-800',   icon: CheckCircle,   text: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800',       icon: XCircle,       text: 'Rejected' }
    };
    const c = config[status] || config.PENDING;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        <Icon size={12} />{c.text}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all border border-gray-200">
              ← Back to Home
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                Profile Management
                {stats.pending > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold border border-yellow-200">
                    {stats.pending} pending
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Review and manage employee profile submissions</p>
            </div>
          </div>
          <button onClick={() => { fetchProfiles(); fetchStats(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all border border-gray-200">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Profiles" value={stats.total || (stats.pending + stats.approved + stats.rejected)} icon={Users} color="bg-blue-600" />
          <StatCard title="Pending"  value={stats.pending}  icon={Clock}        color="bg-yellow-500" />
          <StatCard title="Approved" value={stats.approved} icon={CheckCircle}  color="bg-green-500"  />
          <StatCard title="Rejected" value={stats.rejected} icon={XCircle}      color="bg-red-500"    />
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search by name, email, ID..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800">Clear Filters</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* ── Table row avatar ── */}
                        <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                          <DriveAvatar
                            photoLink={profile.profilePhotoLink}
                            fallbackInitial={profile.fullName?.charAt(0) || profile.firstName?.charAt(0) || 'U'}
                            imgClassName="w-full h-full object-cover"
                            fallbackClassName="text-sm font-bold text-blue-600"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{profile.fullName}</p>
                          <p className="text-sm text-gray-500">{profile.emailId || profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {profile.submissionDate
                        ? new Date(profile.submissionDate).toLocaleDateString()
                        : profile.profileSubmittedAt
                          ? new Date(profile.profileSubmittedAt).toLocaleDateString()
                          : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(profile.approvalStatus)}
                        {profile.approvalStatus === 'PENDING' && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${computeCompletion(profile) < 100 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                            {computeCompletion(profile)}% Complete
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => viewProfile(profile.userId)} className="text-blue-600 hover:text-blue-800 mr-3" title="View Details">
                        <Eye size={18} />
                      </button>
                      {profile.approvalStatus === 'PENDING' && (<>
                        <button onClick={() => approveProfile(profile.userId)}
                          disabled={computeCompletion(profile) < 100}
                          className={`mr-3 ${computeCompletion(profile) < 100 ? 'text-gray-300 cursor-not-allowed opacity-50' : 'text-green-600 hover:text-green-800'}`}
                          title={computeCompletion(profile) < 100 ? "Profile incomplete" : "Approve"}>
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => { setSelectedUserId(profile.userId); setShowRejectModal(true); }}
                          className="text-red-600 hover:text-red-800" title="Reject">
                          <XCircle size={18} />
                        </button>
                      </>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProfiles.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No profiles found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Profile Details Modal ── */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">Profile Details</h2>
              <div className="flex items-center gap-4">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
                    Edit Profile
                  </button>
                ) : (<>
                  <button onClick={() => { setIsEditing(false); setEditForm(selectedProfile); }}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-1.5">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>)}
                <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600 ml-2">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* ── Profile Header with DriveAvatar ── */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  {/* Avatar wrapper — fixed 64×64, overflow hidden so img fills it */}
                  <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    <DriveAvatar
                      photoLink={selectedProfile.profilePhotoLink}
                      fallbackInitial={selectedProfile.fullName?.charAt(0) || selectedProfile.firstName?.charAt(0) || 'U'}
                      imgClassName="w-full h-full object-cover"
                      fallbackClassName="text-xl font-bold text-blue-600"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedProfile.fullName || `${selectedProfile.firstName} ${selectedProfile.lastName}`}
                    </h3>
                    {selectedProfile.employeeNumber && (
                      <p className="text-sm text-gray-600 mt-1"><strong>Emp No:</strong> {selectedProfile.employeeNumber}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      {getStatusBadge(selectedProfile.approvalStatus)}
                      <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                        Completion: {computeCompletion(selectedProfile)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection banner */}
              {selectedProfile.approvalStatus === 'REJECTED' && selectedProfile.rejectionReason && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <XCircle size={16} className="text-red-500 shrink-0" /> Profile Rejected
                  </div>
                  <p className="text-sm text-red-600/90 font-medium">Reason: {selectedProfile.rejectionReason}</p>
                </div>
              )}

              {/* Personal + Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><User size={16} /> Personal Information</h4>
                  {renderField("First Name", "firstName")}
                  {renderField("Middle Name", "middleName")}
                  {renderField("Last Name", "lastName")}
                  {renderField("Date of Birth", "dateOfBirth", "date")}
                  {renderField("Gender", "gender", "select", true, ["Male", "Female", "Other", "Prefer not to say"])}
                  {renderField("Marital Status", "maritalStatus", "select", true, ["Single", "Married", "Divorced", "Widowed", "Separated"])}
                  {renderField("Nationality", "nationality", "select", true, ["INDIA", "USA", "CHINA"])}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Phone size={16} /> Contact Information</h4>
                  {renderField("Mobile Number", "mobileNumber")}
                  {renderField("Emergency Number", "emergencyNumber")}
                  {renderField("Emergency Relationship", "emergencyContactRelationship")}
                  {renderField("Work Email", "emailId", "email")}
                  {renderField("Personal Email", "personalEmailId", "email")}
                  {renderField("City", "city")}
                  {renderField("State", "state")}
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><MapPin size={16} /> Address</h4>
                {renderField("Current Residential Address", "currentResidentialAddress")}
                {renderField("Permanent Residential Address", "permanentResidentialAddress")}
              </div>

              {/* Gov IDs */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CreditCard size={16} /> Government IDs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProfile.nationality === "INDIA" && (<>
                    <div>
                      {renderField("Aadhaar Number", "aadharNumber")}
                      {renderDocumentLink("Aadhaar Document", selectedProfile.aadharDocumentLink, "aadharDocumentLink")}
                    </div>
                    <div>
                      {renderField("PAN Number", "panNumber")}
                      {renderDocumentLink("PAN Card", selectedProfile.panDocumentLink, "panDocumentLink")}
                    </div>
                  </>)}
                  {selectedProfile.nationality === "USA" && <div>{renderField("SSN", "ssnNumber")}</div>}
                  {selectedProfile.nationality === "CHINA" && <div>{renderField("National ID", "nationalId")}</div>}
                </div>
              </div>

              {/* Employment */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Briefcase size={16} /> Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {renderField("Job Title", "jobTitle")}
                    {renderField("Employee Number", "employeeNumber")}
                    {renderField("Assigned Company", "assignedCompany", "select", true, companies?.map(c => c.name) || [])}
                    {renderField("Work Location", "employmentLocation")}
                  </div>
                  <div>
                    {renderField("Start Date", "employmentStartDate", "date")}
                    {renderField("Supervisor", "supervisor")}
                    {renderField("HR Manager", "hr")}
                    {renderField("Visa Type", "visaType", "select", true, ["H-1B", "L-1", "F-1 OPT", "O-1", "TN", "Work Permit", "Permanent Resident", "Citizen / No Visa Required", "Other"])}
                    {renderField("Visa End Date", "visaEndDate", "date")}
                  </div>
                </div>
              </div>

              {/* Bank */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CreditCard size={16} /> Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {renderField("Bank Name", "bankName")}
                    {renderField("Bank Branch", "bankBranch")}
                  </div>
                  <div>
                    {renderField("Bank Account Number", "bankAccountNumber")}
                    {renderField("IFSC Code", "ifscCode")}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Briefcase size={16} /> Skills & Expertise</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  {selectedProfile.skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.skills.map((skill, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-md border border-blue-200 shadow-sm">{skill}</span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-500">No skills provided.</p>}
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileText size={16} /> Educational & Professional Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div>
                    {renderDocumentLink("10th Mark Certificate", selectedProfile.tenthCertificateLink)}
                    {renderDocumentLink("12th / PUC Certificate", selectedProfile.twelfthCertificateLink)}
                    {renderDocumentLink("Resume / CV", selectedProfile.resumeDocumentLink)}
                    {renderDocumentLink("Profile Photo", selectedProfile.profilePhotoLink)}
                  </div>
                  <div>
                    {renderDocumentLink("Graduation Certificate", selectedProfile.graduationCertificateLink)}
                    {renderDocumentLink("Post Graduation Certificate", selectedProfile.postGraduationCertificateLink)}
                    {renderDocumentLink("Visa Document", selectedProfile.visaDocumentLink)}
                  </div>
                </div>
              </div>

              {/* Approve / Reject */}
              {selectedProfile.approvalStatus === 'PENDING' && !isEditing && (
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                  {computeCompletion(selectedProfile) < 100 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex flex-col gap-2 mb-4 shadow-sm">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle size={16} className="text-red-500 shrink-0" /> Profile Cannot Be Approved
                      </div>
                      <p className="text-xs text-red-600/90 font-medium">The following required fields or documents are missing:</p>
                      <ul className="list-disc pl-5 text-xs space-y-1 text-red-600/90">
                        {getMissingFields(selectedProfile).map((field, idx) => <li key={idx}>{field}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => approveProfile(selectedProfile.userId)}
                      disabled={computeCompletion(selectedProfile) < 100}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all">
                      <CheckCircle size={18} /> Approve Profile
                    </button>
                    <button onClick={() => { setSelectedUserId(selectedProfile.userId); setShowProfileModal(false); setShowRejectModal(true); }}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all">
                      <XCircle size={18} /> Reject Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full"><XCircle className="text-red-600" size={24} /></div>
              <h3 className="text-lg font-semibold">Reject Profile</h3>
            </div>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this profile:</p>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
              rows={4} placeholder="Enter rejection reason..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); setSelectedUserId(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={rejectProfile}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfileManagement;