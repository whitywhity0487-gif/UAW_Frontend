// src/components/ProfileView.jsx
import React, { memo, useState } from "react";
import {
  User, Phone, FileText, Briefcase, Shield, Star,
  Building, Lock, Eye, CheckCircle, ArrowLeft, ChevronRight
} from "lucide-react";
import Button from "../../../components/Button";

/* ─── Sub-components ──────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 px-4 py-3.5 border-b border-[#f3ede3] rounded-lg hover:bg-[#fdf9f4] transition-colors duration-150">
    <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#b8a898]">
      {label}
    </span>
    {value
      ? <span className="text-sm font-medium text-[#2a2030] leading-snug">{value}</span>
      : <span className="text-sm italic text-[#c8bfaf]">Not provided</span>}
  </div>
);

const DocumentLinkRow = ({ label, link }) => (
  <div className="flex items-center justify-between px-[18px] py-3.5 bg-[#fdf9f4] border border-[#ede5d8] rounded-xl hover:border-[#e4956a] hover:bg-[#fdf4ec] transition-all duration-200">
    <span className="text-xs font-semibold text-[#5a4a3a] tracking-wide">{label}</span>
    {link
      ? <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#e4956a] px-2.5 py-1 bg-[rgba(228,149,106,0.10)] rounded-lg hover:bg-[rgba(228,149,106,0.20)] transition-colors no-underline"
        >
          <Eye size={13} /> View
        </a>
      : <span className="text-xs italic text-[#c8bfaf]">Not uploaded</span>}
  </div>
);

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl px-8 py-7 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] border border-black/[0.04]">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-[34px] h-[34px] rounded-[9px] bg-[#fdf4ec] flex items-center justify-center text-[#e4956a] shrink-0">
        <Icon size={16} />
      </div>
      <span className="text-[17px] text-[#1a1a2e] font-semibold">{title}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-[#e8e0d0] to-transparent" />
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

const TAB_SUBS = {
  personal:   "Identity, contact, and government information",
  documents:  "Uploaded certificates and credentials",
  employment: "Role, location, and reporting details",
  bank:       "Payroll and banking information",
};

/* ─── Main Component ──────────────────────────────────────────────────── */
const ProfileView = memo(({ data, onBackToHome }) => {
  const [activeTab, setActiveTab]           = useState("personal");
  const [imgFallbackIndex, setImgFallbackIndex] = useState(0);

  const fullName = data.fullName
    || `${data.firstName || ""} ${data.lastName || ""}`.trim()
    || "Employee";
  const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const extractDriveId = (url) => {
    if (!url) return null;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
      /\/d\/([a-zA-Z0-9_-]{10,})\//,
      /[?&]id=([a-zA-Z0-9_-]{10,})/,
      /open\?id=([a-zA-Z0-9_-]{10,})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const driveId = extractDriveId(data.profilePhotoLink);
  const imgSources = driveId ? [
    `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`,
    `https://drive.google.com/uc?export=view&id=${driveId}`,
    `https://lh3.googleusercontent.com/d/${driveId}=s400`,
  ] : (data.profilePhotoLink ? [data.profilePhotoLink] : []);

  const currentImgSrc = imgSources[imgFallbackIndex] || null;
  const handleImgError = () => {
    setImgFallbackIndex(prev =>
      prev < imgSources.length - 1 ? prev + 1 : imgSources.length
    );
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <>
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col">

        {/* ── Top Bar ── */}
        <div className="bg-[#111827] text-[#e8e0d0] h-14 flex items-center justify-between px-8 sticky top-0 z-30">
          <Button
            variant="unstyled"
            onClick={onBackToHome}
            className="relative z-10 flex items-center gap-2 bg-transparent border-none text-[#c8bfaf] text-[13px] font-medium cursor-pointer px-3 py-1.5 rounded-md hover:bg-white/[0.08] hover:text-[#f5f0e8] transition-all duration-200 tracking-wide"
          >
            <ArrowLeft size={15} /> Back to Home
          </Button>
          <div className="relative z-10 flex items-center gap-1.5 text-[11px] font-semibold text-[#7dd4a0] bg-[rgba(125,212,160,0.12)] border border-[rgba(125,212,160,0.3)] px-3.5 py-1.5 rounded-full tracking-[0.08em] uppercase">
            <CheckCircle size={12} /> Profile Approved
          </div>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* ── Sidebar ── */}
          <aside className="w-[260px] min-w-[260px] bg-[#111827] flex flex-col py-8 pb-6 sticky top-14 h-[calc(100vh-56px)] z-20">
            
            <div className="flex flex-col h-full">
              {/* Avatar block */}
              <div className="flex flex-col items-center px-6 pb-7 border-b border-white/[0.07]">
                <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gradient-to-br from-[#e4956a] to-[#c4713a] flex items-center justify-center text-[30px] font-bold text-white mb-3.5 shadow-[0_0_0_3px_rgba(228,149,106,0.3),0_8px_24px_rgba(0,0,0,0.4)] shrink-0">
                  {currentImgSrc && imgFallbackIndex < imgSources.length
                    ? <img
                        key={imgFallbackIndex}
                        src={currentImgSrc}
                        alt={fullName}
                        onError={handleImgError}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover block"
                      />
                    : initials}
                </div>
                <div className="font-semibold text-[17px] text-[#f5f0e8] text-center leading-snug mb-1.5">
                  {fullName}
                </div>
                <div className="text-[11px] text-[#8b8099] text-center tracking-[0.06em] uppercase">
                  {data.jobTitle || "Employee"}
                </div>
                {data.employeeNumber && (
                  <div className="mt-2.5 text-[11px] text-[#e4956a] bg-[rgba(228,149,106,0.1)] border border-[rgba(228,149,106,0.25)] px-2.5 py-[3px] rounded-xl tracking-[0.04em]">
                    ID · {data.employeeNumber}
                  </div>
                )}
              </div>

              {/* Tab nav */}
              <nav className="px-4 pt-5 flex-1 overflow-y-auto">
                <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[#5a5472] px-2 mb-2">
                  Navigation
                </div>
              {TABS.map(tab => (
                <Button
                  key={tab.id}
                  variant="unstyled"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "w-full flex items-center gap-2.5 px-3.5 py-[11px] rounded-[10px] border-none text-[13px] font-medium cursor-pointer transition-all duration-200 text-left mb-0.5 relative",
                    activeTab === tab.id
                      ? "bg-[rgba(228,149,106,0.15)] text-[#e4956a]"
                      : "bg-transparent text-[#8b8099] hover:bg-white/[0.05] hover:text-[#d8cfc0]",
                  ].join(" ")}
                >
                  {activeTab === tab.id && (
                    <span className="absolute left-0 top-[20%] h-[60%] w-[3px] bg-[#e4956a] rounded-r-sm" />
                  )}
                  <tab.icon size={14} />
                  {tab.label}
                  <ChevronRight size={12} className="ml-auto opacity-40" />
                </Button>
              ))}
              </nav>

              {/* Bottom accent */}
              <div className="px-6 mt-auto pt-5">
                <div className="border-t border-white/[0.06] pt-4 text-[10px] text-[#5a5472] tracking-[0.08em] uppercase">
                  {data.assignedCompany || "Organization"}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="flex-1 px-10 py-9 overflow-y-auto">
            <h1 className="text-[32px] font-bold text-[#1a1a2e] mb-1.5">
              {currentTab?.label}
            </h1>
            <p className="text-[13px] text-[#9a8f7e] mb-8 tracking-wide">
              {TAB_SUBS[activeTab]}
            </p>

            {/* ── PERSONAL TAB ── */}
            {activeTab === "personal" && <>
              <SectionCard icon={User} title="Personal Information">
                <div className="grid grid-cols-2 gap-0 max-[700px]:grid-cols-1">
                  <InfoRow label="Full Name"         value={fullName} />
                  <InfoRow label="Gender"            value={data.gender} />
                  <InfoRow label="Marital Status"    value={data.maritalStatus} />
                  <InfoRow label="Nationality"       value={data.nationality} />
                  <InfoRow label="Date of Birth"     value={fmtDate(data.dateOfBirth)} />
                  <InfoRow label="City"              value={data.city} />
                  <InfoRow label="State"             value={data.state} />
                  <InfoRow label="Current Address"   value={data.currentResidentialAddress} />
                  <InfoRow label="Permanent Address" value={data.permanentResidentialAddress} />
                </div>
              </SectionCard>

              <SectionCard icon={Phone} title="Contact Information">
                <div className="grid grid-cols-2 gap-0 max-[700px]:grid-cols-1">
                  <InfoRow label="Mobile"                 value={data.mobileNumber} />
                  <InfoRow label="Emergency Number"       value={data.emergencyNumber} />
                  <InfoRow label="Emergency Relationship" value={data.emergencyRelationship} />
                  <InfoRow label="Work Email"             value={data.emailId} />
                  <InfoRow label="Personal Email"         value={data.personalEmailId} />
                </div>
              </SectionCard>

              <SectionCard icon={Shield} title="Government IDs">
                {data.nationality === "INDIA" && <>
                  <div className="grid grid-cols-2 gap-0 max-[700px]:grid-cols-1">
                    <InfoRow label="Aadhaar Number" value={data.aadharNumber ? `**** **** ${data.aadharNumber.slice(-4)}` : null} />
                    <InfoRow label="PAN Number"     value={data.panNumber ? `${data.panNumber.slice(0, 5)}${"*".repeat(5)}` : null} />
                  </div>
                  <div className="h-4" />
                  <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
                    <DocumentLinkRow label="Aadhaar Document" link={data.aadharDocumentLink} />
                    <DocumentLinkRow label="PAN Document"     link={data.panDocumentLink} />
                  </div>
                </>}
                {data.nationality === "USA" && (
                  <div className="grid grid-cols-2 gap-0 max-[700px]:grid-cols-1">
                    <InfoRow label="SSN" value={data.ssnNumber ? `***-**-${data.ssnNumber.slice(-4)}` : null} />
                  </div>
                )}
                {data.nationality === "CHINA" && (
                  <div className="grid grid-cols-2 gap-0 max-[700px]:grid-cols-1">
                    <InfoRow label="National ID" value={data.nationalId} />
                  </div>
                )}
              </SectionCard>

              <SectionCard icon={Star} title="Skills">
                <div className="flex flex-wrap gap-2">
                  {(data.skills || []).length > 0
                    ? data.skills.map((s, i) => (
                        <span
                          key={i}
                          className="bg-[#fdf4ec] text-[#c4713a] text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[rgba(196,113,58,0.2)] tracking-wide"
                        >
                          {s}
                        </span>
                      ))
                    : <span className="text-sm italic text-[#c8bfaf]">No skills added</span>}
                </div>
              </SectionCard>
            </>}

            {/* ── DOCUMENTS TAB ── */}
            {activeTab === "documents" && (
              <SectionCard icon={FileText} title="Educational & Professional Documents">
                <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
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
                <div className="grid grid-cols-2 gap-0 max-[700px]:grid-cols-1">
                  <InfoRow label="Job Title"       value={data.jobTitle} />
                  <InfoRow label="Employee Number" value={data.employeeNumber} />
                  <InfoRow label="Company"         value={data.assignedCompany} />
                  <InfoRow label="Work Location"   value={data.employmentLocation} />
                  <InfoRow label="Start Date"      value={fmtDate(data.employmentStartDate)} />
                  <InfoRow label="Supervisor"      value={data.supervisor} />
                  <InfoRow label="HR Manager"      value={data.hr} />
                  {data.visaType && <InfoRow label="Visa Type"       value={data.visaType} />}
                  {data.visaEndDate && <InfoRow label="Visa End Date"   value={fmtDate(data.visaEndDate)} />}
                </div>
              </SectionCard>
            )}

            {/* ── BANK TAB ── */}
            {activeTab === "bank" && (
              <SectionCard icon={Building} title="Bank Details">
                <div className="grid grid-cols-2 gap-0 max-[700px]:grid-cols-1">
                  <InfoRow label="Bank Name"      value={data.bankName} />
                  <InfoRow label="Branch"         value={data.bankBranch} />
                  <InfoRow label="Account Number" value={data.bankAccountNumber ? `****${data.bankAccountNumber.slice(-4)}` : null} />
                  <InfoRow label="IFSC Code"      value={data.ifscCode} />
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