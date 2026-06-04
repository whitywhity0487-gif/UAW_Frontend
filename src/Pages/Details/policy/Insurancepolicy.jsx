// Insurancepolicy.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PolicySecurity from "./PolicySecurity";

const API_BASE_URL = "https://uaw-backend.vercel.app/api/insurance-policies";

// ==================== HELPER FUNCTIONS ====================
const formatDateStr = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes('/')) return dateString;
  return new Date(dateString).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Add renderField HERE - at the top level, outside any component
const renderField = (fieldName, fieldValue) => {
  if (fieldValue === undefined || fieldValue === null || fieldValue === "") return null;
  
  // Format the field name for display (convert snake_case to Title Case)
  const formattedName = fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  // Convert the value to a displayable string
  let displayValue = "-";
  
  if (fieldValue !== undefined && fieldValue !== null) {
    // Handle Neo4j datetime objects (has year, month, day, hour, minute, second)
    if (typeof fieldValue === 'object' && fieldValue !== null) {
      // Check for Neo4j datetime structure
      if (fieldValue.year !== undefined && fieldValue.month !== undefined && fieldValue.day !== undefined) {
        // Create a date string from the object
        const dateStr = `${fieldValue.year}-${String(fieldValue.month).padStart(2, '0')}-${String(fieldValue.day).padStart(2, '0')}`;
        displayValue = formatDateStr(dateStr);
      }
      // Handle Date objects
      else if (fieldValue instanceof Date && !isNaN(fieldValue)) {
        displayValue = fieldValue.toLocaleDateString("en-IN", { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
      // Handle arrays
      else if (Array.isArray(fieldValue)) {
        displayValue = fieldValue.map(item => {
          if (item && typeof item === 'object' && item.year) {
            return `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
          }
          return String(item);
        }).join(', ');
        if (displayValue.length > 200) {
          displayValue = displayValue.substring(0, 200) + '...';
        }
      }
      // Handle other objects - convert to string but don't render directly
      else {
        try {
          // Try to extract date if it has toISOString method
          if (fieldValue.toISOString && typeof fieldValue.toISOString === 'function') {
            displayValue = formatDateStr(fieldValue.toISOString());
          } else {
            // Convert to JSON string but don't render object directly
            displayValue = JSON.stringify(fieldValue);
            if (displayValue.length > 200) {
              displayValue = displayValue.substring(0, 200) + '...';
            }
          }
        } catch (e) {
          displayValue = String(fieldValue);
        }
      }
    }
    // Handle strings and numbers
    else {
      displayValue = String(fieldValue);
      // Truncate long strings
      if (displayValue.length > 200) {
        displayValue = displayValue.substring(0, 200) + '...';
      }
    }
  }
  
  return (
    <tr key={fieldName}>
      <td className="border border-gray-400 p-2 font-bold w-1/3">{formattedName}</td>
      <td className="border border-gray-400 p-2">{displayValue}</td>
    </tr>
  );
};

// ==================== MODALS ====================
const AddEditPolicyModal = ({ isOpen, onClose, onSave, policy = null }) => {
  const [formData, setFormData] = useState({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = !!policy;

  useEffect(() => {
    if (policy) {
      // Exclude internal fields
      const { id, created_at, updated_at, ...rest } = policy;
      
      // Ensure standard fields exist in formData even if empty
      setFormData({
        product_name: rest.product_name || rest.productName || rest.policy_name || "",
        policy_number: rest.policy_number || rest.policyNumber || "",
        coverage_type: rest.coverage_type || "",
        policy_type: rest.policy_type || "",
        ...rest
      });
    } else {
      setFormData({
        product_name: "",
        policy_number: "",
        coverage_type: "",
        policy_type: "",
      });
    }
    setNewKey("");
    setNewValue("");
  }, [policy, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_name && !formData.policy_name) {
      alert("Please provide at least a product name or policy name");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save policy");
    } finally {
      setLoading(false);
    }
  };

  

  const handleRemoveField = (keyToRemove) => {
    const updated = { ...formData };
    delete updated[keyToRemove];
    setFormData(updated);
  };

  const handleAddField = () => {
    if (newKey.trim() && !formData.hasOwnProperty(newKey.trim())) {
      setFormData({ ...formData, [newKey.trim()]: newValue });
      setNewKey("");
      setNewValue("");
    }
  };

  // Standard fields that should always be at the top
  const standardKeys = ["product_name", "policy_number", "coverage_type", "policy_type"];
  
  // Remaining dynamic fields
  const dynamicKeys = Object.keys(formData).filter(key => !standardKeys.includes(key));

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "white", borderRadius: 16, width: "90%", maxWidth: 800,
        maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0,
      }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: "90vh" }}>
          <div style={{
            padding: "24px 28px", borderBottom: "1px solid #E5E7EB",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
          }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              {isEditing ? "Edit Insurance Policy" : "Add New Insurance Policy"}
            </h2>
            <button type="button" onClick={onClose} style={{
              background: "none", border: "none", fontSize: 24, cursor: "pointer",
              color: "#9CA3AF", padding: 4,
            }}>×</button>
          </div>

          <div style={{ padding: "28px", overflowY: "auto", flex: 1 }}>
            
            {/* Standard Fields Section */}
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#111827", borderBottom: "1px solid #E5E7EB", paddingBottom: 8 }}>Primary Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {standardKeys.map(key => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <input
                    type="text"
                    value={formData[key] || ""}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                    style={{
                      width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB",
                      borderRadius: 8, fontSize: 14, outline: "none",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Dynamic Fields Section */}
            {dynamicKeys.length > 0 && (
              <>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#111827", borderBottom: "1px solid #E5E7EB", paddingBottom: 8 }}>Additional Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {dynamicKeys.map((key) => {
                    const value = formData[key];
                    return (
                      <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 13, color: "#374151" }}>
                          <span>{key}</span>
                          <button type="button" onClick={() => handleRemoveField(key)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 12 }}>Remove</button>
                        </label>
                        {typeof value === 'string' && value.length > 50 ? (
                          <textarea
                            value={value || ""}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                            rows={2}
                            style={{
                              width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB",
                              borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical"
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={value || ""}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                            style={{
                              width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB",
                              borderRadius: 8, fontSize: 14, outline: "none",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ marginTop: 24, padding: "16px", backgroundColor: "#F9FAFB", borderRadius: 8, border: "1px dashed #D1D5DB" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#4B5563" }}>Add New Field</h4>
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Field Key (e.g. intermediary_name)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 13, outline: "none" }}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  style={{ flex: 2, padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 13, outline: "none" }}
                />
                <button type="button" onClick={handleAddField} style={{
                  padding: "8px 16px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500
                }}>Add</button>
              </div>
            </div>
          </div>

          <div style={{
            padding: "20px 28px", borderTop: "1px solid #E5E7EB",
            display: "flex", gap: 12, justifyContent: "flex-end", flexShrink: 0,
          }}>
            <button type="button" onClick={onClose} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid #D1D5DB",
              background: "white", cursor: "pointer", fontWeight: 500,
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: "#111827", color: "white", cursor: "pointer",
              fontWeight: 600, opacity: loading ? 0.6 : 1,
            }}>{loading ? "Saving..." : (isEditing ? "Update" : "Create")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, policyTitle }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "white", borderRadius: 16, width: "90%", maxWidth: 400,
        padding: 0,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "28px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", backgroundColor: "#FEF2F2",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, marginLeft: "auto", marginRight: "auto",
          }}>
            <svg width="24" height="24" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <h3 style={{ textAlign: "center", margin: "0 0 12px", fontSize: 20 }}>
            Delete Policy?
          </h3>
          <p style={{ textAlign: "center", color: "#6B7280", marginBottom: 24 }}>
            Are you sure you want to delete <strong>"{policyTitle}"</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={onClose} style={{
              padding: "10px 24px", borderRadius: 8, border: "1px solid #D1D5DB",
              background: "white", cursor: "pointer", fontWeight: 500,
            }}>Cancel</button>
            <button onClick={onConfirm} style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: "#DC2626", color: "white", cursor: "pointer", fontWeight: 600,
            }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== POLICY SCHEDULE FOR SHANGHAI SOCIAL INSURANCE ====================
const ShanghaiSocialInsuranceSchedule = ({ policy }) => {
  // Define section order for better organization
  const basicInfoFields = ["id", "product_name", "policy_name", "policy_type", "description", "country", "city", "country_of_operation"];
  const registrationFields = ["registration_authority", "registration_deadline_text", "registration_deadline_days", "late_registration_consequence", "registration_requirement"];
  const costSharingFields = ["company_medical_rate", "employee_medical_rate", "company_pension_rate", "employee_pension_rate", "company_work_injury_rate", "employee_work_injury_rate", "company_unemployment_rate", "employee_unemployment_rate", "company_maternity_rate", "employee_maternity_rate", "rate_note"];
  const coverageFields = ["coverage_medical", "coverage_pension", "coverage_work_injury", "coverage_unemployment", "coverage_maternity", "medical_covered_inpatient", "medical_covered_outpatient", "medical_covered_chronic_disease", "medical_covered_basic_maternity"];
  const notCoveredFields = ["medical_not_covered_imported_drugs", "medical_not_covered_private_hospitals", "medical_not_covered_vip_wards", "medical_not_covered_dental", "medical_not_covered_vision", "medical_not_covered_routine_physical", "medical_not_covered_vaccines", "medical_not_covered_above_limit", "medical_annual_limit", "gap_note", "supplementary_insurance_recommendation", "supplementary_insurance_note"];
  const proofFields = ["proof_document_1", "proof_document_2", "proof_documents_note", "provider_note"];
  const checklistFields = ["checklist_task_1", "checklist_deadline_1", "checklist_task_2", "checklist_deadline_2", "checklist_task_3", "checklist_deadline_3", "checklist_task_4", "checklist_deadline_4"];
  const otherFields = ["is_government", "is_mandatory", "applicable_to", "payment_deadline", "source_file", "created_at", "page_1_marker", "page_2_marker", "raw_page_1_text", "raw_page_2_text", "raw_text_full"];

  return (
    <div className="font-['Arial',sans-serif] text-black p-8 bg-white">
      <div className="text-right mb-2">
        <div className="text-[#c0504d] font-bold">SOCIAL INSURANCE</div>
      </div>
      <div className="text-[#c0504d] font-bold mb-1 text-lg">
        {policy.policy_name || policy.product_name || "Shanghai Social Insurance"}
      </div>

      {/* 1. Basic Information */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">1. Basic Information</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          {basicInfoFields.map(field => renderField(field, policy[field]))}
        </tbody>
      </table>

      {/* 2. Registration Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">2. Registration Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          {registrationFields.map(field => renderField(field, policy[field]))}
        </tbody>
      </table>

      {/* 3. Cost Sharing */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">3. Cost Sharing</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 font-bold">Coverage</th>
            <th className="border border-gray-400 p-2 font-bold">Company Pays</th>
            <th className="border border-gray-400 p-2 font-bold">Employee Pays</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2">Medical Insurance</td>
            <td className="border border-gray-400 p-2">{policy.company_medical_rate || "-"}</td>
            <td className="border border-gray-400 p-2">{policy.employee_medical_rate || "-"}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Pension</td>
            <td className="border border-gray-400 p-2">{policy.company_pension_rate || "-"}</td>
            <td className="border border-gray-400 p-2">{policy.employee_pension_rate || "-"}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Work Injury</td>
            <td className="border border-gray-400 p-2">{policy.company_work_injury_rate || "-"}</td>
            <td className="border border-gray-400 p-2">{policy.employee_work_injury_rate || "-"}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Unemployment</td>
            <td className="border border-gray-400 p-2">{policy.company_unemployment_rate || "-"}</td>
            <td className="border border-gray-400 p-2">{policy.employee_unemployment_rate || "-"}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Maternity</td>
            <td className="border border-gray-400 p-2">{policy.company_maternity_rate || "-"}</td>
            <td className="border border-gray-400 p-2">{policy.employee_maternity_rate || "-"}</td>
          </tr>
        </tbody>
      </table>
      {policy.rate_note && <div className="text-sm text-gray-500 mt-1 px-2">{policy.rate_note}</div>}

      {/* 4. Covered Benefits */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">4. Covered Benefits</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          {coverageFields.map(field => renderField(field, policy[field]))}
        </tbody>
      </table>

      {/* 5. NOT Covered */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">5. NOT Covered</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          {notCoveredFields.map(field => renderField(field, policy[field]))}
        </tbody>
      </table>

      {/* 6. Proof Documents */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">6. Proof Documents</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          {proofFields.map(field => renderField(field, policy[field]))}
        </tbody>
      </table>

      {/* 7. HR Checklist */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">7. HR Operations Checklist</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 font-bold">Task</th>
            <th className="border border-gray-400 p-2 font-bold">Deadline</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border border-gray-400 p-2">{policy.checklist_task_1 || "-"}</td><td className="border border-gray-400 p-2">{policy.checklist_deadline_1 || "-"}</td></tr>
          <tr><td className="border border-gray-400 p-2">{policy.checklist_task_2 || "-"}</td><td className="border border-gray-400 p-2">{policy.checklist_deadline_2 || "-"}</td></tr>
          <tr><td className="border border-gray-400 p-2">{policy.checklist_task_3 || "-"}</td><td className="border border-gray-400 p-2">{policy.checklist_deadline_3 || "-"}</td></tr>
          <tr><td className="border border-gray-400 p-2">{policy.checklist_task_4 || "-"}</td><td className="border border-gray-400 p-2">{policy.checklist_deadline_4 || "-"}</td></tr>
        </tbody>
      </table>

      {/* 8. All Other Fields */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">8. Additional Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          {otherFields.map(field => renderField(field, policy[field]))}
        </tbody>
      </table>
    </div>
  );
};


// ==================== POLICY SCHEDULE FOR GROUP ACTIV HEALTH (camelCase) ====================
const GroupActivHealthSchedule = ({ policy }) => {
  // Organize fields by category
  const policyOfficeFields = ["policy_issuing_office", "policy_servicing_office"];
  const intermediaryFields = ["intermediary_name", "intermediary_code", "intermediary_contact", "intermediary_email"];
  const insurerFields = ["insurer_name", "insurer_cin", "insurer_email", "insurer_website", "insurer_irda_registration_no", "insurer_registered_office", "toll_free_number", "uin"];
  const tpaFields = ["tpa_name", "tpa_id", "tpa_address"];
  const policyholderFields = ["policyholder_name", "policyholder_address", "policyholder_contact_number", "policyholder_email", "policyholder_gstin"];
  const policyDetailsFields = ["product_name", "product_code", "policy_number", "policy_tenure", "policy_category", "premium_payment_frequency", "group_type", "start_date", "start_time", "start_date_time", "expiry_date", "expiry_time", "policy_year"];
  const coverageFields = ["coverage_details_name", "coverage_benefit", "total_sum_insured", "base_cover_inpatient", "hospital_room_non_icu", "hospital_room_non_icu_exact", "hospital_room_icu", "hospital_room_icu_exact", "room_rent_normal_percent", "room_rent_max_normal", "room_rent_icu_percent", "room_rent_max_icu", "hospital_room_rent_exact"];
  const additionalCovers = ["ayush_treatment", "ayush_benefit_exact", "ayush_condition", "ayush_limit_percent", "ayush_exclusions", "obesity_treatment", "modern_procedures", "modern_procedures_limit", "modern_treatment_exact", "modern_procedures_list", "hiv_aids_std_cover", "mental_illness_hospitalization", "mental_illness_condition", "mental_illness_limit", "day_care_treatment", "domiciliary_hospitalization", "organ_donor_expenses", "organ_donor_days", "pre_hospitalization_coverage", "pre_hospitalization_days", "post_hospitalization_coverage", "post_hospitalization_days", "pre_post_hospitalization"];
  const maternityFields = ["maternity_benefit_option", "maternity_benefit_exact_pdf", "maternity_normal_delivery_limit", "maternity_c_section_limit", "maternity_other_limit", "maternity_pre_natal", "maternity_post_natal", "maternity_pre_post_natal_limit", "maternity_pre_post_natal_within", "maternity_new_born_expenses", "maternity_child_limit", "maternity_waiting_period", "maternity_applicable_to"];
  const waitingWaiverFields = ["waiver_53", "waiver_54", "waiver_55", "waiver_56", "waiver_57", "waiver_58", "waiver_59", "waiver_60", "waiver_61", "waiver_62", "waiver_63", "waiver_64", "waiver_65", "waiver_66", "waiver_67", "waiver_68", "waiver_69", "waiver_70", "waiver_70_note", "waiver_71", "waiver_71_note", "waiver_72", "thirty_days_waiting", "two_years_waiting"];
  const insuredFields = ["relationship_type_self", "relationship_type_dependent", "number_of_lives_self", "number_of_lives_dependent", "total_lives", "insured_persons", "nominee_details", "family_definition", "age_band_self", "age_band_spouse", "age_band_spouse_symbol", "age_band_child", "age_band_child_symbol"];
  const cashlessFields = ["cashless_feature", "cashless_feature_title", "cashless_description", "cashless_letter", "cashless_process", "cashless_how_to_header", "cashless_channel_1", "cashless_channel_2", "cashless_channel_3", "planned_hospitalization_intimation", "cashless_planned_hospitalization_intimation", "emergency_hospitalization_intimation", "cashless_emergency_hospitalization_intimation", "preferred_provider_network", "comprehensive_corporate_floater", "coverage_continuity_pink_slip", "wellness_coach"];
  const subLimitFields = ["sub_limits", "sub_limit_surgeon_fees", "extension_cataract_coverage", "cataract_coverage_note", "cataract_exact", "lasik_surgery", "cyberknife_exact", "co_insurance_details", "co_payment_status", "reasonable_customary_charges"];
  const ambulanceFields = ["road_ambulance_limit", "road_ambulance_coverage", "road_ambulance_note", "road_ambulance_sr_no", "air_ambulance_limit", "air_ambulance_coverage", "air_ambulance_covered", "air_ambulance_sr_no"];
  const otherFields = ["created_at", "source_file", "page_1_marker", "page_2_marker", "page_3_marker", "page_4_marker", "page_5_marker", "page_6_marker", "raw_page_1_text", "raw_page_2_text", "raw_page_3_text", "raw_page_4_text", "raw_page_6_text", "trademark_disclaimer_page1", "trademark_disclaimer_page3", "trademark_disclaimer_page4", "aditya_birla_header"];

  return (
    <div className="font-['Arial',sans-serif] text-black p-8 bg-white">
      <div className="text-right mb-2">
        <div className="text-[#c0504d] font-bold">HEALTH INSURANCE</div>
      </div>
      <div className="text-[#c0504d] font-bold mb-1 text-lg">
        {policy.product_name || "Group Activ Health"} - Policy Schedule
      </div>
      <div className="font-bold mb-2 text-black">
        Policy No. {policy.policy_number}
      </div>

      {/* Office Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Office Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {policyOfficeFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Intermediary Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Intermediary Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {intermediaryFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Insurer Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Insurer Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {insurerFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* TPA Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">TPA Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {tpaFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Policyholder Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Policyholder Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {policyholderFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Policy Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Policy Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {policyDetailsFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Coverage Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Coverage Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {coverageFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Additional Covers */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Additional Covers</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {additionalCovers.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Maternity Benefits */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Maternity Benefits</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {maternityFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Waivers / Waiting Period */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Waivers & Waiting Periods</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {waitingWaiverFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Insured Persons */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Insured Persons</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {insuredFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Cashless Facility */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Cashless Facility</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {cashlessFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Sub-limits */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Sub-limits & Special Conditions</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {subLimitFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Ambulance */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Ambulance Coverage</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {ambulanceFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* All remaining fields */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Additional Information</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {otherFields.map(f => renderField(f, policy[f]))}
      </tbody></table>
    </div>
  );
};

// ==================== POLICY SCHEDULE FOR GROUP ACTIV SECURE (snake_case) ====================
const GroupActivSecureSchedule = ({ policy }) => {
  const officeFields = ["policy_issuing_office", "policy_servicing_office"];
  const intermediaryFields = ["intermediary_name", "intermediary_code", "intermediary_contact", "intermediary_email"];
  const policyholderFields = ["policyholder_name", "policyholder_address", "policyholder_contact_number", "policyholder_email", "policyholder_gstin"];
  const policyDetailsFields = ["product_name", "plan_name", "product_code", "policy_number", "policy_tenure", "policy_category", "premium_payment_frequency", "group_type", "start_date", "start_time", "start_date_time", "policy_year", "insurance_category", "sac_code", "uin"];
  const coverageFields = ["coverage_type", "capital_sum_insured", "accidental_death_cover", "permanent_partial_disablement", "permanent_total_disablement", "medical_expenses", "modification_benefit_residence", "modification_benefit_vehicle", "education_fund_for_children", "burns_benefit", "compassionate_visit", "funeral_expenses", "coma_benefit", "repatriation_of_mortal_remains", "road_ambulance_cover", "temporary_total_disablement"];
  const specialConditionFields = ["special_condition_terrorism_cover", "special_condition_exclusions", "special_condition_age_group", "special_condition_global_coverage", "special_condition_animal_snake_bite", "special_condition_insured_description", "special_condition_sum_insured_criteria", "special_condition_sum_insured_criteria_type", "special_condition_max_sum_insured", "special_condition_aoa", "special_condition_aoy", "special_condition_armed_guards_exclusion", "per_mile_rate"];
  const insuredFields = ["insured_personal_accident_self_lives", "insured_personal_accident_dependent_lives", "insured_critical_illness_self_lives", "insured_critical_illness_dependent_lives", "insured_hospital_cash_self_lives", "insured_hospital_cash_dependent_lives", "insured_persons", "nominee_details"];
  const tpaFields = ["tpa_name", "tpa_id", "tpa_address"];
  const premiumFields = ["net_premium", "cgst_percent", "cgst_amount", "sgst_percent", "sgst_amount", "igst_percent", "igst_amount", "gross_premium", "gst_registration_no", "gst_declaration"];
  const cashlessFields = ["cashless_feature", "cashless_feature_title", "cashless_description", "cashless_letter", "cashless_process", "cashless_how_to_header", "cashless_channel_1", "cashless_channel_2", "cashless_channel_3", "cashless_planned_hospitalization_intimation", "cashless_emergency_hospitalization_intimation"];
  const otherFields = ["co_insurance_details", "toll_free_number", "created_at", "updated_at", "source_file", "page_1_marker", "page_2_marker", "page_3_marker", "raw_page_1_text", "raw_page_1_coverage", "raw_page_2_text", "raw_page_2_insured_details", "raw_page_3_text", "aditya_birla_header"];

  return (
    <div className="font-['Arial',sans-serif] text-black p-8 bg-white">
      <div className="text-right mb-2">
        <div className="text-[#c0504d] font-bold">PERSONAL ACCIDENT INSURANCE</div>
      </div>
      <div className="text-[#c0504d] font-bold mb-1 text-lg">
        {policy.product_name || "Group Activ Secure"} - Policy Schedule
      </div>
      <div className="font-bold mb-2 text-black">
        Policy No. {policy.policy_number}
      </div>

      {/* Office Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Office Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {officeFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Intermediary Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Intermediary Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {intermediaryFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Policyholder Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Policyholder Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {policyholderFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Policy Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Policy Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {policyDetailsFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Coverage Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Coverage Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {coverageFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Special Conditions */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Special Conditions</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {specialConditionFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Insured Persons */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Insured Persons</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {insuredFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* TPA Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">TPA Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {tpaFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Premium Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Premium Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {premiumFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Cashless Facility */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Cashless Facility</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {cashlessFields.map(f => renderField(f, policy[f]))}
      </tbody></table>

      {/* Additional Information */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">Additional Information</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400"><tbody>
        {otherFields.map(f => renderField(f, policy[f]))}
      </tbody></table>
    </div>
  );
};

// ==================== MAIN INSURANCE POLICY COMPONENT ====================
const InsurancePolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nationality, setNationality] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToEdit, setPolicyToEdit] = useState(null);
  const [policyToDelete, setPolicyToDelete] = useState(null);

  const navigate = useNavigate();

  const icon = (
    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );

  useEffect(() => {
    const fetchUserAndNationality = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const adminCheck = user.role === "Admin" || user.role === "admin" || user.role === "ADMIN";
          setIsAdmin(adminCheck);

          if (!adminCheck) {
            let nat = user.nationality || "INDIA"; // default
            
            // Try to get the ID (usually username or employeeId)
            const userIdToFetch = user.username || user.employeeId || user.userId;
            
            if (userIdToFetch) {
              try {
                const response = await axios.get(`https://uaw-backend.vercel.app/api/personal-details?userId=${userIdToFetch}`);
                if (response.data?.data?.nationality) {
                  nat = response.data.data.nationality;
                }
              } catch (e) {
                console.error("Failed to fetch personal details nationality", e);
              }
            }
            setNationality(nat.toUpperCase());
          } else {
            setNationality("ADMIN"); // Admins don't need nationality filtering
          }
        } catch (err) {
          console.error("Error parsing user data:", err);
        }
      }
    };
    fetchUserAndNationality();
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, []);

  // ─── Block keyboard shortcuts (screenshot, copy, print, devtools) ────────────
  // Handled by PolicySecurity wrapper

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_BASE_URL);
      console.log("API Response:", response.data);
      if (response.data.success) {
        setPolicies(response.data.data);
      }
    } catch (err) {
      setError("Failed to fetch policies. Make sure the backend server is running.");
      console.error("Error fetching policies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = async (policyData) => {
    try {
      const response = await axios.post(API_BASE_URL, policyData);
      if (response.data.success) {
        await fetchPolicies();
        setActiveTabIndex(policies.length); // Assuming new policy is at end
      }
      return response;
    } catch (error) {
      console.error("Error adding policy:", error);
      throw error;
    }
  };

  const handleEditPolicy = async (policyData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${policyToEdit.id}`, policyData);
      if (response.data.success) {
        await fetchPolicies();
      }
      return response;
    } catch (error) {
      console.error("Error editing policy:", error);
      throw error;
    }
  };

  const handleDeletePolicy = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${policyToDelete.id}`);
      if (response.data.success) {
        await fetchPolicies();
        setActiveTabIndex(0);
        setIsDeleteModalOpen(false);
        setPolicyToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting policy:", error);
      alert(error.response?.data?.message || "Failed to delete policy");
    }
  };

  const openEditModal = (policy) => {
    setPolicyToEdit(policy);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (policy) => {
    setPolicyToDelete(policy);
    setIsDeleteModalOpen(true);
  };

  const filteredPolicies = policies.filter(policy => {
    if (isAdmin) return true;
    if (!nationality) return false;

    const pName = (policy.product_name || policy.productName || policy.policy_name || "").toLowerCase();

    if (nationality === "INDIA") {
      return pName.includes("group activ secure") || pName.includes("group activ health");
    } else if (nationality === "CHINA") {
      return pName.includes("shanghai social insurance");
    } else if (nationality === "USA") {
      return false;
    }
    return false; // Default fallback
  });

  // Adjust active tab if it's out of bounds after filtering
  const safeActiveTabIndex = activeTabIndex >= filteredPolicies.length ? Math.max(0, filteredPolicies.length - 1) : activeTabIndex;
  const selectedPolicy = filteredPolicies[safeActiveTabIndex] || null;

const renderPolicySchedule = () => {
  if (!selectedPolicy) return null;
  
  const policyName = (selectedPolicy.product_name || selectedPolicy.productName || selectedPolicy.policy_name || "").toLowerCase();
  
  // Check for Shanghai Social Insurance
  if (policyName.includes("shanghai") || selectedPolicy.country === "China" || selectedPolicy.policy_type === "Social Insurance") {
    return <ShanghaiSocialInsuranceSchedule policy={selectedPolicy} />;
  }
  // Check for Group Activ Secure (Personal Accident)
  if (policyName.includes("group activ secure") || selectedPolicy.coverage_type === "Group Activ Secure - Personal Accident") {
    return <GroupActivSecureSchedule policy={selectedPolicy} />;
  }
  // Default to Group Activ Health
  return <GroupActivHealthSchedule policy={selectedPolicy} />;
};

  const tabStyle = (index, currentActive) => ({
    padding: '14px 28px',
    background: 'none',
    border: 'none',
    borderBottom: currentActive === index ? '3px solid #DC2626' : '3px solid transparent',
    color: currentActive === index ? '#DC2626' : '#6B7280',
    fontWeight: currentActive === index ? 700 : 500,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  });

  return (
    <PolicySecurity isAdmin={isAdmin}>
      <div 
        style={{ 
          minHeight: '100vh', 
          background: '#F8F9FB', 
          width: '100%', 
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        }}
      >
        {/* Top Tab Navbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}>
        <button onClick={() => navigate('/home')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
          cursor: 'pointer', padding: '8px 14px', marginRight: 24,
          fontSize: 13, color: '#4B5563', fontWeight: 500,
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)',
            borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            {icon}
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Insurance Policy</span>
        </div>

        <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
          {loading ? (
            <div style={{ padding: '16px 24px', color: '#9CA3AF', fontSize: 14 }}>Loading policies...</div>
          ) : error ? (
            <div style={{ padding: '16px 24px', color: '#EF4444', fontSize: 14 }}>{error}</div>
          ) : filteredPolicies.length === 0 ? (
            <div style={{ padding: '16px 24px', color: '#9CA3AF', fontSize: 14 }}>
              {!nationality && !isAdmin ? "Checking nationality..." : "No policies found for your nationality"}
            </div>
          ) : (
            filteredPolicies.map((policy, index) => {
              let displayName = "";
              if (policy.product_name === "Group Activ Secure") displayName = "Group Activ Secure";
              else if (policy.productName === "Group Activ Health") displayName = "Group Activ Health";
              else if (policy.policy_name === "Shanghai Social Insurance - Mandatory Government Insurance") displayName = "Shanghai Social Insurance";
              else displayName = policy.product_name || policy.productName || policy.policy_name || `Policy ${index + 1}`;
              
              let policyNum = policy.policy_number || policy.policyNumber || "";
              
              return (
                <button
                  key={policy.id || index}
                  onClick={() => setActiveTabIndex(index)}
                  style={tabStyle(index, safeActiveTabIndex)}
                >
                  <span>{displayName}</span>
                  <span style={{ fontSize: 11, color: activeTabIndex === index ? '#DC2626' : '#9CA3AF', fontWeight: 400 }}>
                    {policyNum}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              fontSize: 13.5, fontWeight: 600, color: "#FFFFFF",
              backgroundColor: "#111827", border: "none", borderRadius: 8,
              padding: "9px 18px", cursor: "pointer", flexShrink: 0,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Policy
          </button>
        )}
      </div>

      {/* Tab Content */}
      {selectedPolicy && (
        <div style={{ width: '100%', padding: '32px 40px 20px 40px' }}>
          <div style={{
            backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
            borderRadius: 12, overflow: 'hidden', marginBottom: 24,
          }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 60%, #F87171 100%)' }} />
            <div style={{ padding: '28px 40px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {icon}
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.13em',
                      textTransform: 'uppercase', color: '#DC2626',
                      backgroundColor: '#FEE2E2', padding: '4px 12px', borderRadius: 20,
                    }}>
                      {selectedPolicy.coverage_type ? "PERSONAL ACCIDENT" : selectedPolicy.policy_type === "Social Insurance" ? "SOCIAL INSURANCE" : "HEALTH INSURANCE"}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                    {selectedPolicy.product_name || selectedPolicy.productName || selectedPolicy.policy_name}
                  </h1>
                  <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
                    Policy Number: <strong style={{ color: '#111827' }}>{selectedPolicy.policy_number || selectedPolicy.policyNumber || "N/A"}</strong>
                  </p>
                </div>

                {isAdmin && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 6 }}>
                    <button
                      onClick={() => openEditModal(selectedPolicy)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 13.5, fontWeight: 600, color: "#374151",
                        backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB",
                        borderRadius: 8, padding: "9px 18px", cursor: "pointer",
                      }}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>

                    <button
                      onClick={() => openDeleteModal(selectedPolicy)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 13.5, fontWeight: 600, color: "#DC2626",
                        backgroundColor: "#FEF2F2", border: "1px solid #FECACA",
                        borderRadius: 8, padding: "9px 18px", cursor: "pointer",
                      }}
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

          <div style={{
            marginTop: 20, padding: '14px 20px',
            backgroundColor: '#FEE2E2', border: '1px solid #F87171',
            borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <svg width="16" height="16" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: 14, color: '#DC2626', margin: 0, lineHeight: 1.7 }}>
              This insurance policy schedule is an important document. Please keep it safe for your records.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && policies.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: 'calc(100vh - 60px)', gap: 16, textAlign: 'center',
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No Insurance Policies</h2>
            <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0 }}>No insurance policies are available at the moment.</p>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid #FEE2E2', borderTopColor: '#DC2626',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      )}

      {/* Modals */}
      <AddEditPolicyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddPolicy}
      />

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

      <style>
        {`
          @keyframes spin { to { transform: rotate(360deg); } }
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        `}
      </style>
      </div>
    </PolicySecurity>
  );
};

export default InsurancePolicy;
