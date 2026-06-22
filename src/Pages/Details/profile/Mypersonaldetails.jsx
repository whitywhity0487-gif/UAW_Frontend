import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, CheckCircle, User, Phone, 
 Briefcase, Shield, 
   AlertCircle,  Upload, FileText, X,  Camera,
   ChevronRight, Sparkles, Star, Plus,  Landmark
} from "lucide-react";
import { useUser } from "../../../context/UserContext"
import { useCompany } from "../../../context/CompanyContext"
// Correct - looking in the same folder
import ProfileStatusCard from "./ProfileStatusCard";
import ProfileView from "./ProfileView";  // Make sure ProfileView.jsx also exists in the same folder
import Button from "../../../components/Button";

// ─── Validation helpers ───────────────────────────────────────────────────────
const validators = {
  firstName: (v) => {
    if (!v) return "First name is required.";
    if (v.trim().length < 2) return "First name must be at least 2 characters.";
    if (!/^[a-zA-Z\s\-']+$/.test(v)) return "First name can only contain letters, spaces, hyphens, and apostrophes.";
    return "";
  },
  lastName: (v) => {
    if (!v) return "Last name is required.";
    if (v.trim().length < 2) return "Last name must be at least 2 characters.";
    if (!/^[a-zA-Z\s\-']+$/.test(v)) return "Last name can only contain letters, spaces, hyphens, and apostrophes.";
    return "";
  },
  gender: (v) => {
    if (!v) return "Gender is required.";
    return "";
  },
  dateOfBirth: (v) => {
    if (!v) return "Date of birth is required.";
    const birthDate = new Date(v);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) return "You must be at least 18 years old.";
    if (age > 100) return "Please enter a valid date of birth.";
    return "";
  },
  maritalStatus: (v) => {
    if (!v) return "Marital status is required.";
    return "";
  },
  mobileNumber: (v, nationality) => {
    if (!v) return "Mobile number is required.";
    const requiredLength = (nationality === "CHINA" || nationality === "USA") ? 11 : 10;
    const regex = new RegExp(`^\\d{${requiredLength}}$`);
    if (!regex.test(v.replace(/\s/g, ""))) return `Enter a valid ${requiredLength}-digit mobile number.`;
    return "";
  },
  emergencyNumber: (v, mobileNumber, nationality) => {
    if (!v) return "Emergency number is required.";
    const requiredLength = (nationality === "CHINA" || nationality === "USA") ? 11 : 10;
    const regex = new RegExp(`^\\d{${requiredLength}}$`);
    if (!regex.test(v.replace(/\s/g, ""))) return `Enter a valid ${requiredLength}-digit emergency number.`;
    if (v === mobileNumber) return "Emergency number cannot be the same as mobile number.";
    return "";
  },
  emergencyRelationship: (v) => {
    if (!v) return "Emergency contact relationship is required.";
    return "";
  },
  emailId: (v) => {
    if (!v) return "Work email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid work email address.";
    return "";
  },
  personalEmailId: (v) => {
    if (!v) return "Personal email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid personal email address.";
    return "";
  },
  city: (v) => {
    if (!v) return "City is required.";
    if (v.trim().length < 2) return "Enter a valid city name.";
    return "";
  },
  state: (v) => {
    if (!v) return "State is required.";
    if (v.trim().length < 2) return "Enter a valid state name.";
    return "";
  },
  currentResidentialAddress: (v) => {
    if (!v) return "Current residential address is required.";
    if (v.trim().length < 10) return "Please enter a complete address (minimum 10 characters).";
    return "";
  },
  permanentResidentialAddress: (v) => {
    if (!v) return "Permanent residential address is required.";
    if (v.trim().length < 10) return "Please enter a complete address (minimum 10 characters).";
    return "";
  },
  nationality: (v) => {
    if (!v) return "Nationality is required.";
    return "";
  },
  aadharNumber: (v, nationality) => {
    if (nationality === "INDIA" && !v) return "Aadhar number is required for Indian nationals.";
    if (v && !/^\d{12}$/.test(v.replace(/\s/g, ""))) return "Aadhar number must be exactly 12 digits.";
    return "";
  },
  panNumber: (v, nationality) => {
    if (nationality === "INDIA" && !v) return "PAN number is required for Indian nationals.";
    if (v && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase())) return "Enter a valid PAN (e.g. ABCDE1234F).";
    return "";
  },
  ssnNumber: (v, nationality) => {
    if (nationality === "USA" && !v) return "SSN is required for USA nationals.";
    if (v && nationality === "USA" && !/^\d{3}-?\d{2}-?\d{4}$/.test(v)) {
      return "Enter a valid SSN (e.g. 123-45-6789).";
    }
    return "";
  },
  nationalId: (v, nationality) => {
    if (nationality === "CHINA" && !v) return "National ID is required for China nationals.";
    if (v && nationality === "CHINA" && v.trim().length < 8) return "Enter a valid National ID.";
    return "";
  },
  bankName: (v) => {
    if (!v) return "Bank name is required.";
    return "";
  },
  bankAccountNumber: (v) => {
    if (!v) return "Bank account number is required.";
    if (v.length < 9 || v.length > 18) return "Enter a valid bank account number (9-18 digits).";
    return "";
  },
  ifscCode: (v) => {
    if (!v) return "IFSC code is required.";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase())) return "Enter a valid IFSC code (e.g. SBIN0123456).";
    return "";
  },
  bankBranch: (v) => {
    if (!v) return "Bank branch is required.";
    return "";
  },
  skills: (v) => {
    if (!v || v.length === 0) return "At least one skill is required.";
    return "";
  }
};

// ─── Compute profile completion % ────────────────────────────────────────────
const computeCompletion = (data) => {
  const fields = [
    "firstName", "lastName", "gender", "dateOfBirth", "mobileNumber",
    "emailId", "personalEmailId", "emergencyNumber", "emergencyRelationship", "city", "state",
    "currentResidentialAddress", "permanentResidentialAddress",
    "aadharNumber", "panNumber", "nationality", "maritalStatus",
    "employeeNumber", "bankName", "bankAccountNumber", "ifscCode", "bankBranch"
  ];
  const filled = fields.filter((f) => data[f] && String(data[f]).trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
};

// ─── Shared input class helpers ───────────────────────────────────────────────
const baseInput =
  "w-full px-4 py-3 text-sm bg-white/90 backdrop-blur-sm border rounded-xl outline-none transition-all duration-300 " +
  "focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 shadow-sm";
const errorInput = "border-red-400 bg-red-50/80";
const normalInput = "border-gray-200";
const disabledInput =
  "w-full px-4 py-3 text-sm bg-gray-100/80 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed select-none";

// ─── Tiny shared atoms ────────────────────────────────────────────────────────
const FieldError = ({ msg }) =>
  msg ? (
    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500 font-medium animate-shake">
      <AlertCircle size={10} className="shrink-0" /> {msg}
    </p>
  ) : null;

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
    {children}
    {required && <span className="ml-0.5 text-red-400">*</span>}
  </label>
);

// ─── Animated Section header ───────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle }) => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/50 to-indigo-50/0 animate-shimmer" />
      <div className="flex items-center gap-4 px-6 py-5 bg-white/50 backdrop-blur-sm border-b border-gray-100/50">
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-400 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg text-white transform group-hover:scale-110 transition-transform duration-300">
            <Icon size={20} />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Animated Section card wrapper ─────────────────────────────────────────────
const SectionCard = ({ icon, title, subtitle, children }) => (
  <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-white/0 to-indigo-50/0 group-hover:via-indigo-50/20 transition-all duration-700" />
    <SectionHeader icon={icon} title={title} subtitle={subtitle} />
    <div className="px-6 py-6 relative z-10">{children}</div>
  </div>
);

// ─── Animated Document Upload Component ───────────────────────────────────────
const DocumentUpload = memo(({ label, document, existingLink, onUpload, onRemove, error, required = false }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 1048576) {
      alert(`${label} file size must be less than 1MB`);
      return;
    }
    
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      alert(`${label} must be a PDF or image file`);
      return;
    }
    onUpload(file);
  };

  return (
    <div className="group/upload">
      <Label required={required}>{label}</Label>
      {document ? (
        <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50/80 to-white rounded-xl px-4 py-2.5 border border-indigo-200 shadow-sm animate-slideIn">
          <FileText size={16} className="text-indigo-500 shrink-0" />
          <span className="text-xs text-gray-700 flex-1 truncate font-medium">{document.name}</span>
          <span className="text-[10px] text-gray-400 shrink-0 bg-white/80 px-2 py-0.5 rounded-full">
            {(document.size / 1024).toFixed(0)} KB
          </span>
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-all hover:scale-110 active:scale-95 bg-white p-1 rounded-md shadow-sm">
            <X size={12} />
          </button>
        </div>
      ) : existingLink ? (
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50/80 to-white rounded-xl px-4 py-2.5 border border-emerald-200 shadow-sm animate-slideIn">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <a href={existingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 flex-1 truncate font-medium hover:underline">
            View existing uploaded document
          </a>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm">
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 px-4 flex flex-col items-center gap-2
            hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 text-center group-hover/upload:border-indigo-300"
        >
          <div className="p-2 bg-gray-100 rounded-full group-hover/upload:bg-indigo-100 group-hover/upload:scale-110 transition-all duration-300">
            <Upload size={18} className="text-gray-500 group-hover/upload:text-indigo-500 transition-colors" />
          </div>
          <span className="text-[11px] text-gray-500 group-hover/upload:text-indigo-600 font-medium">Click to upload PDF or Image · max 1 MB</span>
          <span className="text-[10px] text-gray-300">PDF, JPG, PNG only</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf,image/jpeg,image/jpg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <FieldError msg={error} />}
    </div>
  );
});

// ─── Government ID Fields Component (Dynamic based on nationality) ────────────
const GovernmentIdFields = memo(({ nationality, formData, onChange, onBlur, fieldErrors, 
  aadharDocument, panDocument,
  onAadharUpload, onPanUpload,
  onAadharRemove, onPanRemove,
  documentErrors }) => {
  
  if (nationality === "INDIA") {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-50/50 to-transparent p-4 rounded-xl border border-indigo-100">
          <h3 className="text-sm font-semibold text-indigo-700 mb-4 flex items-center gap-2">
            <Shield size={16} /> Indian Government IDs
          </h3>
          
          {/* Aadhar Card Number Field */}
          <div className="group/field mb-4">
            <Label required>Aadhar Number</Label>
            <StableInput 
              type="text" 
              name="aadharNumber" 
              value={formData.aadharNumber} 
              onChange={onChange} 
              onBlur={onBlur} 
              maxLength={12}
              className={`${baseInput} ${fieldErrors.aadharNumber ? errorInput : normalInput}`} 
              placeholder="Enter 12-digit Aadhar number" 
            />
            <FieldError msg={fieldErrors.aadharNumber} />
          </div>
          
          {/* Aadhar Card Upload */}
          <div className="group/field mb-4">
            <Label required>Aadhar Card Document (PDF only)</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-indigo-400 transition-all">
              {aadharDocument ? (
                <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-indigo-500" />
                    <span className="text-sm text-gray-700">{aadharDocument.name}</span>
                  </div>
                  <button onClick={onAadharRemove} className="text-red-500 hover:text-red-700">
                    <X size={18} />
                  </button>
                </div>
              ) : formData.aadharDocumentLink ? (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <a href={formData.aadharDocumentLink} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">View uploaded document</a>
                  </div>
                  <button onClick={() => document.getElementById('aadharUpload')?.click()} className="text-indigo-500 hover:text-indigo-700 text-sm">
                    Replace
                  </button>
                </div>
              ) : (
                <div onClick={() => document.getElementById('aadharUpload')?.click()} className="cursor-pointer text-center py-4">
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-500">Click to upload Aadhar card (PDF only, max 1MB)</p>
                </div>
              )}
              <input
                id="aadharUpload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) onAadharUpload(file);
                }}
                className="hidden"
              />
            </div>
            {documentErrors?.aadhar && <FieldError msg={documentErrors.aadhar} />}
          </div>
          
          {/* PAN Card Number Field */}
          <div className="group/field mb-4">
            <Label required>PAN Number</Label>
            <StableInput 
              type="text" 
              name="panNumber" 
              value={formData.panNumber} 
              onChange={onChange} 
              onBlur={onBlur} 
              maxLength={10}
              className={`${baseInput} ${fieldErrors.panNumber ? errorInput : normalInput} uppercase`} 
              placeholder="Enter PAN number (e.g., ABCDE1234F)" 
            />
            <FieldError msg={fieldErrors.panNumber} />
          </div>
          
          {/* PAN Card Upload */}
          <div className="group/field">
            <Label required>PAN Card Document (PDF/Image)</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-indigo-400 transition-all">
              {panDocument ? (
                <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-indigo-500" />
                    <span className="text-sm text-gray-700">{panDocument.name}</span>
                  </div>
                  <button onClick={onPanRemove} className="text-red-500 hover:text-red-700">
                    <X size={18} />
                  </button>
                </div>
              ) : formData.panDocumentLink ? (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <a href={formData.panDocumentLink} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">View uploaded document</a>
                  </div>
                  <button onClick={() => document.getElementById('panUpload')?.click()} className="text-indigo-500 hover:text-indigo-700 text-sm">
                    Replace
                  </button>
                </div>
              ) : (
                <div onClick={() => document.getElementById('panUpload')?.click()} className="cursor-pointer text-center py-4">
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-500">Click to upload PAN card (PDF/Image, max 1MB)</p>
                </div>
              )}
              <input
                id="panUpload"
                type="file"
                accept=".pdf,application/pdf,image/jpeg,image/jpg,image/png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) onPanUpload(file);
                }}
                className="hidden"
              />
            </div>
            {documentErrors?.pan && <FieldError msg={documentErrors.pan} />}
          </div>
        </div>
      </div>
    );
  }
  
  if (nationality === "USA") {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50/50 to-transparent p-4 rounded-xl border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <Shield size={16} /> USA Government ID
          </h3>
          
          <div className="group/field">
            <Label required>Social Security Number (SSN)</Label>
            <StableInput 
              type="text" 
              name="ssnNumber" 
              value={formData.ssnNumber} 
              onChange={onChange} 
              onBlur={onBlur} 
              className={`${baseInput} ${fieldErrors.ssnNumber ? errorInput : normalInput}`} 
              placeholder="Enter SSN (e.g., 123-45-6789)" 
            />
            <FieldError msg={fieldErrors.ssnNumber} />
            <p className="text-[10px] text-gray-400 mt-1">Format: XXX-XX-XXXX</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (nationality === "CHINA") {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-50/50 to-transparent p-4 rounded-xl border border-red-100">
          <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
            <Shield size={16} /> China Government ID
          </h3>
          
          <div className="group/field">
            <Label required>National ID</Label>
            <StableInput 
              type="text" 
              name="nationalId" 
              value={formData.nationalId} 
              onChange={onChange} 
              onBlur={onBlur} 
              className={`${baseInput} ${fieldErrors.nationalId ? errorInput : normalInput}`} 
              placeholder="Enter Chinese National ID (18 digits)" 
            />
            <FieldError msg={fieldErrors.nationalId} />
            <p className="text-[10px] text-gray-400 mt-1">Chinese Resident Identity Card number</p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
});

// ─── Company Dropdown ─────────────────────────────────────────────────
const CompanyDropdown = memo(({ value, companies, onSelect, onValueChange, error }) => {
  const [localValue, setLocalValue] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [isValidSelection, setIsValidSelection] = useState(true);
  const containerRef = useRef(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setLocalValue(value || "");
      // Check if the new value is a valid company
      if (value && companies) {
        const isValid = companies.some(c => c.name?.toLowerCase() === value.toLowerCase());
        setIsValidSelection(isValid || !value);
      }
    }
  }, [value, companies]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        // Validate on blur: check if typed text matches a company
        if (localValue && companies) {
          const isValid = companies.some(c => c.name?.toLowerCase() === localValue.toLowerCase());
          setIsValidSelection(isValid);
          if (!isValid) {
            onValueChange(localValue, false); // signal invalid
          }
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [localValue, companies, onValueChange]);

  const filtered = useMemo(
    () => companies ? companies.filter((c) => c.name?.toLowerCase().includes(localValue.toLowerCase())) : [],
    [companies, localValue]
  );

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setOpen(true);
    // Reset valid selection flag when typing
    setIsValidSelection(false);
    onValueChange(newValue, false);
  };

  const handleSelect = (companyName) => {
    setLocalValue(companyName);
    setOpen(false);
    setIsValidSelection(true);
    onSelect(companyName);
  };

  const displayError = !isValidSelection && localValue
    ? "Please select a valid company from the dropdown."
    : error;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder="Search or select company…"
        className={`${baseInput} ${displayError ? errorInput : normalInput}`}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl shadow-2xl max-h-56 overflow-y-auto animate-fadeInUp">
          {filtered.map((company, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(company.name)}
              className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-white border-b border-gray-50 last:border-0 transition-all duration-200 group"
            >
              <div className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">{company.name}</div>
              {company.location && <div className="text-[10px] text-gray-400 mt-0.5 group-hover:text-indigo-400">{company.location}</div>}
            </div>
          ))}
        </div>
      )}
      {open && localValue && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl shadow-2xl p-4 animate-fadeInUp">
          <p className="text-sm text-gray-400 italic text-center">No matching companies found</p>
        </div>
      )}
      {displayError && <FieldError msg={displayError} />}
    </div>
  );
});

// ─── Skills Input Component ───────────────────────────────────────────────────
const SkillsSection = memo(({ skills, onAddSkill, onRemoveSkill, onSkillInputChange, skillInput, error }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddSkill();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={skillInput}
          onChange={(e) => onSkillInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a skill (e.g., React, Python, Project Management)..."
          className="flex-1 px-4 py-2.5 text-sm bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={onAddSkill}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <Plus size={16} /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <p className="text-[12px] text-gray-400 italic">No skills added yet. Add your professional skills above.</p>
        ) : (
          skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-white text-indigo-700 text-[12px] font-medium px-3 py-1.5 rounded-full shadow-sm border border-indigo-100 animate-scaleIn"
            >
              {skill}
              <button type="button" onClick={() => onRemoveSkill(index)} className="text-indigo-400 hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>
      {error && <FieldError msg={error} />}
    </div>
  );
});

// ─── Stable primitives ────────────────────────────────────────────────────────
const StableInput = memo(({ name, value, onChange, onBlur, placeholder, type = "text", maxLength, className, readOnly, disabled }) => (
  <input
    type={type}
    name={name}
    value={value || ""}
    onChange={onChange}
    onBlur={onBlur}
    placeholder={placeholder}
    maxLength={maxLength}
    className={className}
    readOnly={readOnly}
    disabled={disabled}
    autoComplete="off"
  />
));

const StableSelect = memo(({ name, value, onChange, className, children }) => (
  <select name={name} value={value || ""} onChange={onChange} className={className}>
    {children}
  </select>
));

const StableTextarea = memo(({ name, value, onChange, rows, placeholder, className }) => (
  <textarea name={name} value={value || ""} onChange={onChange} rows={rows} placeholder={placeholder} className={className} />
));

// ─── Sidebar nav items config ─────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: "sec-identity", label: "Identity", icon: User },
  { id: "sec-contact", label: "Contact", icon: Phone },
  { id: "sec-ids", label: "Government IDs", icon: Shield },
  { id: "sec-documents", label: "Documents", icon: FileText },
  { id: "sec-employment", label: "Employment", icon: Briefcase },
  { id: "sec-bank", label: "Bank Details", icon: Landmark },
  { id: "sec-skills", label: "Skills", icon: Star },
];

// ─── Profile Form Component ───────────────────────────────────────────────────
const ProfileFormComponent = memo(({
  formData, onChange, onBlur, onSubmit, onCancel, fieldErrors, serverErrors, loading,
  companies, onCompanySelect, onCompanyValueChange,
  aadharDocument, panDocument, ssnDocument, nationalIdDocument,
  onAadharUpload, onPanUpload,  
  onAadharRemove, onPanRemove, 
  tenthDocument, twelfthDocument, resumeDocument, visaDocument, profilePhotoDocument,
  onTenthUpload, onTwelfthUpload, onResumeUpload, onVisaUpload, onProfilePhotoUpload,
  onTenthRemove, onTwelfthRemove, onResumeRemove, onVisaRemove, onProfilePhotoRemove,
  graduationDocument, postGraduationDocument, onGraduationUpload, onPostGraduationUpload,
  onGraduationRemove, onPostGraduationRemove, documentErrors,
  demands, showDemandDropdown, setShowDemandDropdown, onDemandSelect,
  currentUserRole, completion, skills, onAddSkill, onRemoveSkill, onSkillInputChange, skillInput,
  declarationChecked, onDeclarationChange, declarationError
}) => {
  const [activeSection, setActiveSection] = useState("sec-identity");
  const [hoveredSection, setHoveredSection] = useState(null);

  const iCls = useCallback((name) => `${baseInput} ${fieldErrors[name] || serverErrors[name] ? errorInput : normalInput}`, [fieldErrors, serverErrors]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  useEffect(() => {
    const handler = () => {
      for (const s of [...NAV_SECTIONS].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(s.id);
          break;
        }
      }
    };
    const main = document.getElementById("form-scroll-area");
    if (main) main.addEventListener("scroll", handler);
    return () => { if (main) main.removeEventListener("scroll", handler); };
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-hidden">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-100/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside className="w-80 shrink-0 bg-white/70 backdrop-blur-xl border-r border-white/50 flex flex-col h-full overflow-y-auto shadow-2xl z-10">
        <div className="px-6 py-6 border-b border-white/50">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg animate-pulse-slow">
                <Sparkles size={20} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-base font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-tight">My Profile</p>
              <p className="text-[11px] text-gray-400">Complete your details</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-white/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Profile completion</span>
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">{completion}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${completion}%` }}>
              <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            </div>
          </div>
        </div>

        <nav className="px-4 py-6 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-3">Sections</p>
          {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => scrollTo(id)} onMouseEnter={() => setHoveredSection(id)} onMouseLeave={() => setHoveredSection(null)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-1.5 transition-all duration-300 text-sm group ${activeSection === id ? "bg-gradient-to-r from-indigo-50 to-white text-indigo-700 font-medium shadow-md" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"}`}>
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeSection === id ? "bg-indigo-100 text-indigo-600" : "bg-transparent group-hover:bg-indigo-50"}`}>
                <Icon size={16} className="shrink-0" />
              </div>
              <span className="relative">{label}{hoveredSection === id && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-transparent rounded-full animate-slideIn" />}</span>
              {activeSection === id && <ChevronRight size={12} className="ml-auto text-indigo-400 animate-pulse-slow" />}
            </button>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-white/50">
          <div className="bg-gradient-to-r from-amber-50/80 to-transparent rounded-xl p-3 border border-amber-100 backdrop-blur-sm">
            <p className="text-[11px] text-amber-700 leading-relaxed flex items-start gap-2">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              Submitted profiles are reviewed by HR within 2 business days.
            </p>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full z-10">
        <div className="bg-white/50 backdrop-blur-xl border-b border-white/50 px-8 h-[72px] flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={onCancel}
              className="rounded-xl border-gray-200 hover:border-indigo-300 hover:bg-white/50"
            >
              Back
            </Button>
            <div>
              <p className="text-[15px] font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Complete your profile</p>
              <p className="text-[11px] text-gray-400">Fields marked * are required</p>
            </div>
          </div>
          <Button
            variant="primary"
            icon={Save}
            onClick={onSubmit}
            isLoading={loading}
            className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 border-none shadow-lg hover:shadow-xl rounded-xl"
          >
            Save details
          </Button>
        </div>

        <div id="form-scroll-area" className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Identity Section */}
          <div id="sec-identity" className="scroll-mt-20">
            <SectionCard icon={User} title="Identity" subtitle="Your full legal name and personal details">
              <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                <div className="group/field"><Label required>First name</Label><StableInput name="firstName" value={formData.firstName} onChange={onChange} onBlur={onBlur} className={iCls("firstName")} placeholder="First name" /><FieldError msg={fieldErrors.firstName || serverErrors.firstName} /></div>
                <div className="group/field"><Label>Middle name</Label><StableInput name="middleName" value={formData.middleName} onChange={onChange} className={iCls("middleName")} placeholder="Middle name" /></div>
                <div className="group/field"><Label required>Last name</Label><StableInput name="lastName" value={formData.lastName} onChange={onChange} onBlur={onBlur} className={iCls("lastName")} placeholder="Last name" /><FieldError msg={fieldErrors.lastName || serverErrors.lastName} /></div>
                <div className="group/field"><Label required>Gender</Label><StableSelect name="gender" value={formData.gender} onChange={onChange} className={iCls("gender")}><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option><option value="Prefer not to say">Prefer not to say</option></StableSelect><FieldError msg={fieldErrors.gender} /></div>
                <div className="group/field"><Label required>Date of birth</Label><StableInput type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={onChange} onBlur={onBlur} className={iCls("dateOfBirth")} /><FieldError msg={fieldErrors.dateOfBirth} /></div>
                <div className="group/field"><Label required>Marital status</Label><StableSelect name="maritalStatus" value={formData.maritalStatus} onChange={onChange} onBlur={onBlur} className={iCls("maritalStatus")}><option value="">Select status</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option><option value="Separated">Separated</option></StableSelect><FieldError msg={fieldErrors.maritalStatus} /></div>
                <div className="group/field"><Label required>Nationality</Label><StableSelect name="nationality" value={formData.nationality} onChange={onChange} onBlur={onBlur} className={iCls("nationality")}><option value="">Select nationality</option><option value="INDIA">INDIA</option><option value="USA">USA</option><option value="CHINA">CHINA</option></StableSelect><FieldError msg={fieldErrors.nationality} /></div>
              </div>
            </SectionCard>
          </div>

          {/* Contact Section */}
          <div id="sec-contact" className="scroll-mt-20">
            <SectionCard icon={Phone} title="Contact Information" subtitle="Phone numbers, email and address">
              <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                <div className="group/field"><Label required>Mobile number</Label><StableInput type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={onChange} onBlur={onBlur} maxLength={(formData.nationality === "CHINA" || formData.nationality === "USA") ? 11 : 10} className={iCls("mobileNumber")} placeholder={`${(formData.nationality === "CHINA" || formData.nationality === "USA") ? 11 : 10}-digit number`} /><FieldError msg={fieldErrors.mobileNumber || serverErrors.mobileNumber} /></div>
                <div className="group/field"><Label required>Emergency number</Label><StableInput type="tel" name="emergencyNumber" value={formData.emergencyNumber} onChange={onChange} onBlur={onBlur} maxLength={(formData.nationality === "CHINA" || formData.nationality === "USA") ? 11 : 10} className={iCls("emergencyNumber")} placeholder={`${(formData.nationality === "CHINA" || formData.nationality === "USA") ? 11 : 10}-digit number`} /><FieldError msg={fieldErrors.emergencyNumber} /></div>
                <div className="group/field"><Label required>Emergency contact relationship</Label><StableInput type="text" name="emergencyRelationship" value={formData.emergencyRelationship} onChange={onChange} onBlur={onBlur} className={iCls("emergencyRelationship")} placeholder="e.g. Father, Mother, Guardian" /><FieldError msg={fieldErrors.emergencyRelationship} /></div>
                <div className="group/field"><Label>Work email</Label><StableInput type="email" name="emailId" value={formData.emailId} onChange={onChange} onBlur={onBlur} className={iCls("emailId")} placeholder="work@company.com" /><FieldError msg={fieldErrors.emailId || serverErrors.emailId} /></div>
                <div className="group/field"><Label required>Personal email</Label><StableInput type="email" name="personalEmailId" value={formData.personalEmailId} onChange={onChange} onBlur={onBlur} className={iCls("personalEmailId")} placeholder="personal@email.com" /><FieldError msg={fieldErrors.personalEmailId} /></div>
                <div className="group/field"><Label required>City</Label><StableInput name="city" value={formData.city} onChange={onChange} onBlur={onBlur} className={iCls("city")} placeholder="City" /><FieldError msg={fieldErrors.city} /></div>
                <div className="group/field"><Label required>State</Label><StableInput name="state" value={formData.state} onChange={onChange} onBlur={onBlur} className={iCls("state")} placeholder="State" /><FieldError msg={fieldErrors.state} /></div>
                <div className="col-span-3 group/field"><Label required>Current residential address</Label><StableTextarea name="currentResidentialAddress" value={formData.currentResidentialAddress} onChange={onChange} onBlur={onBlur} rows={2} className={`${iCls("currentResidentialAddress")} resize-none`} placeholder="Door no, street, area…" /><FieldError msg={fieldErrors.currentResidentialAddress} /></div>
                <div className="col-span-3 group/field"><Label required>Permanent residential address</Label><StableTextarea name="permanentResidentialAddress" value={formData.permanentResidentialAddress} onChange={onChange} onBlur={onBlur} rows={2} className={`${iCls("permanentResidentialAddress")} resize-none`} placeholder="Permanent address…" /><FieldError msg={fieldErrors.permanentResidentialAddress} /></div>
              </div>
            </SectionCard>
          </div>

          {/* Government IDs Section - Dynamic based on nationality */}
          <div id="sec-ids" className="scroll-mt-20">
            <SectionCard icon={Shield} title="Government IDs" subtitle="Identity documents for verification">
              <GovernmentIdFields 
                nationality={formData.nationality}
                formData={formData}
                onChange={onChange}
                onBlur={onBlur}
                fieldErrors={fieldErrors}
                aadharDocument={aadharDocument}
                panDocument={panDocument}
              
                onAadharUpload={onAadharUpload}
                onPanUpload={onPanUpload}
              
                onAadharRemove={onAadharRemove}
                onPanRemove={onPanRemove}
              
                documentErrors={documentErrors}
              />
            </SectionCard>
          </div>

          {/* Documents Section */}
          <div id="sec-documents" className="scroll-mt-20">
            <SectionCard icon={FileText} title="Educational & Other Documents" subtitle="Certificates and additional documents">
              <div className="grid grid-cols-2 gap-6">
                <DocumentUpload 
                  label="10th Certificate"
                  document={tenthDocument}
                  existingLink={formData.tenthCertificateLink}
                  onUpload={onTenthUpload}
                  onRemove={onTenthRemove}
                  error={documentErrors?.tenth}
                  required={true}
                />
                <DocumentUpload 
                  label="12th/PUC Certificate"
                  document={twelfthDocument}
                  existingLink={formData.twelfthCertificateLink}
                  onUpload={onTwelfthUpload}
                  onRemove={onTwelfthRemove}
                  error={documentErrors?.twelfth}
                  required={true}
                />
                <DocumentUpload 
                  label="Graduation Certificate"
                  document={graduationDocument}
                  existingLink={formData.graduationCertificateLink}
                  onUpload={onGraduationUpload}
                  onRemove={onGraduationRemove}
                  error={documentErrors?.graduation}
                  required={true}
                />
                <DocumentUpload 
                  label="Post Graduation Certificate"
                  document={postGraduationDocument}
                  existingLink={formData.postGraduationCertificateLink}
                  onUpload={onPostGraduationUpload}
                  onRemove={onPostGraduationRemove}
                  error={documentErrors?.postGraduation}
                  required={false}
                />
                <DocumentUpload 
                  label="Resume/CV"
                  document={resumeDocument}
                  existingLink={formData.resumeDocumentLink}
                  onUpload={onResumeUpload}
                  onRemove={onResumeRemove}
                  error={documentErrors?.resume}
                  required={true}
                />
                <DocumentUpload 
                  label="Visa Document"
                  document={visaDocument}
                  existingLink={formData.visaDocumentLink}
                  onUpload={onVisaUpload}
                  onRemove={onVisaRemove}
                  error={documentErrors?.visa}
                />
             <div className="group/upload">
  <Label required>Profile Photo</Label>

  {profilePhotoDocument ? (
    <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
      <img
        src={URL.createObjectURL(profilePhotoDocument)}
        alt="Profile Preview"
        className="w-full h-full object-cover"
      />

      <button
        type="button"
        onClick={onProfilePhotoRemove}
        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-red-50"
      >
        <X size={14} className="text-red-500" />
      </button>
    </div>
  ) : formData.profilePhotoLink ? (
    <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
      <img
        src={formData.profilePhotoLink}
        alt="Profile"
        className="w-full h-full object-cover"
      />

      <button
        type="button"
        onClick={() => document.getElementById("profilePhotoUpload")?.click()}
        className="absolute bottom-2 right-2 bg-white px-2 py-1 text-xs rounded-md shadow"
      >
        Replace
      </button>
    </div>
  ) : (
    <div
      onClick={() => document.getElementById("profilePhotoUpload")?.click()}
      className={`w-40 h-40 border-2 border-dashed ${documentErrors?.profilePhoto ? 'border-red-400 bg-red-50/30' : 'border-gray-300'} rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all`}
    >
      <Camera size={28} className="text-gray-400 mb-2" />
      <p className="text-xs text-gray-500">Upload Photo</p>
      <p className="text-[10px] text-gray-300 mt-1">JPG, JPEG, PNG · max 1 MB</p>
    </div>
  )}

  <input
    id="profilePhotoUpload"
    type="file"
    accept="image/png,image/jpeg,image/jpg"
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) onProfilePhotoUpload(file);
    }}
    className="hidden"
  />

  {documentErrors?.profilePhoto && (
    <FieldError msg={documentErrors.profilePhoto} />
  )}
</div>
              </div>
            </SectionCard>
          </div>

          {/* Employment Section */}
          <div id="sec-employment" className="scroll-mt-20">
            <SectionCard icon={Briefcase} title="Employment & Visa" subtitle="Work details and visa information">
              <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                <div className="group/field"><Label>Job title</Label><input type="text" name="jobTitle" value={formData.jobTitle} disabled readOnly className={disabledInput} /></div>
                <div className="group/field"><Label>Employee number</Label><StableInput name="employeeNumber" value={formData.employeeNumber} className={disabledInput} readOnly disabled /></div>
                <div className="group/field"><Label>Client</Label><CompanyDropdown value={formData.assignedCompany} companies={companies} onSelect={onCompanySelect} onValueChange={onCompanyValueChange} error={fieldErrors.assignedCompany || serverErrors.assignedCompany} /></div>
                <div className="group/field"><Label>Work location</Label><StableInput name="employmentLocation" value={formData.employmentLocation} onChange={onChange} className={iCls("employmentLocation")} placeholder="Work location" /><FieldError msg={fieldErrors.employmentLocation} /></div>
                <div className="group/field"><Label>Start date</Label><StableInput type="date" name="employmentStartDate" value={formData.employmentStartDate} readOnly disabled className={disabledInput} /></div>
                <div className="group/field"><Label>Supervisor</Label><StableInput name="supervisor" value={formData.supervisor} readOnly disabled className={disabledInput} /></div>
                <div className="group/field"><Label>HR manager</Label><StableInput name="hr" value={formData.hr} readOnly disabled className={disabledInput} /></div>
                <div className="group/field"><Label>Visa type</Label><StableSelect name="visaType" value={formData.visaType} onChange={onChange} className={iCls("visaType")}><option value="">Select visa type</option><option value="H-1B">H-1B</option><option value="L-1">L-1</option><option value="F-1 OPT">F-1 OPT</option><option value="O-1">O-1</option><option value="TN">TN</option><option value="Work Permit">Work Permit</option><option value="Permanent Resident">Permanent Resident</option><option value="Citizen / No Visa Required">Citizen / No Visa Required</option><option value="Other">Other</option></StableSelect></div>
                <div className="group/field"><Label>Visa end date</Label><StableInput type="date" name="visaEndDate" value={formData.visaEndDate} onChange={onChange} className={iCls("visaEndDate")} /></div>
              </div>
            </SectionCard>
          </div>

          {/* Bank Details Section */}
          <div id="sec-bank" className="scroll-mt-20">
            <SectionCard icon={Landmark} title="Bank Details" subtitle="Salary account information for payroll">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <div className="group/field"><Label required>Bank Name</Label><StableInput name="bankName" value={formData.bankName} onChange={onChange} onBlur={onBlur} className={iCls("bankName")} placeholder="Bank Name" /><FieldError msg={fieldErrors.bankName} /></div>
                <div className="group/field"><Label required>Bank Branch</Label><StableInput name="bankBranch" value={formData.bankBranch} onChange={onChange} onBlur={onBlur} className={iCls("bankBranch")} placeholder="Branch name" /><FieldError msg={fieldErrors.bankBranch} /></div>
                <div className="group/field"><Label required>Bank Account Number</Label><StableInput name="bankAccountNumber" value={formData.bankAccountNumber} onChange={onChange} onBlur={onBlur} className={iCls("bankAccountNumber")} placeholder="Account number" /><FieldError msg={fieldErrors.bankAccountNumber} /></div>
                <div className="group/field"><Label required>IFSC Code</Label><StableInput name="ifscCode" value={formData.ifscCode} onChange={onChange} onBlur={onBlur} className={`${iCls("ifscCode")} uppercase`} placeholder="e.g. SBIN0001234" maxLength={11} /><FieldError msg={fieldErrors.ifscCode} /></div>
              </div>
            </SectionCard>
          </div>

          {/* Skills Section */}
          <div id="sec-skills" className="scroll-mt-20">
            <SectionCard icon={Star} title="Skills & Expertise" subtitle="Add your professional skills">
              <SkillsSection skills={skills} onAddSkill={onAddSkill} onRemoveSkill={onRemoveSkill} onSkillInputChange={onSkillInputChange} skillInput={skillInput} error={fieldErrors.skills} />
            </SectionCard>
          </div>

          {/* Declaration Checkbox */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
            <div className="flex items-start gap-4">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="declaration-checkbox"
                  checked={declarationChecked}
                  onChange={(e) => onDeclarationChange(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
              </div>
              <label htmlFor="declaration-checkbox" className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none">
                <span className="font-semibold text-gray-800">Declaration:</span>{" "}
                I hereby confirm that all the details provided in this form are true and accurate to the best of my knowledge. 
                <span className="text-red-400 ml-0.5">*</span>
              </label>
            </div>
            {declarationError && (
              <div className="mt-3 ml-9">
                <FieldError msg={declarationError} />
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-between py-5 border-t border-white/50 bg-white/50 backdrop-blur-xl -mx-8 px-8 sticky bottom-0 shadow-2xl rounded-t-2xl">
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <div className="p-1 bg-indigo-100 rounded-full animate-pulse-slow"><AlertCircle size={12} className="text-indigo-500" /></div>
              Complete all required fields before submitting
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={onCancel}
                className="rounded-xl border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={onSubmit}
                isLoading={loading}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 border-none shadow-lg hover:shadow-xl rounded-xl"
              >
                Submit profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const Mypersonaldetails = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUser, isHydrated, profileStatus, checkProfileAccess } = useUser();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});

  const { availableCompanies: companies, refreshCompanies } = useCompany();
  const [demands, setDemands] = useState([]);
  const [showDemandDropdown, setShowDemandDropdown] = useState(false);

  // Document states
  const [aadharDocument, setAadharDocument] = useState(null);
  const [panDocument, setPanDocument] = useState(null);
  const [tenthDocument, setTenthDocument] = useState(null);
  const [twelfthDocument, setTwelfthDocument] = useState(null);
  const [resumeDocument, setResumeDocument] = useState(null);
  const [visaDocument, setVisaDocument] = useState(null);
  const [profilePhotoDocument, setProfilePhotoDocument] = useState(null);
  const [graduationDocument, setGraduationDocument] = useState(null);
  const [postGraduationDocument, setPostGraduationDocument] = useState(null);
  
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [documentErrors, setDocumentErrors] = useState({});
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [declarationError, setDeclarationError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", fullName: "", emailId: "", personalEmailId: "", pid: "", gender: "",
    mobileNumber: "", emergencyNumber: "", emergencyRelationship: "", aadharNumber: "", ssnNumber: "", nationalId: "", panNumber: "",
    dateOfBirth: "", nationality: "", maritalStatus: "", currentResidentialAddress: "", permanentResidentialAddress: "", city: "", state: "",
    jobTitle: "", employmentStartDate: "", employmentLocation: "", visaType: "", visaEndDate: "", supervisor: "", hr: "",
    employeeNumber: "", assignedCompany: "", selectedDemand: "", skills: [], bankName: "", bankAccountNumber: "", ifscCode: "", bankBranch: "",
    aadharDocumentLink: "", panDocumentLink: "", ssnDocumentLink: "", nationalIdDocumentLink: "",
    tenthCertificateLink: "", twelfthCertificateLink: "", resumeDocumentLink: "",
    visaDocumentLink: "", profilePhotoLink: "", graduationCertificateLink: "", postGraduationCertificateLink: "", rejectionReason: ""
  });

  const API_BASE_URL = "https://uaw-backend.vercel.app";

  // Helper to validate a single field
  const validateField = (name, value, allData = formData) => {
    switch (name) {
      case "firstName":
        return validators.firstName(value);
      case "lastName":
        return validators.lastName(value);
      case "gender":
        return validators.gender(value);
      case "dateOfBirth":
        return validators.dateOfBirth(value);
      case "maritalStatus":
        return validators.maritalStatus(value);
      case "mobileNumber":
        return validators.mobileNumber(value, allData.nationality);
      case "emergencyNumber":
        return validators.emergencyNumber(value, allData.mobileNumber, allData.nationality);
      case "emergencyRelationship":
        return validators.emergencyRelationship(value);
      case "emailId":
        return validators.emailId(value);
      case "personalEmailId":
        return validators.personalEmailId(value);
      case "city":
        return validators.city(value);
      case "state":
        return validators.state(value);
      case "currentResidentialAddress":
        return validators.currentResidentialAddress(value);
      case "permanentResidentialAddress":
        return validators.permanentResidentialAddress(value);
      case "nationality":
        return validators.nationality(value);
      case "aadharNumber":
        return validators.aadharNumber(value, allData.nationality);
      case "panNumber":
        return validators.panNumber(value, allData.nationality);
      case "ssnNumber":
        return validators.ssnNumber(value, allData.nationality);
      case "nationalId":
        return validators.nationalId(value, allData.nationality);
      case "bankName":
        return validators.bankName(value);
      case "bankAccountNumber":
        return validators.bankAccountNumber(value);
      case "ifscCode":
        return validators.ifscCode(value);
      case "bankBranch":
        return validators.bankBranch(value);
      case "skills":
        return validators.skills(value);
      default:
        return "";
    }
  };

  // Handle input change with validation
  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === "mobileNumber" || name === "emergencyNumber") {
      value = value.replace(/\D/g, "");
    }
    
    // Update form data
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Also update fullName if first/middle/last name changes
      if (name === "firstName" || name === "middleName" || name === "lastName") {
        newData.fullName = [newData.firstName, newData.middleName, newData.lastName]
          .filter(Boolean).join(" ");
      }
      
      return newData;
    });
    
    // Clear previous errors for this field
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
    setServerErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Handle blur for validation
  const handleBlur = async (e) => {
    const { name, value } = e.target;
    let error = validateField(name, value);

    // If local validation passes, check uniqueness for specific fields
    if (!error && (name === "mobileNumber" || name === "personalEmailId" || name === "employeeNumber") && value) {
      try {
        const username = currentUser?.username || JSON.parse(localStorage.getItem("user"))?.username;
        const res = await fetch(`${API_BASE_URL}/api/personaldetails/validate-unique?${name}=${encodeURIComponent(value)}&excludeUserId=${encodeURIComponent(username || "")}`);
        const data = await res.json();
        if (data.success && !data.isUnique && data.errors[name]) {
          error = data.errors[name];
        }
      } catch (err) {
        console.error("Uniqueness validation error:", err);
      }
    }

    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  // Company dropdown handlers
  const handleCompanySelect = (companyName) => {
    setFormData(prev => ({ ...prev, assignedCompany: companyName }));
    setFieldErrors(prev => ({ ...prev, assignedCompany: "" }));
  };

  const handleCompanyValueChange = (value, isValid) => {
    setFormData(prev => ({ ...prev, assignedCompany: value }));
    if (!isValid && value) {
      setFieldErrors(prev => ({ ...prev, assignedCompany: "Please select a valid company from the dropdown." }));
    } else {
      setFieldErrors(prev => ({ ...prev, assignedCompany: "" }));
    }
  };

  // Declaration checkbox handler
  const handleDeclarationChange = (checked) => {
    setDeclarationChecked(checked);
    if (checked) {
      setDeclarationError("");
    }
  };

  // Demand dropdown handlers
  const handleDemandSelect = (demand) => {
    setFormData(prev => ({ ...prev, selectedDemand: demand.demandNumber || demand }));
    setShowDemandDropdown(false);
  };

  // Document upload handlers
  const handleAadharUpload = (file) => { setAadharDocument(file); setDocumentErrors(prev => ({...prev, aadhar: ""})); };
  const handlePanUpload = (file) => { setPanDocument(file); setDocumentErrors(prev => ({...prev, pan: ""})); };
  const handleTenthUpload = (file) => { setTenthDocument(file); setDocumentErrors(prev => ({...prev, tenth: ""})); };
  const handleTwelfthUpload = (file) => { setTwelfthDocument(file); setDocumentErrors(prev => ({...prev, twelfth: ""})); };
  const handleResumeUpload = (file) => { setResumeDocument(file); setDocumentErrors(prev => ({...prev, resume: ""})); };
  const handleVisaUpload = (file) => { setVisaDocument(file); setDocumentErrors(prev => ({...prev, visa: ""})); };
  const handleProfilePhotoUpload = (file) => {
    // Validate file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setDocumentErrors(prev => ({ ...prev, profilePhoto: "Only JPG, JPEG, and PNG files are allowed." }));
      return;
    }
    // Validate file size (1 MB = 1048576 bytes)
    if (file.size > 1048576) {
      setDocumentErrors(prev => ({ ...prev, profilePhoto: "Profile photo size must be less than 1 MB." }));
      return;
    }
    setProfilePhotoDocument(file);
    setDocumentErrors(prev => ({ ...prev, profilePhoto: "" }));
  };
  const handleGraduationUpload = (file) => { setGraduationDocument(file); setDocumentErrors(prev => ({...prev, graduation: ""})); };
  const handlePostGraduationUpload = (file) => { setPostGraduationDocument(file); setDocumentErrors(prev => ({...prev, postGraduation: ""})); };

  const handleAadharRemove = () => setAadharDocument(null);
  const handlePanRemove = () => setPanDocument(null);
  const handleTenthRemove = () => setTenthDocument(null);
  const handleTwelfthRemove = () => setTwelfthDocument(null);
  const handleResumeRemove = () => setResumeDocument(null);
  const handleVisaRemove = () => setVisaDocument(null);
  const handleProfilePhotoRemove = () => setProfilePhotoDocument(null);
  const handleGraduationRemove = () => setGraduationDocument(null);
  const handlePostGraduationRemove = () => setPostGraduationDocument(null);

  // Skills handlers
  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkills = [...skills, skillInput.trim()];
      setSkills(newSkills);
      setFormData(prev => ({ ...prev, skills: newSkills }));
      setSkillInput("");
      // Clear skills error when adding a skill
      setFieldErrors(prev => ({ ...prev, skills: "" }));
    }
  };

  const handleRemoveSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
    setFormData(prev => ({ ...prev, skills: newSkills }));
  };

  const handleSkillInputChange = (value) => setSkillInput(value);

  const fetchPersonalDetails = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/personal-details?userId=${username}`);
      if (response.ok) return await response.json();
      return null;
    } catch (error) {
      console.error("Error fetching personal details:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setFetching(true);
      let username = currentUser?.username;
      if (!username) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            username = parsed?.username;
          } catch (e) { console.error(e); }
        }
      }
      if (!username) { setFetching(false); return; }
      
      await refreshCompanies();
      try {
        const personalDetails = await fetchPersonalDetails(username);
        if (personalDetails?.profileCompleted && personalDetails?.data) {
          setProfileCompleted(true);
          const fmt = (d) => d ? new Date(d).toISOString().split("T")[0] : "";
          const d = personalDetails.data;
          setFormData({
            firstName: d.firstName || "", middleName: d.middleName || "", lastName: d.lastName || "",
            fullName: [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" "),
            emailId: d.emailId || "", personalEmailId: d.personalEmailId || "", pid: d.pid || "", gender: d.gender || "",
            mobileNumber: d.mobileNumber || "", emergencyNumber: d.emergencyNumber || "", emergencyRelationship: d.emergencyRelationship || "",
            aadharNumber: d.aadharNumber || "", ssnNumber: d.ssnNumber || "", nationalId: d.nationalId || "", panNumber: d.panNumber || "",
            dateOfBirth: fmt(d.dateOfBirth) || "", nationality: d.nationality || "", maritalStatus: d.maritalStatus || "",
            currentResidentialAddress: d.currentResidentialAddress || "", permanentResidentialAddress: d.permanentResidentialAddress || "",
            city: d.city || "", state: d.state || "", jobTitle: d.jobTitle || "", employmentStartDate: d.employmentStartDate || "",
            employmentLocation: d.employmentLocation || "", visaType: d.visaType || "", visaEndDate: fmt(d.visaEndDate),
            supervisor: d.supervisor || "", hr: d.hr || "", employeeNumber: d.employeeNumber || "",
            assignedCompany: d.assignedCompany || "", selectedDemand: d.selectedDemand || "", skills: d.skills || [],
            bankName: d.bankName || "", bankAccountNumber: d.bankAccountNumber || "", ifscCode: d.ifscCode || "", bankBranch: d.bankBranch || "",
            aadharDocumentLink: d.aadharDocumentLink || "", panDocumentLink: d.panDocumentLink || "",
            ssnDocumentLink: d.ssnDocumentLink || "", nationalIdDocumentLink: d.nationalIdDocumentLink || "",
            tenthCertificateLink: d.tenthCertificateLink || "", twelfthCertificateLink: d.twelfthCertificateLink || "",
            resumeDocumentLink: d.resumeDocumentLink || "", visaDocumentLink: d.visaDocumentLink || "",
            profilePhotoLink: d.profilePhotoLink || "", graduationCertificateLink: d.graduationCertificateLink || "",
            postGraduationCertificateLink: d.postGraduationCertificateLink || "", rejectionReason: d.profileRejectionReason || ""
          });
          setSkills(d.skills || []);
        } else {
          setProfileCompleted(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setFetching(false);
      }
    };
    loadData();
    checkProfileAccess();
  }, [currentUser]);

  const handleBackToHome = () => navigate("/home");
  const handleResubmit = () => setShowResubmitConfirm(true);
  const confirmResubmit = () => {
    setFormData(prev => ({
      ...prev,
      rejectionReason: ""
    }));
    setShowResubmitConfirm(false);
    setProfileCompleted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleContactSupport = () => window.location.href = "mailto:swathi@uandwe.com?subject=Profile%20Approval%20Query";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submitting
    const errors = {};
    const fieldsToValidate = [
      "firstName", "lastName", "gender", "dateOfBirth", "maritalStatus",
      "mobileNumber", "emergencyNumber", "emergencyRelationship",
      "personalEmailId", "city", "state", "currentResidentialAddress", "permanentResidentialAddress",
      "nationality", "bankName", "bankAccountNumber", "ifscCode", "bankBranch"
    ];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    // Cross-check duplicate errors from existing fieldErrors
    if (fieldErrors.mobileNumber === "Mobile Number already exists.") errors.mobileNumber = fieldErrors.mobileNumber;
    if (fieldErrors.personalEmailId === "Personal Email already exists.") errors.personalEmailId = fieldErrors.personalEmailId;
    if (fieldErrors.employeeNumber === "Employee Number already exists.") errors.employeeNumber = fieldErrors.employeeNumber;
    
    // Validate skills
    if (skills.length === 0) {
      errors.skills = "At least one skill is required.";
    }
    
    // Validate profile photo (mandatory)
    if (!profilePhotoDocument && !formData.profilePhotoLink) {
      errors.profilePhoto = "Profile photo is required.";
    }
    
    // Validate company selection (must be a valid company from the dropdown)
    if (!formData.assignedCompany || !formData.assignedCompany.trim()) {
      errors.assignedCompany = "Please select a company from the dropdown.";
    } else {
      const isValidCompany = companies && companies.some(
        c => c.name?.toLowerCase() === formData.assignedCompany.toLowerCase()
      );
      if (!isValidCompany) {
        errors.assignedCompany = "Please select a valid company from the dropdown.";
      }
    }
    
    // Validate declaration checkbox
    if (!declarationChecked) {
      setDeclarationError("Please confirm the declaration before submitting.");
    }
    
    // Validate conditional fields based on nationality
    if (formData.nationality === "INDIA") {
      if (!formData.aadharNumber) errors.aadharNumber = "Aadhar number is required for Indian nationals.";
      if (!formData.panNumber) errors.panNumber = "PAN number is required for Indian nationals.";
      if (!aadharDocument && !formData.aadharDocumentLink) errors.aadharDocument = "Aadhar card document is required.";
      if (!panDocument && !formData.panDocumentLink) errors.panDocument = "PAN card document is required.";
    } else if (formData.nationality === "USA") {
      if (!formData.ssnNumber) errors.ssnNumber = "SSN number is required for USA nationals.";
    } else if (formData.nationality === "CHINA") {
      if (!formData.nationalId) errors.nationalId = "National ID is required for China nationals.";
    }
    
    // Validate education documents (except post-graduation)
    if (!tenthDocument && !formData.tenthCertificateLink) {
      errors.tenth = "10th certificate is required.";
    }
    if (!twelfthDocument && !formData.twelfthCertificateLink) {
      errors.twelfth = "12th certificate is required.";
    }
    if (!graduationDocument && !formData.graduationCertificateLink) {
      errors.graduation = "Graduation certificate is required.";
    }
    if (!resumeDocument && !formData.resumeDocumentLink) {
      errors.resume = "Resume/CV is required.";
    }
    
    // Block submission if declaration not checked or validation errors exist
    if (Object.keys(errors).length > 0 || !declarationChecked) {
      setFieldErrors(errors);
      setDocumentErrors({
        tenth: errors.tenth,
        twelfth: errors.twelfth,
        graduation: errors.graduation,
        resume: errors.resume,
        aadhar: errors.aadharDocument,
        pan: errors.panDocument,
        profilePhoto: errors.profilePhoto
      });
      if (!declarationChecked) {
        setDeclarationError("Please confirm the declaration before submitting.");
      }
      // Scroll to the first error
      const firstErrorField = document.querySelector('.text-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);
    try {
      const username = currentUser?.username || JSON.parse(localStorage.getItem("user"))?.username;
      if (!username) { alert("User not found"); setLoading(false); return; }
      
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'skills' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add skills as JSON string
      formDataToSend.append("skills", JSON.stringify(skills));
      formDataToSend.append("userId", username);
      
      // Add government ID documents (ONLY for INDIA - Aadhar and PAN)
      if (aadharDocument) formDataToSend.append("aadharDocument", aadharDocument);
      if (panDocument) formDataToSend.append("panDocument", panDocument);
      
      // Add other documents
      if (tenthDocument) formDataToSend.append("tenthCertificate", tenthDocument);
      if (twelfthDocument) formDataToSend.append("twelfthCertificate", twelfthDocument);
      if (resumeDocument) formDataToSend.append("resumeDocument", resumeDocument);
      if (visaDocument) formDataToSend.append("visaDocument", visaDocument);
      if (profilePhotoDocument) formDataToSend.append("profilePhoto", profilePhotoDocument);
      if (graduationDocument) formDataToSend.append("graduationCertificate", graduationDocument);
      if (postGraduationDocument) formDataToSend.append("postGraduationCertificate", postGraduationDocument);
      
      // Check if this is a resubmission (profile was previously rejected)
      const isResubmit = profileStatus === "REJECTED";
      const url = isResubmit 
        ? `${API_BASE_URL}/api/personal-details/resubmit/${username}`
        : `${API_BASE_URL}/api/personal-details`;
      
      const res = await fetch(url, { method: isResubmit ? "PUT" : "POST", body: formDataToSend });
      const result = await res.json();
      
      if (result.success) {
        setShowSuccess(true);
        setProfileCompleted(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert(result.message || "Failed to save.");
        if (result.errors) setServerErrors(result.errors);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving details");
    } finally {
      setLoading(false);
    }
  };

  const completion = computeCompletion(formData);

  if (fetching || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <Sparkles className="absolute inset-2 m-auto w-6 h-6 text-indigo-500 animate-pulse" />
          </div>
          <p className="mt-6 text-gray-500 text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // APPROVED - Show ProfileView with all details
  if (profileCompleted && profileStatus === "APPROVED") {
    return <ProfileView data={formData} onBackToHome={handleBackToHome} />;
  }

  // PENDING or REJECTED - Show ProfileStatusCard
  if (profileCompleted && (profileStatus === "PENDING" || profileStatus === "REJECTED")) {
    return (
      <>
        {showResubmitConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-2">Resubmit profile?</h3>
              <p className="text-sm text-gray-500 mb-6">Your existing details will be pre-filled. Review, make corrections, and resubmit for admin approval.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowResubmitConfirm(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button>
                <button onClick={confirmResubmit} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl">Yes, edit & resubmit</button>
              </div>
            </div>
          </div>
        )}
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 w-full overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            <ProfileStatusCard
              status={profileStatus}
              rejectionReason={formData.rejectionReason}
              onResubmit={handleResubmit}
              onContactSupport={handleContactSupport}
            />
          </div>
        </div>
      </>
    );
  }

  // No Profile or Resubmit - Show Profile Form
  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] flex items-center justify-center">
          <div className="bg-white/90 rounded-2xl p-8 flex flex-col items-center shadow-2xl">
            <div className="relative w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Submitting...</p>
          </div>
        </div>
      )}
      {showSuccess && (
        <div className="fixed top-6 right-6 z-[200] animate-slideInRight">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <CheckCircle size={18} />
            <div>
              <p className="font-semibold text-sm">Profile submitted!</p>
              <p className="text-[11px] text-emerald-100">Pending admin approval.</p>
            </div>
          </div>
        </div>
      )}
      {showResubmitConfirm && !profileCompleted && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Resubmit profile?</h3>
            <p className="text-sm text-gray-500 mb-6">Your existing details will be pre-filled. Review, make corrections, and resubmit for admin approval.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResubmitConfirm(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button>
              <button onClick={confirmResubmit} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl">Yes, edit & resubmit</button>
            </div>
          </div>
        </div>
      )}
      <ProfileFormComponent
        formData={formData}
        onChange={handleChange}
        onBlur={handleBlur}
        onSubmit={handleSubmit}
        onCancel={handleBackToHome}
        fieldErrors={fieldErrors}
        serverErrors={serverErrors}
        loading={loading}
        companies={companies}
        onCompanySelect={handleCompanySelect}
        onCompanyValueChange={handleCompanyValueChange}
        aadharDocument={aadharDocument}
        panDocument={panDocument}
        onAadharUpload={handleAadharUpload}
        onPanUpload={handlePanUpload}
    
        onAadharRemove={handleAadharRemove}
        onPanRemove={handlePanRemove}
      
        tenthDocument={tenthDocument}
        twelfthDocument={twelfthDocument}
        resumeDocument={resumeDocument}
        visaDocument={visaDocument}
        profilePhotoDocument={profilePhotoDocument}
        onTenthUpload={handleTenthUpload}
        onTwelfthUpload={handleTwelfthUpload}
        onResumeUpload={handleResumeUpload}
        onVisaUpload={handleVisaUpload}
        onProfilePhotoUpload={handleProfilePhotoUpload}
        onTenthRemove={handleTenthRemove}
        onTwelfthRemove={handleTwelfthRemove}
        onResumeRemove={handleResumeRemove}
        onVisaRemove={handleVisaRemove}
        onProfilePhotoRemove={handleProfilePhotoRemove}
        graduationDocument={graduationDocument}
        postGraduationDocument={postGraduationDocument}
        onGraduationUpload={handleGraduationUpload}
        onPostGraduationUpload={handlePostGraduationUpload}
        onGraduationRemove={handleGraduationRemove}
        onPostGraduationRemove={handlePostGraduationRemove}
        documentErrors={documentErrors}
        demands={demands}
        showDemandDropdown={showDemandDropdown}
        setShowDemandDropdown={setShowDemandDropdown}
        onDemandSelect={handleDemandSelect}
        currentUserRole={currentUser?.role}
        completion={completion}
        skills={skills}
        onAddSkill={handleAddSkill}
        onRemoveSkill={handleRemoveSkill}
        onSkillInputChange={handleSkillInputChange}
        skillInput={skillInput}
        declarationChecked={declarationChecked}
        onDeclarationChange={handleDeclarationChange}
        declarationError={declarationError}
      />
    </>
  );
};

export default Mypersonaldetails;
