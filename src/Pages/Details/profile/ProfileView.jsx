// src/components/ProfileView.jsx
import React, { memo, useState } from "react";
import {
  User, Phone, Mail, MapPin, Briefcase, Shield, Calendar, Globe,
  Building, FileText, Lock, Clock, Eye, Award, Heart, Flag, Star,
  CheckCircle, AlertCircle, ArrowLeft, ChevronRight
} from "lucide-react";

/* ─── Google Fonts injected once ─────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .pv-root {
      min-height: 100vh;
      font-family: 'DM Sans', sans-serif;
      background: #f5f0e8;
      display: flex;
      flex-direction: column;
    }

    /* ── Topbar ─────────────────────────── */
    .pv-topbar {
      background: #1a1a2e;
      color: #e8e0d0;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      position: sticky;
      top: 0;
      z-index: 30;
    }
    .pv-back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: #c8bfaf;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
      transition: background 0.2s, color 0.2s;
      letter-spacing: 0.03em;
    }
    .pv-back-btn:hover { background: rgba(255,255,255,0.08); color: #f5f0e8; }
    .pv-status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #7dd4a0;
      background: rgba(125,212,160,0.12);
      border: 1px solid rgba(125,212,160,0.3);
      padding: 5px 14px;
      border-radius: 20px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    /* ── Body Layout ────────────────────── */
    .pv-body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    /* ── Sidebar ────────────────────────── */
    .pv-sidebar {
      width: 260px;
      min-width: 260px;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      padding: 32px 0 24px;
      position: sticky;
      top: 56px;
      height: calc(100vh - 56px);
      overflow-y: auto;
    }
    .pv-avatar-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 24px 28px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .pv-avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      overflow: hidden;
      background: linear-gradient(135deg, #e4956a 0%, #c4713a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'DM Serif Display', serif;
      font-size: 30px;
      color: #fff;
      margin-bottom: 14px;
      box-shadow: 0 0 0 3px rgba(228,149,106,0.3), 0 8px 24px rgba(0,0,0,0.4);
      flex-shrink: 0;
    }
    .pv-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .pv-avatar-name {
      font-family: 'DM Serif Display', serif;
      font-size: 17px;
      color: #f5f0e8;
      text-align: center;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .pv-avatar-role {
      font-size: 11px;
      color: #8b8099;
      text-align: center;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .pv-emp-id {
      margin-top: 10px;
      font-size: 11px;
      color: #e4956a;
      background: rgba(228,149,106,0.1);
      border: 1px solid rgba(228,149,106,0.25);
      padding: 3px 10px;
      border-radius: 12px;
      letter-spacing: 0.04em;
    }

    /* Tab nav */
    .pv-nav {
      padding: 20px 16px 0;
      flex: 1;
    }
    .pv-nav-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #5a5472;
      padding: 0 8px;
      margin-bottom: 8px;
    }
    .pv-nav-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 14px;
      border-radius: 10px;
      border: none;
      background: none;
      color: #8b8099;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      margin-bottom: 2px;
      position: relative;
    }
    .pv-nav-btn:hover { background: rgba(255,255,255,0.05); color: #d8cfc0; }
    .pv-nav-btn.active {
      background: rgba(228,149,106,0.15);
      color: #e4956a;
    }
    .pv-nav-btn.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 3px;
      background: #e4956a;
      border-radius: 0 2px 2px 0;
    }
    .pv-nav-chevron { margin-left: auto; opacity: 0.4; }

    /* ── Main Content ───────────────────── */
    .pv-main {
      flex: 1;
      padding: 36px 40px;
      overflow-y: auto;
    }

    /* Page title */
    .pv-page-title {
      font-family: 'DM Serif Display', serif;
      font-size: 32px;
      color: #1a1a2e;
      margin-bottom: 6px;
      font-style: italic;
    }
    .pv-page-sub {
      font-size: 13px;
      color: #9a8f7e;
      margin-bottom: 32px;
      letter-spacing: 0.02em;
    }

    /* Section cards */
    .pv-section {
      background: #fff;
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.04);
    }
    .pv-section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
    }
    .pv-section-icon {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: #fdf4ec;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e4956a;
      flex-shrink: 0;
    }
    .pv-section-title {
      font-family: 'DM Serif Display', serif;
      font-size: 17px;
      color: #1a1a2e;
    }
    .pv-section-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, #e8e0d0, transparent);
    }

    /* Info grid */
    .pv-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
    @media (max-width: 700px) { .pv-info-grid { grid-template-columns: 1fr; } }

    .pv-info-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px 16px;
      border-bottom: 1px solid #f3ede3;
      transition: background 0.15s;
      border-radius: 8px;
    }
    .pv-info-row:hover { background: #fdf9f4; }
    .pv-info-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #b8a898;
    }
    .pv-info-value {
      font-size: 14px;
      font-weight: 500;
      color: #2a2030;
      line-height: 1.4;
    }
    .pv-info-empty {
      font-size: 13px;
      font-style: italic;
      color: #c8bfaf;
    }

    /* Skills */
    .pv-skills-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
    .pv-skill-tag {
      background: #fdf4ec;
      color: #c4713a;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 14px;
      border-radius: 20px;
      border: 1px solid rgba(196,113,58,0.2);
      letter-spacing: 0.02em;
    }

    /* Document links */
    .pv-doc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 700px) { .pv-doc-grid { grid-template-columns: 1fr; } }
    .pv-doc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: #fdf9f4;
      border: 1px solid #ede5d8;
      border-radius: 12px;
      transition: all 0.2s;
    }
    .pv-doc-item:hover { border-color: #e4956a; background: #fdf4ec; }
    .pv-doc-label { font-size: 12px; font-weight: 600; color: #5a4a3a; letter-spacing: 0.02em; }
    .pv-doc-link {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      color: #e4956a;
      text-decoration: none;
      padding: 4px 10px;
      background: rgba(228,149,106,0.1);
      border-radius: 8px;
      transition: background 0.2s;
    }
    .pv-doc-link:hover { background: rgba(228,149,106,0.2); }
    .pv-doc-none { font-size: 12px; color: #c8bfaf; font-style: italic; }

    /* Decorative accent on sidebar bottom */
    .pv-sidebar-accent {
      padding: 20px 24px 0;
      margin-top: auto;
    }
    .pv-sidebar-accent-inner {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 16px;
      font-size: 10px;
      color: #5a5472;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  `}</style>
);

/* ─── Sub-components ──────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <div className="pv-info-row">
    <span className="pv-info-label">{label}</span>
    {value
      ? <span className="pv-info-value">{value}</span>
      : <span className="pv-info-empty">Not provided</span>}
  </div>
);

const DocumentLinkRow = ({ label, link }) => (
  <div className="pv-doc-item">
    <span className="pv-doc-label">{label}</span>
    {link
      ? <a href={link} target="_blank" rel="noopener noreferrer" className="pv-doc-link"><Eye size={13} /> View</a>
      : <span className="pv-doc-none">Not uploaded</span>}
  </div>
);

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="pv-section">
    <div className="pv-section-header">
      <div className="pv-section-icon"><Icon size={16} /></div>
      <span className="pv-section-title">{title}</span>
      <div className="pv-section-line" />
    </div>
    {children}
  </div>
);

/* ─── Tab definitions ─────────────────────────────────────────────────── */
const TABS = [
  { id: "personal",   label: "Personal",   icon: User      },
  { id: "documents",  label: "Documents",  icon: FileText  },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "bank",       label: "Bank",       icon: Building  },
];

/* ─── Main Component ──────────────────────────────────────────────────── */
const ProfileView = memo(({ data, onBackToHome }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [imgFallbackIndex, setImgFallbackIndex] = useState(0);

  const fullName = data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Employee";
  const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Extract Google Drive file ID from any Drive URL format
  const extractDriveId = (url) => {
    if (!url) return null;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]{10,})/,   // /file/d/ID/view
      /\/d\/([a-zA-Z0-9_-]{10,})\//,        // /d/ID/
      /[?&]id=([a-zA-Z0-9_-]{10,})/,        // ?id=ID
      /open\?id=([a-zA-Z0-9_-]{10,})/,      // open?id=ID
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const driveId = extractDriveId(data.profilePhotoLink);

  // Multiple URL strategies in priority order
  const imgSources = driveId ? [
    `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`,           // thumbnail API (most reliable)
    `https://drive.google.com/uc?export=view&id=${driveId}`,              // direct export
    `https://lh3.googleusercontent.com/d/${driveId}=s400`,                // lh3 CDN
  ] : (data.profilePhotoLink ? [data.profilePhotoLink] : []);

  const currentImgSrc = imgSources[imgFallbackIndex] || null;

  const handleImgError = () => {
    if (imgFallbackIndex < imgSources.length - 1) {
      setImgFallbackIndex(prev => prev + 1); // try next source
    } else {
      setImgFallbackIndex(imgSources.length); // all failed → show initials
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <>
      <FontLink />
      <div className="pv-root">

        {/* ── Top Bar ── */}
        <div className="pv-topbar">
          <button className="pv-back-btn" onClick={onBackToHome}>
            <ArrowLeft size={15} /> Back to Home
          </button>
          <div className="pv-status-badge">
            <CheckCircle size={12} /> Profile Approved
          </div>
        </div>

        <div className="pv-body">

          {/* ── Sidebar ── */}
          <aside className="pv-sidebar">
            <div className="pv-avatar-wrap">
              <div className="pv-avatar">
                {currentImgSrc && imgFallbackIndex < imgSources.length
                  ? <img
                      key={imgFallbackIndex}
                      src={currentImgSrc}
                      alt={fullName}
                      onError={handleImgError}
                      referrerPolicy="no-referrer"
                    />
                  : initials}
              </div>
              <div className="pv-avatar-name">{fullName}</div>
              <div className="pv-avatar-role">{data.jobTitle || "Employee"}</div>
              {data.employeeNumber && (
                <div className="pv-emp-id">ID · {data.employeeNumber}</div>
              )}
            </div>

            <nav className="pv-nav">
              <div className="pv-nav-label">Navigation</div>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`pv-nav-btn${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  <ChevronRight size={12} className="pv-nav-chevron" />
                </button>
              ))}
            </nav>

            <div className="pv-sidebar-accent">
              <div className="pv-sidebar-accent-inner">
                {data.assignedCompany || "Organization"}
              </div>
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="pv-main">
            <h1 className="pv-page-title">{currentTab?.label}</h1>
            <p className="pv-page-sub">
              {activeTab === "personal" && "Identity, contact, and government information"}
              {activeTab === "documents" && "Uploaded certificates and credentials"}
              {activeTab === "employment" && "Role, location, and reporting details"}
              {activeTab === "bank" && "Payroll and banking information"}
            </p>

            {/* ── PERSONAL TAB ── */}
            {activeTab === "personal" && <>
              <SectionCard icon={User} title="Personal Information">
                <div className="pv-info-grid">
                  <InfoRow label="Full Name"          value={fullName} />
                  <InfoRow label="Gender"             value={data.gender} />
                  <InfoRow label="Marital Status"     value={data.maritalStatus} />
                  <InfoRow label="Nationality"        value={data.nationality} />
                  <InfoRow label="Date of Birth"      value={fmtDate(data.dateOfBirth)} />
                  <InfoRow label="City"               value={data.city} />
                  <InfoRow label="State"              value={data.state} />
                  <InfoRow label="Current Address"    value={data.currentResidentialAddress} />
                  <InfoRow label="Permanent Address"  value={data.permanentResidentialAddress} />
                </div>
              </SectionCard>

              <SectionCard icon={Phone} title="Contact Information">
                <div className="pv-info-grid">
                  <InfoRow label="Mobile"                  value={data.mobileNumber} />
                  <InfoRow label="Emergency Number"        value={data.emergencyNumber} />
                  <InfoRow label="Emergency Relationship"  value={data.emergencyRelationship} />
                  <InfoRow label="Work Email"              value={data.emailId} />
                  <InfoRow label="Personal Email"          value={data.personalEmailId} />
                </div>
              </SectionCard>

              <SectionCard icon={Shield} title="Government IDs">
                {data.nationality === "INDIA" && <>
                  <div className="pv-info-grid">
                    <InfoRow label="Aadhaar Number" value={data.aadharNumber ? `**** **** ${data.aadharNumber.slice(-4)}` : null} />
                    <InfoRow label="PAN Number"     value={data.panNumber ? `${data.panNumber.slice(0, 5)}${"*".repeat(5)}` : null} />
                  </div>
                  <div style={{ height: 16 }} />
                  <div className="pv-doc-grid">
                    <DocumentLinkRow label="Aadhaar Document" link={data.aadharDocumentLink} />
                    <DocumentLinkRow label="PAN Document"     link={data.panDocumentLink} />
                  </div>
                </>}
                {data.nationality === "USA" && (
                  <div className="pv-info-grid">
                    <InfoRow label="SSN" value={data.ssnNumber ? `***-**-${data.ssnNumber.slice(-4)}` : null} />
                  </div>
                )}
                {data.nationality === "CHINA" && (
                  <div className="pv-info-grid">
                    <InfoRow label="National ID" value={data.nationalId} />
                  </div>
                )}
              </SectionCard>

              <SectionCard icon={Star} title="Skills">
                <div className="pv-skills-wrap">
                  {(data.skills || []).length > 0
                    ? (data.skills).map((s, i) => <span key={i} className="pv-skill-tag">{s}</span>)
                    : <span className="pv-info-empty">No skills added</span>}
                </div>
              </SectionCard>
            </>}

            {/* ── DOCUMENTS TAB ── */}
            {activeTab === "documents" && (
              <SectionCard icon={FileText} title="Educational & Professional Documents">
                <div className="pv-doc-grid">
                  <DocumentLinkRow label="10th Certificate"            link={data.tenthCertificateLink} />
                  <DocumentLinkRow label="12th / PUC Certificate"      link={data.twelfthCertificateLink} />
                  <DocumentLinkRow label="Graduation Certificate"      link={data.graduationCertificateLink} />
                  <DocumentLinkRow label="Post Graduation Certificate" link={data.postGraduationCertificateLink} />
                  <DocumentLinkRow label="Resume / CV"                 link={data.resumeDocumentLink} />
                  <DocumentLinkRow label="Visa Document"               link={data.visaDocumentLink} />
                </div>
              </SectionCard>
            )}

            {/* ── EMPLOYMENT TAB ── */}
            {activeTab === "employment" && (
              <SectionCard icon={Briefcase} title="Employment Details">
                <div className="pv-info-grid">
                  <InfoRow label="Job Title"        value={data.jobTitle} />
                  <InfoRow label="Employee Number"  value={data.employeeNumber} />
                  <InfoRow label="Company"          value={data.assignedCompany} />
                  <InfoRow label="Work Location"    value={data.employmentLocation} />
                  <InfoRow label="Start Date"       value={fmtDate(data.employmentStartDate)} />
                  <InfoRow label="Supervisor"       value={data.supervisor} />
                  <InfoRow label="HR Manager"       value={data.hr} />
                  <InfoRow label="Visa Type"        value={data.visaType} />
                  <InfoRow label="Visa End Date"    value={fmtDate(data.visaEndDate)} />
                </div>
              </SectionCard>
            )}

            {/* ── BANK TAB ── */}
            {activeTab === "bank" && (
              <SectionCard icon={Building} title="Bank Details">
                <div className="pv-info-grid">
                  <InfoRow label="Bank Name"       value={data.bankName} />
                  <InfoRow label="Branch"          value={data.bankBranch} />
                  <InfoRow label="Account Number"  value={data.bankAccountNumber ? `****${data.bankAccountNumber.slice(-4)}` : null} />
                  <InfoRow label="IFSC Code"       value={data.ifscCode} />
                </div>
              </SectionCard>
            )}
          </main>
        </div>
      </div>
    </>
  );
});

export default ProfileView;