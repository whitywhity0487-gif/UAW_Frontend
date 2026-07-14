// Insurancepolicy.jsx — React + Tailwind CSS (fully converted, zero inline styles)
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Upload, ChevronRight, CheckCircle, FileText, Search, User, Briefcase, UserPlus } from 'lucide-react';
import { API_BASE_URL as GLOBAL_API_BASE_URL } from '../../../config/constants.js';
import PolicySecurity from "./PolicySecurity";
import toast from 'react-hot-toast';

const API_BASE_URL = `${GLOBAL_API_BASE_URL}/api/insurance-policies`;

// ==================== HELPER FUNCTIONS ====================
const formatDateStr = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes("/")) return dateString;
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const renderField = (fieldName, fieldValue) => {
  if (fieldValue === undefined || fieldValue === null || fieldValue === "") return null;

  const formattedName = fieldName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  let displayValue = "-";

  if (fieldValue !== undefined && fieldValue !== null) {
    if (typeof fieldValue === "object" && fieldValue !== null) {
      if (fieldValue.year !== undefined && fieldValue.month !== undefined && fieldValue.day !== undefined) {
        const dateStr = `${fieldValue.year}-${String(fieldValue.month).padStart(2, "0")}-${String(fieldValue.day).padStart(2, "0")}`;
        displayValue = formatDateStr(dateStr);
      } else if (fieldValue instanceof Date && !isNaN(fieldValue)) {
        displayValue = fieldValue.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
      } else if (Array.isArray(fieldValue)) {
        displayValue = fieldValue
          .map((item) => {
            if (item && typeof item === "object" && item.year)
              return `${item.year}-${String(item.month).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`;
            return String(item);
          })
          .join(", ");
        if (displayValue.length > 200) displayValue = displayValue.substring(0, 200) + "...";
      } else {
        try {
          if (fieldValue.toISOString && typeof fieldValue.toISOString === "function") {
            displayValue = formatDateStr(fieldValue.toISOString());
          } else {
            displayValue = JSON.stringify(fieldValue);
            if (displayValue.length > 200) displayValue = displayValue.substring(0, 200) + "...";
          }
        } catch {
          displayValue = String(fieldValue);
        }
      }
    } else {
      displayValue = String(fieldValue);
      if (displayValue.length > 200) displayValue = displayValue.substring(0, 200) + "...";
    }
  }

  return (
    <tr key={fieldName}>
      <td className="border border-gray-300 p-2 font-semibold w-1/3 text-gray-700 bg-gray-50">{formattedName}</td>
      <td className="border border-gray-300 p-2 text-gray-800">{displayValue}</td>
    </tr>
  );
};

// ==================== SHARED SECTION HEADER ====================
const SectionHeader = ({ title }) => (
  <div className="bg-[#1E3A5F] text-white px-3 py-1.5 font-bold text-[13px] mt-5">
    {title}
  </div>
);

const FieldTable = ({ fields, policy }) => (
  <table className="w-full border-collapse text-[13px] border border-gray-300">
    <tbody>
      {fields.map((f) => renderField(f, policy[f]))}
    </tbody>
  </table>
);

// ==================== POLICY CONTENT (MARKDOWN RENDERER) ====================
const PolicyContent = ({ description, accentColor = "#2563EB" }) => {
  if (!description) return null;

  const sectionRegex = /===\s*(.+?)\s*===/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = sectionRegex.exec(description)) !== null) {
    if (match.index > lastIndex) {
      const text = description.slice(lastIndex, match.index).trim();
      if (text) parts.push({ type: "text", content: text });
    }
    parts.push({ type: "heading", content: match[1].trim() });
    lastIndex = sectionRegex.lastIndex;
  }
  if (lastIndex < description.length) {
    const text = description.slice(lastIndex).trim();
    if (text) parts.push({ type: "text", content: text });
  }

  const sections = [];
  let currentHeading = null;
  let currentBody = [];
  parts.forEach((part) => {
    if (part.type === "heading") {
      if (currentHeading !== null)
        sections.push({ heading: currentHeading, body: currentBody.join("\n").trim() });
      currentHeading = part.content;
      currentBody = [];
    } else {
      currentBody.push(part.content);
    }
  });
  if (currentHeading !== null)
    sections.push({ heading: currentHeading, body: currentBody.join("\n").trim() });

  return (
    <div className="flex flex-col gap-11 mt-6">
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.heading && (
            <div className="flex items-center gap-3.5 mb-5">
              <span
                className="text-[13px] font-bold tracking-[0.13em] uppercase whitespace-nowrap"
                style={{ color: accentColor, fontFamily: "'DM Sans', sans-serif" }}
              >
                {section.heading}
              </span>
              <div className="flex-1 h-px bg-[#E5E7EB]" />
            </div>
          )}

          <div className="flex flex-col gap-3.5">
            {section.body.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              const numMatch = trimmed.match(/^(\d+)\)\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={i} className="flex gap-3.5 items-start">
                    <span
                      className="w-[27px] h-[27px] rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-[3px]"
                      style={{
                        backgroundColor: `${accentColor}20`,
                        color: accentColor,
                        border: `1px solid ${accentColor}40`,
                      }}
                    >
                      {numMatch[1]}
                    </span>
                    <p className="text-[15px] text-[#374151] leading-[1.7] m-0">{numMatch[2]}</p>
                  </div>
                );
              }

              const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
              if (bulletMatch) {
                return (
                  <div key={i} className="flex gap-3.5 items-start">
                    <span
                      className="w-[27px] h-[27px] rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-[3px]"
                      style={{
                        backgroundColor: `${accentColor}20`,
                        color: accentColor,
                        border: `1px solid ${accentColor}40`,
                      }}
                    >
                      -
                    </span>
                    <p className="text-[15px] text-[#374151] leading-[1.7] m-0">{bulletMatch[1]}</p>
                  </div>
                );
              }

              if (trimmed.startsWith("|")) {
                const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
                const isDivider = cells.every((c) => /^[-:]+$/.test(c));
                if (isDivider) return null;
                return (
                  <div
                    key={i}
                    className="grid gap-px bg-[#F3F4F6] border border-[#E5E7EB] rounded-md overflow-hidden text-[13px]"
                    style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}
                  >
                    {cells.map((cell, ci) => (
                      <div
                        key={ci}
                        className={`text-gray-800 px-3 py-2 bg-white ${ci === 0 ? "font-semibold" : "font-normal"}`}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <p key={i} className="text-[14px] text-[#4B5563] leading-[1.7] m-0">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== MODALS ====================
const AddEditPolicyModal = ({ isOpen, onClose, onSave, policy = null }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const isEditing = !!policy;

  useEffect(() => {
    if (policy) {
      const { id, created_at, updated_at, ...rest } = policy;
      setFormData({
        product_name: rest.product_name || rest.productName || rest.policy_name || "",
        policy_number: rest.policy_number || rest.policyNumber || "",
        coverage_type: rest.coverage_type || "",
        policy_type: rest.policy_type || "",
        description: rest.description || "",
        ...rest,
      });
    } else {
      setFormData({ product_name: "", policy_number: "", coverage_type: "", policy_type: "", nationality: "", description: "" });
    }
  }, [policy, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_name && !formData.policy_name) {
      toast.error("Please provide at least a product name or policy name");
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save policy");
    } finally {
      setLoading(false);
    }
  };

  const standardKeys = ["product_name", "policy_number", "coverage_type", "policy_type", "nationality"];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[90%] max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0 bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900 m-0">
              {isEditing ? "Edit Insurance Policy" : "Add New Insurance Policy"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none bg-transparent border-0 cursor-pointer p-1 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-6 overflow-y-auto flex-1 bg-white">

            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              Primary Details
            </h3>
            <div className="grid grid-cols-2 gap-5 mb-8">
              {standardKeys.map((key) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">
                    {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  {key === "nationality" ? (
                    <select
                      value={formData[key] || ""}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white shadow-sm"
                    >
                      <option value="">Select Nationality</option>
                      <option value="INDIA">India</option>
                      <option value="CHINA">China</option>
                      <option value="USA">USA</option>
                      <option value="GLOBAL">Global (All)</option>
                      <option value="ADMIN_ONLY">Admin Only</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[key] || ""}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      placeholder={`Enter ${key.replace(/_/g, " ")}`}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Policy Content (Markdown & Tables)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Paste the entire document here. Use <code>=== Header ===</code> for sections and <code>| Field | Value |</code> for tables.
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-6 relative">
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Paste insurance document content here..."
                className="w-full h-80 px-4 py-4 bg-transparent border-none outline-none text-sm font-mono text-gray-700 resize-y min-h-[320px]"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 flex-shrink-0 bg-gray-50/80 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold cursor-pointer hover:bg-gray-50 shadow-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 rounded-lg bg-gray-900 text-white font-bold cursor-pointer hover:bg-gray-800 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : isEditing ? "Update Policy" : "Create Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, policyTitle }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[90%] max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-center text-xl font-semibold text-gray-900 mb-3">Delete Policy?</h3>
          <p className="text-center text-gray-500 text-sm mb-6">
            Are you sure you want to delete{" "}
            <strong className="text-gray-800">"{policyTitle}"</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2.5 rounded-lg bg-red-600 text-white font-semibold cursor-pointer hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== HELPER: DYNAMIC FIELDS ====================
const addUnmappedFieldsToSection = (sections, policy, sectionName) => {
  const allMappedFields = new Set(sections.flatMap(s => s.fields));
  const unmapped = Object.keys(policy).filter(k => 
    !allMappedFields.has(k) && 
    !["id", "user_id", "updated_at", "created_at"].includes(k) &&
    policy[k] !== undefined && policy[k] !== null && policy[k] !== ""
  );
  if (unmapped.length > 0) {
    const targetSection = sections.find(s => s.title === sectionName);
    if (targetSection) {
      targetSection.fields.push(...unmapped);
    } else {
      sections.push({ title: sectionName, fields: unmapped });
    }
  }
};

// ==================== POLICY SCHEDULE: GENERIC ====================
const GenericPolicySchedule = ({ policy }) => {
  const ignoredFields = ["id", "user_id", "updated_at", "created_at", "description"];
  
  // Group standard fields in the first section
  const primaryFields = ["product_name", "policy_name", "policy_number", "coverage_type", "policy_type", "nationality", "country"].filter(f => policy[f]);
  
  // Group all other fields in the second section (if they somehow exist)
  const dynamicFields = Object.keys(policy).filter(k => 
    !ignoredFields.includes(k) &&
    !primaryFields.includes(k) &&
    policy[k] !== undefined && policy[k] !== null && policy[k] !== ""
  );

  return (
    <div className="font-sans text-black p-8 bg-white">
      <div className="text-right mb-2">
        <span className="text-[#1E3A5F] font-bold uppercase">{policy.policy_type || policy.coverage_type || "INSURANCE"}</span>
      </div>
      <div className="text-[#1E3A5F] font-bold text-lg mb-1">
        {policy.product_name || policy.policy_name || "Insurance"} — Policy Schedule
      </div>
      {(policy.policy_number) && (
        <div className="font-bold mb-2 text-black">Policy No. {policy.policy_number}</div>
      )}

      {primaryFields.length > 0 && (
        <>
          <SectionHeader title="Primary Details" />
          <FieldTable fields={primaryFields} policy={policy} />
        </>
      )}

      {dynamicFields.length > 0 && (
        <>
          <SectionHeader title="Additional Details" />
          <FieldTable fields={dynamicFields} policy={policy} />
        </>
      )}

      {policy.description && (
        <PolicyContent description={policy.description} accentColor="#2563EB" />
      )}
    </div>
  );
};

// ==================== POLICY SCHEDULE: SHANGHAI SOCIAL INSURANCE ====================
const ShanghaiSocialInsuranceSchedule = ({ policy }) => {
  const basicInfoFields = ["id", "product_name", "policy_name", "policy_type", "description", "country", "city", "country_of_operation"];
  const registrationFields = ["registration_authority", "registration_deadline_text", "registration_deadline_days", "late_registration_consequence", "registration_requirement"];
  const coverageFields = ["coverage_medical", "coverage_pension", "coverage_work_injury", "coverage_unemployment", "coverage_maternity", "medical_covered_inpatient", "medical_covered_outpatient", "medical_covered_chronic_disease", "medical_covered_basic_maternity"];
  const notCoveredFields = ["medical_not_covered_imported_drugs", "medical_not_covered_private_hospitals", "medical_not_covered_vip_wards", "medical_not_covered_dental", "medical_not_covered_vision", "medical_not_covered_routine_physical", "medical_not_covered_vaccines", "medical_not_covered_above_limit", "medical_annual_limit", "gap_note", "supplementary_insurance_recommendation", "supplementary_insurance_note"];
  const proofFields = ["proof_document_1", "proof_document_2", "proof_documents_note", "provider_note"];
  const otherFields = ["is_government", "is_mandatory", "applicable_to", "payment_deadline", "source_file", "created_at", "page_1_marker", "page_2_marker", "raw_page_1_text", "raw_page_2_text", "raw_text_full"];

  const allMappedFields = new Set([...basicInfoFields, ...registrationFields, ...coverageFields, ...notCoveredFields, ...proofFields, ...otherFields, "checklist_task_1", "checklist_deadline_1", "checklist_task_2", "checklist_deadline_2", "checklist_task_3", "checklist_deadline_3", "checklist_task_4", "checklist_deadline_4"]);
  const unmapped = Object.keys(policy).filter(k => 
    !allMappedFields.has(k) && 
    !["id", "user_id", "updated_at", "created_at"].includes(k) &&
    policy[k] !== undefined && policy[k] !== null && policy[k] !== ""
  );
  if (unmapped.length > 0) {
    otherFields.push(...unmapped);
  }

  return (
    <div className="font-sans text-black p-8 bg-white">
      <div className="text-right mb-2">
        <span className="text-[#1E3A5F] font-bold">SOCIAL INSURANCE</span>
      </div>
      <div className="text-[#1E3A5F] font-bold text-lg mb-1">
        {policy.policy_name || policy.product_name || "Shanghai Social Insurance"}
      </div>

      <SectionHeader title="1. Basic Information" />
      <FieldTable fields={basicInfoFields} policy={policy} />

      <SectionHeader title="2. Registration Details" />
      <FieldTable fields={registrationFields} policy={policy} />

      <SectionHeader title="3. Cost Sharing" />
      <table className="w-full border-collapse text-[13px] border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2 font-bold bg-gray-50 text-left">Coverage</th>
            <th className="border border-gray-300 p-2 font-bold bg-gray-50 text-left">Company Pays</th>
            <th className="border border-gray-300 p-2 font-bold bg-gray-50 text-left">Employee Pays</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Medical Insurance", "company_medical_rate", "employee_medical_rate"],
            ["Pension", "company_pension_rate", "employee_pension_rate"],
            ["Work Injury", "company_work_injury_rate", "employee_work_injury_rate"],
            ["Unemployment", "company_unemployment_rate", "employee_unemployment_rate"],
            ["Maternity", "company_maternity_rate", "employee_maternity_rate"],
          ].map(([label, cKey, eKey]) => (
            <tr key={label}>
              <td className="border border-gray-300 p-2">{label}</td>
              <td className="border border-gray-300 p-2">{policy[cKey] || "-"}</td>
              <td className="border border-gray-300 p-2">{policy[eKey] || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {policy.rate_note && <p className="text-sm text-gray-500 mt-1 px-2">{policy.rate_note}</p>}

      <SectionHeader title="4. Covered Benefits" />
      <FieldTable fields={coverageFields} policy={policy} />

      <SectionHeader title="5. NOT Covered" />
      <FieldTable fields={notCoveredFields} policy={policy} />

      <SectionHeader title="6. Proof Documents" />
      <FieldTable fields={proofFields} policy={policy} />

      <SectionHeader title="7. HR Operations Checklist" />
      <table className="w-full border-collapse text-[13px] border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2 font-bold bg-gray-50 text-left">Task</th>
            <th className="border border-gray-300 p-2 font-bold bg-gray-50 text-left">Deadline</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map((n) => (
            <tr key={n}>
              <td className="border border-gray-300 p-2">{policy[`checklist_task_${n}`] || "-"}</td>
              <td className="border border-gray-300 p-2">{policy[`checklist_deadline_${n}`] || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionHeader title="8. Additional Details" />
      <FieldTable fields={otherFields} policy={policy} />
    </div>
  );
};

// ==================== POLICY SCHEDULE: GROUP ACTIV HEALTH ====================
const GroupActivHealthSchedule = ({ policy }) => {
  const sections = [
    { title: "Office Details", fields: ["policy_issuing_office", "policy_servicing_office"] },
    { title: "Intermediary Details", fields: ["intermediary_name", "intermediary_code", "intermediary_contact", "intermediary_email"] },
    { title: "Insurer Details", fields: ["insurer_name", "insurer_cin", "insurer_email", "insurer_website", "insurer_irda_registration_no", "insurer_registered_office", "toll_free_number", "uin"] },
    { title: "TPA Details", fields: ["tpa_name", "tpa_id", "tpa_address"] },
    { title: "Policyholder Details", fields: ["policyholder_name", "policyholder_address", "policyholder_contact_number", "policyholder_email", "policyholder_gstin"] },
    { title: "Policy Details", fields: ["product_name", "product_code", "policy_number", "policy_tenure", "policy_category", "premium_payment_frequency", "group_type", "start_date", "start_time", "start_date_time", "expiry_date", "expiry_time", "policy_year"] },
    { title: "Coverage Details", fields: ["coverage_details_name", "coverage_benefit", "total_sum_insured", "base_cover_inpatient", "hospital_room_non_icu", "hospital_room_non_icu_exact", "hospital_room_icu", "hospital_room_icu_exact", "room_rent_normal_percent", "room_rent_max_normal", "room_rent_icu_percent", "room_rent_max_icu", "hospital_room_rent_exact"] },
    { title: "Additional Covers", fields: ["ayush_treatment", "ayush_benefit_exact", "ayush_condition", "ayush_limit_percent", "ayush_exclusions", "obesity_treatment", "modern_procedures", "modern_procedures_limit", "modern_treatment_exact", "modern_procedures_list", "hiv_aids_std_cover", "mental_illness_hospitalization", "mental_illness_condition", "mental_illness_limit", "day_care_treatment", "domiciliary_hospitalization", "organ_donor_expenses", "organ_donor_days", "pre_hospitalization_coverage", "pre_hospitalization_days", "post_hospitalization_coverage", "post_hospitalization_days", "pre_post_hospitalization"] },
    { title: "Maternity Benefits", fields: ["maternity_benefit_option", "maternity_benefit_exact_pdf", "maternity_normal_delivery_limit", "maternity_c_section_limit", "maternity_other_limit", "maternity_pre_natal", "maternity_post_natal", "maternity_pre_post_natal_limit", "maternity_pre_post_natal_within", "maternity_new_born_expenses", "maternity_child_limit", "maternity_waiting_period", "maternity_applicable_to"] },
    { title: "Waivers & Waiting Periods", fields: ["waiver_53", "waiver_54", "waiver_55", "waiver_56", "waiver_57", "waiver_58", "waiver_59", "waiver_60", "waiver_61", "waiver_62", "waiver_63", "waiver_64", "waiver_65", "waiver_66", "waiver_67", "waiver_68", "waiver_69", "waiver_70", "waiver_70_note", "waiver_71", "waiver_71_note", "waiver_72", "thirty_days_waiting", "two_years_waiting"] },
    { title: "Insured Persons", fields: ["relationship_type_self", "relationship_type_dependent", "number_of_lives_self", "number_of_lives_dependent", "total_lives", "insured_persons", "nominee_details", "family_definition", "age_band_self", "age_band_spouse", "age_band_spouse_symbol", "age_band_child", "age_band_child_symbol"] },
    { title: "Cashless Facility", fields: ["cashless_feature", "cashless_feature_title", "cashless_description", "cashless_letter", "cashless_process", "cashless_how_to_header", "cashless_channel_1", "cashless_channel_2", "cashless_channel_3", "planned_hospitalization_intimation", "cashless_planned_hospitalization_intimation", "emergency_hospitalization_intimation", "cashless_emergency_hospitalization_intimation", "preferred_provider_network", "comprehensive_corporate_floater", "coverage_continuity_pink_slip", "wellness_coach"] },
    { title: "Sub-limits & Special Conditions", fields: ["sub_limits", "sub_limit_surgeon_fees", "extension_cataract_coverage", "cataract_coverage_note", "cataract_exact", "lasik_surgery", "cyberknife_exact", "co_insurance_details", "co_payment_status", "reasonable_customary_charges"] },
    { title: "Ambulance Coverage", fields: ["road_ambulance_limit", "road_ambulance_coverage", "road_ambulance_note", "road_ambulance_sr_no", "air_ambulance_limit", "air_ambulance_coverage", "air_ambulance_covered", "air_ambulance_sr_no"] },
    { title: "Additional Information", fields: ["created_at", "source_file", "page_1_marker", "page_2_marker", "page_3_marker", "page_4_marker", "page_5_marker", "page_6_marker", "raw_page_1_text", "raw_page_2_text", "raw_page_3_text", "raw_page_4_text", "raw_page_6_text", "trademark_disclaimer_page1", "trademark_disclaimer_page3", "trademark_disclaimer_page4", "aditya_birla_header"] },
  ];

  addUnmappedFieldsToSection(sections, policy, "Additional Information");

  return (
    <div className="font-sans text-black p-8 bg-white">
      <div className="text-right mb-2">
        <span className="text-[#1E3A5F] font-bold">HEALTH INSURANCE</span>
      </div>
      <div className="text-[#1E3A5F] font-bold text-lg mb-1">
        {policy.product_name || "Group Activ Health"} — Policy Schedule
      </div>
      <div className="font-bold mb-2 text-black">Policy No. {policy.policy_number}</div>

      {sections.map(({ title, fields }) => {
        const hasData = fields.some(f => policy[f] !== undefined && policy[f] !== null && policy[f] !== "");
        if (!hasData) return null;
        return (
          <React.Fragment key={title}>
            <SectionHeader title={title} />
            <FieldTable fields={fields} policy={policy} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ==================== POLICY SCHEDULE: GROUP ACTIV SECURE ====================
const GroupActivSecureSchedule = ({ policy }) => {
  const sections = [
    { title: "Office Details", fields: ["policy_issuing_office", "policy_servicing_office"] },
    { title: "Intermediary Details", fields: ["intermediary_name", "intermediary_code", "intermediary_contact", "intermediary_email"] },
    { title: "Policyholder Details", fields: ["policyholder_name", "policyholder_address", "policyholder_contact_number", "policyholder_email", "policyholder_gstin"] },
    { title: "Policy Details", fields: ["product_name", "plan_name", "product_code", "policy_number", "policy_tenure", "policy_category", "premium_payment_frequency", "group_type", "start_date", "start_time", "start_date_time", "policy_year", "insurance_category", "sac_code", "uin"] },
    { title: "Coverage Details", fields: ["coverage_type", "capital_sum_insured", "accidental_death_cover", "permanent_partial_disablement", "permanent_total_disablement", "medical_expenses", "modification_benefit_residence", "modification_benefit_vehicle", "education_fund_for_children", "burns_benefit", "compassionate_visit", "funeral_expenses", "coma_benefit", "repatriation_of_mortal_remains", "road_ambulance_cover", "temporary_total_disablement"] },
    { title: "Special Conditions", fields: ["special_condition_terrorism_cover", "special_condition_exclusions", "special_condition_age_group", "special_condition_global_coverage", "special_condition_animal_snake_bite", "special_condition_insured_description", "special_condition_sum_insured_criteria", "special_condition_sum_insured_criteria_type", "special_condition_max_sum_insured", "special_condition_aoa", "special_condition_aoy", "special_condition_armed_guards_exclusion", "per_mile_rate"] },
    { title: "Insured Persons", fields: ["insured_personal_accident_self_lives", "insured_personal_accident_dependent_lives", "insured_critical_illness_self_lives", "insured_critical_illness_dependent_lives", "insured_hospital_cash_self_lives", "insured_hospital_cash_dependent_lives", "insured_persons", "nominee_details"] },
    { title: "TPA Details", fields: ["tpa_name", "tpa_id", "tpa_address"] },
    { title: "Premium Details", fields: ["net_premium", "cgst_percent", "cgst_amount", "sgst_percent", "sgst_amount", "igst_percent", "igst_amount", "gross_premium", "gst_registration_no", "gst_declaration"] },
    { title: "Cashless Facility", fields: ["cashless_feature", "cashless_feature_title", "cashless_description", "cashless_letter", "cashless_process", "cashless_how_to_header", "cashless_channel_1", "cashless_channel_2", "cashless_channel_3", "cashless_planned_hospitalization_intimation", "cashless_emergency_hospitalization_intimation"] },
    { title: "Additional Information", fields: ["co_insurance_details", "toll_free_number", "created_at", "updated_at", "source_file", "page_1_marker", "page_2_marker", "page_3_marker", "raw_page_1_text", "raw_page_1_coverage", "raw_page_2_text", "raw_page_2_insured_details", "raw_page_3_text", "aditya_birla_header"] },
  ];

  addUnmappedFieldsToSection(sections, policy, "Additional Information");

  return (
    <div className="font-sans text-black p-8 bg-white">
      <div className="text-right mb-2">
        <span className="text-[#1E3A5F] font-bold">PERSONAL ACCIDENT INSURANCE</span>
      </div>
      <div className="text-[#1E3A5F] font-bold text-lg mb-1">
        {policy.product_name || "Group Activ Secure"} — Policy Schedule
      </div>
      <div className="font-bold mb-2 text-black">Policy No. {policy.policy_number}</div>

      {sections.map(({ title, fields }) => {
        const hasData = fields.some(f => policy[f] !== undefined && policy[f] !== null && policy[f] !== "");
        if (!hasData) return null;
        return (
          <React.Fragment key={title}>
            <SectionHeader title={title} />
            <FieldTable fields={fields} policy={policy} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ==================== POLICY SCHEDULE: UANDWE WORKERS COMPENSATION ====================
const UandWeWorkersCompensationSchedule = ({ policy }) => {
  const sections = [
    { title: "Insurer Details", fields: ["insurer_name", "insurer_naic", "contact_phone", "contact_website"] },
    { title: "Producer Details", fields: ["producer_name", "producer_address", "producer_phone", "producer_fax", "producer_email", "producer_license"] },
    { title: "Policyholder Details", fields: ["customer_address", "city", "state", "zip", "country"] },
    { title: "Policy Details", fields: ["product_name", "policy_name", "policy_type", "policy_number", "policy_effective_date", "policy_expiration_date", "description", "is_mandatory"] },
    { title: "Coverage & Limits", fields: ["coverage_type", "general_liability_type", "employers_liability_limits", "limit_each_accident", "limit_disease_each_employee", "limit_disease_policy_limit", "each_occurrence", "general_aggregate", "products_completed_operations_aggregate", "personal_and_advertising_injury", "damage_to_rented_premises", "medical_expense_any_one_person", "coverage_medical", "coverage_pension", "coverage_work_injury", "coverage_unemployment", "coverage_maternity"] },
    { title: "Special Conditions", fields: ["description_of_operations", "important_note", "disclaimer", "certificate_holder_rights", "limit_note", "gap_note", "provider_note"] },
    { title: "Additional Details", fields: ["source_file", "created_at", "updated_at"] }
  ];

  addUnmappedFieldsToSection(sections, policy, "Additional Details");

  return (
    <div className="font-sans text-black p-8 bg-white">
      <div className="text-right mb-2">
        <span className="text-[#1E3A5F] font-bold">WORKERS COMPENSATION</span>
      </div>
      <div className="text-[#1E3A5F] font-bold text-lg mb-1">
        {policy.product_name || "UANDWE Workers Compensation Insurance"} — Policy Schedule
      </div>
      <div className="font-bold mb-2 text-black">Policy No. {policy.policy_number}</div>

      {sections.map(({ title, fields }) => {
        const hasData = fields.some(f => policy[f] !== undefined && policy[f] !== null && policy[f] !== "");
        if (!hasData) return null;
        return (
          <React.Fragment key={title}>
            <SectionHeader title={title} />
            <FieldTable fields={fields} policy={policy} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ==================== POLICY ICON ====================
const PolicyIcon = ({ size = 18 }) => (
  <svg width={size} height={size} fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

// ==================== MAIN COMPONENT ====================
const InsurancePolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nationality, setNationality] = useState(null);

  const [allEmployees, setAllEmployees] = useState([]);
  const [employeeHealthCard, setEmployeeHealthCard] = useState(null);
  const [uploadingMap, setUploadingMap] = useState({});
  const [healthCardSearchTerm, setHealthCardSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToEdit, setPolicyToEdit] = useState(null);
  const [policyToDelete, setPolicyToDelete] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndNationality = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      try {
        const user = JSON.parse(storedUser);
        const adminCheck = ["admin", "Admin", "ADMIN"].includes(user.role);
        setIsAdmin(adminCheck);

        if (!adminCheck) {
          let nat = user.nationality || "INDIA";
          const userIdToFetch = user.username || user.employeeId || user.userId;
          if (userIdToFetch) {
            try {
              const res = await axios.get(`${GLOBAL_API_BASE_URL}/api/personal-details?userId=${userIdToFetch}`);
              if (res.data?.data) {
                nat = res.data.data.nationality || nat;
                setEmployeeHealthCard(res.data.data);
              }
            } catch { }
          }
          setNationality(nat.toUpperCase());
        } else {
          setNationality("ADMIN");
          try {
            const res = await axios.get(`${GLOBAL_API_BASE_URL}/api/personal-details`);
            if (res.data?.success) setAllEmployees(res.data.data);
          } catch { }
        }
      } catch { }
    };
    fetchUserAndNationality();
  }, []);

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE_URL);
      if (res.data.success) setPolicies(res.data.data);
    } catch {
      setError("Failed to fetch policies. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = async (data) => {
    const res = await axios.post(API_BASE_URL, data);
    if (res.data.success) { await fetchPolicies(); setActiveTabIndex(policies.length); }
    return res;
  };

  const handleEditPolicy = async (data) => {
    const res = await axios.put(`${API_BASE_URL}/${policyToEdit.id}`, data);
    if (res.data.success) await fetchPolicies();
    return res;
  };

  const handleDeletePolicy = async () => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/${policyToDelete.id}`);
      if (res.data.success) {
        await fetchPolicies();
        setActiveTabIndex(0);
        setIsDeleteModalOpen(false);
        setPolicyToDelete(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete policy");
    }
  };

  const handleHealthCardFileChange = async (employeeNumber, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) { toast.error("File size exceeds 1MB limit"); e.target.value = null; return; }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) { toast.error("Invalid file type. Only JPG, PNG, and PDF are allowed."); e.target.value = null; return; }

    setUploadingMap((p) => ({ ...p, [employeeNumber]: true }));
    const fd = new FormData();
    fd.append("healthCard", file);
    try {
      const res = await axios.post(`${GLOBAL_API_BASE_URL}/api/personal-details/upload-health-card/${employeeNumber}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setAllEmployees((prev) => prev.map((emp) => emp.employeeNumber === employeeNumber ? { ...emp, ...res.data.data } : emp));
        toast.success("Health Card uploaded successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error uploading health card");
    } finally {
      setUploadingMap((p) => ({ ...p, [employeeNumber]: false }));
      e.target.value = null;
    }
  };

  const filteredPolicies = policies.filter((policy) => {
    if (isAdmin) return true;
    if (!nationality) return false;

    // 1. Check direct nationality field if present
    if (policy.nationality) {
      const polNat = policy.nationality.toUpperCase();
      if (polNat === "ADMIN_ONLY") return false; // Handled by isAdmin check above
      if (polNat === "GLOBAL") return true;
      return polNat === nationality.toUpperCase();
    }

    // 2. Fallback to hardcoded logic for old policies
    const pName = (policy.product_name || policy.productName || policy.policy_name || "").toLowerCase();
    if (nationality === "INDIA") return pName.includes("group activ secure") || pName.includes("group activ health");
    if (nationality === "CHINA") return pName.includes("shanghai social insurance");
    return false;
  });

  const safeActiveTabIndex =
    typeof activeTabIndex === "number" && activeTabIndex >= filteredPolicies.length
      ? Math.max(0, filteredPolicies.length - 1)
      : activeTabIndex;

  const selectedPolicy = typeof safeActiveTabIndex === "number" ? filteredPolicies[safeActiveTabIndex] || null : null;

  const renderPolicySchedule = () => {
    if (!selectedPolicy) return null;
    const pName = (selectedPolicy.product_name || selectedPolicy.productName || selectedPolicy.policy_name || "").toLowerCase();
    if (pName.includes("shanghai") || selectedPolicy.country === "China" || selectedPolicy.policy_type === "Social Insurance")
      return <ShanghaiSocialInsuranceSchedule policy={selectedPolicy} />;
    if (pName.includes("uandwe") || selectedPolicy.policy_type?.includes("Workers Compensation") || pName.includes("workers compensation"))
      return <UandWeWorkersCompensationSchedule policy={selectedPolicy} />;
    if (pName.includes("group activ secure") || selectedPolicy.coverage_type === "Group Activ Secure - Personal Accident")
      return <GroupActivSecureSchedule policy={selectedPolicy} />;
    if (pName.includes("group activ health") || pName.includes("activ health"))
      return <GroupActivHealthSchedule policy={selectedPolicy} />;
      
    // Fallback for new custom policies added via Copy-Paste
    return <GenericPolicySchedule policy={selectedPolicy} />;
  };

  const tabClass = (idx) =>
    [
      "flex flex-col items-center justify-center gap-0.5 px-4 py-3.5 bg-transparent border-0 cursor-pointer text-sm transition-all whitespace-nowrap min-w-max",
      activeTabIndex === idx
        ? "border-b-[3px] border-[#2563EB] text-[#1E3A5F] font-bold"
        : "border-b-[3px] border-transparent text-gray-500 font-medium hover:text-gray-700",
    ].join(" ");

  const getTabDisplayName = (policy, index) => {
    if (policy.product_name === "Group Activ Secure") return "Group Activ Secure";
    if (policy.productName === "Group Activ Health") return "Group Activ Health";
    if (policy.policy_name === "Shanghai Social Insurance - Mandatory Government Insurance") return "Shanghai Social Insurance";
    return policy.product_name || policy.productName || policy.policy_name || `Policy ${index + 1}`;
  };

  const filteredEmployees = allEmployees.filter((emp) => {
    if (emp.nationality && emp.nationality.toUpperCase() !== "INDIA") return false;

    if (!healthCardSearchTerm) return true;
    const term = healthCardSearchTerm.toLowerCase();
    const num = (emp.employeeNumber || "").toLowerCase();
    const name = (emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`).toLowerCase();
    return num.includes(term) || name.includes(term);
  });

  const coverageLabel = selectedPolicy
    ? selectedPolicy.coverage_type
      ? "PERSONAL ACCIDENT"
      : selectedPolicy.policy_type === "Social Insurance"
        ? "SOCIAL INSURANCE"
        : "HEALTH INSURANCE"
    : "";

  return (
    <PolicySecurity isAdmin={isAdmin}>
      <div className="min-h-screen bg-[#F8F9FB] w-full font-[DM_Sans,Inter,sans-serif]">

        {/* ── Top Tab Navbar ── */}
        <div className="flex items-center bg-white border-b border-[#E5E7EB] px-6 py-3 min-h-[64px] sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 bg-transparent border border-gray-200 rounded-lg cursor-pointer px-3.5 py-2 mr-6 text-[13px] text-gray-600 font-medium hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-2.5 mr-8 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex items-center justify-center">
              <PolicyIcon size={18} />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Insurance Policy</span>
          </div>

          {/* Tabs */}
          <div className="flex flex-1 justify-center items-center overflow-x-auto hide-scrollbar gap-1 px-2">
            {loading ? (
              <span className="py-4 px-6 text-gray-400 text-sm">Loading policies...</span>
            ) : error ? (
              <span className="py-4 px-6 text-red-500 text-sm">{error}</span>
            ) : isAdmin ? (
              <select
                value={activeTabIndex}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveTabIndex(val === "HEALTH_CARDS" ? val : Number(val));
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-[14px] text-gray-700 outline-none focus:border-[#2563EB] bg-white cursor-pointer min-w-[300px] shadow-sm font-medium"
              >
                {filteredPolicies.length > 0 && (
                  <optgroup label="Insurance Policies">
                    {filteredPolicies.map((policy, index) => (
                      <option key={policy.id || index} value={index}>
                        {getTabDisplayName(policy, index)} {policy.policy_number ? `(${policy.policy_number})` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Admin Section">
                  <option value="HEALTH_CARDS">Health Cards Management</option>
                </optgroup>
              </select>
            ) : (
              <>
                {filteredPolicies.length === 0 ? (
                  <span className="py-4 px-6 text-gray-400 text-sm">
                    {!nationality ? "Checking nationality..." : "No policies found for your nationality"}
                  </span>
                ) : (
                  filteredPolicies.map((policy, index) => (
                    <button
                      key={policy.id || index}
                      onClick={() => setActiveTabIndex(index)}
                      className={tabClass(index)}
                    >
                      <span>{getTabDisplayName(policy, index)}</span>
                      <span className={`text-[11px] font-normal ${activeTabIndex === index ? "text-[#2563EB]" : "text-gray-400"}`}>
                        {policy.policy_number || policy.policyNumber || ""}
                      </span>
                    </button>
                  ))
                )}
                {nationality === "INDIA" && (
                  <button onClick={() => setActiveTabIndex("HEALTH_CARD")} className={tabClass("HEALTH_CARD")}>
                    <span>Health Card</span>
                    <span className={`text-[11px] font-normal ${activeTabIndex === "HEALTH_CARD" ? "text-[#2563EB]" : "text-gray-400"}`}>
                      Employee
                    </span>
                  </button>
                )}
              </>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 text-[13.5px] font-semibold text-white bg-gray-900 border-0 rounded-lg px-4.5 py-2.5 cursor-pointer hover:bg-gray-800 transition-colors flex-shrink-0 px-[18px] py-[9px]"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add New Policy
            </button>
          )}
        </div>

        {/* ── Health Cards (Admin) ── */}
        {activeTabIndex === "HEALTH_CARDS" && isAdmin && (
          <div className="w-full px-10 pt-8 pb-5">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
              <div className="h-[3px] bg-gradient-to-r from-[#1E3A5F] via-[#2563EB] to-[#60A5FA]" />
              <div className="px-10 py-7">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Health Card Management</h2>
                  <input
                    type="text"
                    placeholder="Search by ID or Name..."
                    value={healthCardSearchTerm}
                    onChange={(e) => setHealthCardSearchTerm(e.target.value)}
                    className="px-3.5 py-2 rounded-lg border border-gray-300 text-sm outline-none w-[250px] focus:border-gray-400"
                  />
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left">
                      {["Employee Number", "Employee Name", "Health Card Status", "Action"].map((h) => (
                        <th key={h} className="p-3 text-gray-500 text-sm font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => {
                      const empNum = emp.employeeNumber || "N/A";
                      const hasCard = !!emp.healthCardLink;
                      const isUploading = uploadingMap[empNum];
                      const empName = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`;
                      return (
                        <tr key={emp.userId || empNum} className="border-b border-gray-100">
                          <td className="p-3 text-sm">{empNum}</td>
                          <td className="p-3 text-sm">{empName}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-[13px] font-medium ${hasCard ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                              {hasCard ? "Available" : "Not Available"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <label className={`cursor-pointer bg-gray-900 text-white px-3 py-1.5 rounded-md text-[13px] font-medium transition-opacity ${isUploading ? "opacity-60 pointer-events-none" : "hover:bg-gray-800"}`}>
                                {isUploading ? "Uploading..." : hasCard ? "Replace" : "Upload"}
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleHealthCardFileChange(empNum, e)} />
                              </label>
                              {hasCard && (
                                <a href={emp.healthCardLink} target="_blank" rel="noreferrer" className="text-blue-600 text-[13px] no-underline hover:underline">
                                  View
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-5 text-center text-gray-500 text-sm">No employees found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Health Card (Employee) ── */}
        {activeTabIndex === "HEALTH_CARD" && !isAdmin && nationality === "INDIA" && (
          <div className="w-full px-10 pt-8 pb-5">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-xl mx-auto">
              <div className="h-[3px] bg-gradient-to-r from-[#1E3A5F] via-[#2563EB] to-[#60A5FA]" />
              <div className="px-10 py-7 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Health Card</h2>
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-500">Health Card Status:</span>
                  <span className={`inline-block ml-2.5 px-3 py-1 rounded-full text-[13px] font-semibold ${employeeHealthCard?.healthCardLink ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {employeeHealthCard?.healthCardLink ? "Available" : "Not Available"}
                  </span>
                </div>

                {employeeHealthCard?.healthCardLink ? (
                  <div className="flex gap-3 justify-center">
                    {/* <a
                      href={employeeHealthCard.healthCardLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg no-underline font-semibold text-sm border border-gray-300 hover:bg-gray-200 transition-colors"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Health Card
                    </a> */}
                    <a
                      href={(() => {
                        const link = employeeHealthCard.healthCardLink;
                        if (link?.includes("/d/")) {
                          const id = link.split("/d/")[1].split("/")[0];
                          return `https://drive.google.com/uc?export=download&id=${id}`;
                        }
                        return link;
                      })()}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg no-underline font-semibold text-sm hover:bg-gray-800 transition-colors"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      Download Health Card
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 m-0 p-4 bg-gray-50 rounded-lg">
                    Your HR/Admin has not uploaded a Health Card yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Policy Content ── */}
        {selectedPolicy && activeTabIndex !== "HEALTH_CARDS" && activeTabIndex !== "HEALTH_CARD" && (
          <div className="w-full px-10 pt-8 pb-5">
            {/* Policy Header Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
              <div className="h-[3px] bg-gradient-to-r from-[#1E3A5F] via-[#2563EB] to-[#60A5FA]" />
              <div className="px-10 py-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex items-center justify-center flex-shrink-0">
                        <PolicyIcon size={22} />
                      </div>
                      <span className="text-xs font-bold tracking-[0.13em] uppercase text-[#1E3A5F] bg-[#EFF6FF] px-3 py-1 rounded-full">
                        {coverageLabel}
                      </span>
                    </div>
                    <h1 className="text-[28px] font-bold text-gray-900 m-0 leading-tight">
                      {selectedPolicy.product_name || selectedPolicy.productName || selectedPolicy.policy_name}
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                      Policy Number:{" "}
                      <strong className="text-gray-900">
                        {selectedPolicy.policy_number || selectedPolicy.policyNumber || "N/A"}
                      </strong>
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 flex-shrink-0 mt-1.5">
                      <button
                        onClick={() => { setPolicyToEdit(selectedPolicy); setIsEditModalOpen(true); }}
                        className="flex items-center gap-1.5 text-[13.5px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-[18px] py-[9px] cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => { setPolicyToDelete(selectedPolicy); setIsDeleteModalOpen(true); }}
                        className="flex items-center gap-1.5 text-[13.5px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-[18px] py-[9px] cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {renderPolicySchedule()}

            <div className="mt-5 p-3.5 bg-[#EFF6FF] border border-blue-200 rounded-lg flex items-start gap-2.5">
              <svg width="16" height="16" fill="none" stroke="#2563EB" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-[#1E3A5F] m-0 leading-relaxed">
                This insurance policy schedule is an important document. Please keep it safe for your records.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && policies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-60px)] gap-4 text-center">
            <div className="w-15 h-15 rounded-[14px] bg-[#EFF6FF] flex items-center justify-center w-[60px] h-[60px]">
              <div className="text-[#1E3A5F]">
                <PolicyIcon size={28} />
              </div>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-700 m-0 mb-1.5">No Insurance Policies</h2>
              <p className="text-[15px] text-gray-400 m-0">No insurance policies are available at the moment.</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center h-[calc(100vh-60px)]">
            <div className="w-8 h-8 rounded-full border-[3px] border-blue-100 border-t-blue-600 animate-spin" />
          </div>
        )}

        {/* Modals */}
        <AddEditPolicyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddPolicy} />
        <AddEditPolicyModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setPolicyToEdit(null); }}
          onSave={handleEditPolicy}
          policy={policyToEdit}
        />
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setPolicyToDelete(null); }}
          onConfirm={handleDeletePolicy}
          policyTitle={policyToDelete?.product_name || policyToDelete?.productName || policyToDelete?.policy_name || "this policy"}
        />
      </div>
    </PolicySecurity>
  );
};

export default InsurancePolicy;