// Insurancepolicy.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PolicySecurity from "./PolicySecurity";

const API_BASE_URL = "http://localhost:5000/api/insurance-policies";

// ==================== HELPER FUNCTIONS ====================
const formatDateStr = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes('/')) return dateString;
  return new Date(dateString).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' });
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
  return (
    <div className="font-['Arial',sans-serif] text-black p-8 bg-white">
      <div className="text-right mb-2">
        <div className="text-[#c0504d] font-bold">SOCIAL INSURANCE</div>
      </div>
      <div className="text-[#c0504d] font-bold mb-1 text-lg">
        {policy.policy_name || "Shanghai Social Insurance"}
      </div>

      {/* 1. What is it? */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">1. What is it?</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/3">Description</td>
            <td className="border border-gray-400 p-2">{policy.description}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Country / City</td>
            <td className="border border-gray-400 p-2">{policy.country} - {policy.city}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Coverage</td>
            <td className="border border-gray-400 p-2">
              {policy.coverage_medical}, {policy.coverage_pension}, {policy.coverage_work_injury}, {policy.coverage_unemployment}, {policy.coverage_maternity}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. Registration Deadline */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">2. Registration Deadline</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/3">Deadline</td>
            <td className="border border-gray-400 p-2">{policy.registration_deadline_text} ({policy.registration_deadline_days} days)</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Consequence</td>
            <td className="border border-gray-400 p-2">{policy.late_registration_consequence}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Requirement</td>
            <td className="border border-gray-400 p-2">{policy.registration_requirement}</td>
          </tr>
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
            <td className="border border-gray-400 p-2">{policy.company_medical_rate}</td>
            <td className="border border-gray-400 p-2">{policy.employee_medical_rate}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Pension</td>
            <td className="border border-gray-400 p-2">{policy.company_pension_rate}</td>
            <td className="border border-gray-400 p-2">{policy.employee_pension_rate}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Work Injury</td>
            <td className="border border-gray-400 p-2">{policy.company_work_injury_rate}</td>
            <td className="border border-gray-400 p-2">{policy.employee_work_injury_rate}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Unemployment</td>
            <td className="border border-gray-400 p-2">{policy.company_unemployment_rate}</td>
            <td className="border border-gray-400 p-2">{policy.employee_unemployment_rate}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Maternity</td>
            <td className="border border-gray-400 p-2">{policy.company_maternity_rate}</td>
            <td className="border border-gray-400 p-2">{policy.employee_maternity_rate}</td>
          </tr>
        </tbody>
      </table>
      <div className="text-sm text-gray-500 mt-1 px-2">{policy.rate_note}</div>

      {/* 4. Medical Insurance - Covered */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">4. Medical Insurance - What is Covered?</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 p-2">✅ {policy.medical_covered_inpatient}</td></tr>
          <tr><td className="border border-gray-400 p-2">✅ {policy.medical_covered_outpatient}</td></tr>
          <tr><td className="border border-gray-400 p-2">✅ {policy.medical_covered_chronic_disease}</td></tr>
          <tr><td className="border border-gray-400 p-2">✅ {policy.medical_covered_basic_maternity}</td></tr>
        </tbody>
      </table>

      {/* 5. Medical Insurance - NOT Covered */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">5. Medical Insurance - What is NOT Covered?</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 p-2">❌ {policy.medical_not_covered_imported_drugs}</td></tr>
          <tr><td className="border border-gray-400 p-2">❌ {policy.medical_not_covered_private_hospitals}</td></tr>
          <tr><td className="border border-gray-400 p-2">❌ {policy.medical_not_covered_vip_wards}</td></tr>
          <tr><td className="border border-gray-400 p-2">❌ {policy.medical_not_covered_dental}</td></tr>
          <tr><td className="border border-gray-400 p-2">❌ {policy.medical_not_covered_vision}</td></tr>
          <tr><td className="border border-gray-400 p-2">❌ {policy.medical_not_covered_routine_physical}</td></tr>
          <tr><td className="border border-gray-400 p-2">❌ {policy.medical_not_covered_vaccines}</td></tr>
          <tr><td className="border border-gray-400 p-2">❌ {policy.medical_not_covered_above_limit}</td></tr>
        </tbody>
      </table>
      <div className="text-sm text-red-500 mt-1 px-2">{policy.gap_note}</div>
      <div className="text-sm text-blue-500 mt-1 px-2">{policy.supplementary_insurance_recommendation}</div>

      {/* 6. Proof Documents */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">6. Proof Documents Available</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 p-2">📄 {policy.proof_document_1}</td></tr>
          <tr><td className="border border-gray-400 p-2">📄 {policy.proof_document_2}</td></tr>
          <tr><td className="border border-gray-400 p-2">{policy.proof_documents_note}</td></tr>
          <tr><td className="border border-gray-400 p-2">{policy.provider_note}</td></tr>
        </tbody>
      </table>

      {/* 7. Summary Checklist */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">7. Summary Checklist for HR/Operations</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 font-bold">Task</th>
            <th className="border border-gray-400 p-2 font-bold">Deadline</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2">{policy.checklist_task_1}</td>
            <td className="border border-gray-400 p-2">{policy.checklist_deadline_1}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">{policy.checklist_task_2}</td>
            <td className="border border-gray-400 p-2">{policy.checklist_deadline_2}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">{policy.checklist_task_3}</td>
            <td className="border border-gray-400 p-2">{policy.checklist_deadline_3}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">{policy.checklist_task_4}</td>
            <td className="border border-gray-400 p-2">{policy.checklist_deadline_4}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ==================== POLICY SCHEDULE FOR GROUP ACTIV HEALTH (camelCase) ====================
const GroupActivHealthSchedule = ({ policy }) => {
  return (
    <div className="font-['Arial',sans-serif] text-black p-8 bg-white">
      <div className="text-right mb-2">
        <div className="text-[#c0504d] font-bold">HEALTH INSURANCE</div>
      </div>
      <div className="text-[#c0504d] font-bold mb-1 text-lg">
        {policy.productName || "Group Activ Health"} - Policy Schedule
      </div>
      <div className="font-bold mb-2 text-black">
        Policy No. {policy.policyNumber}
      </div>

      {/* Policy Offices */}
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/4">Policy Issuing Office</td>
            <td className="border border-gray-400 p-2 w-1/4">{policy.policyIssuingOffice || policy.issuingOffice}</td>
            <td className="border border-gray-400 p-2 font-bold w-1/4">Policy Servicing Office</td>
            <td className="border border-gray-400 p-2 w-1/4">{policy.policyServicingOffice || policy.servicingOffice}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Intermediary Name</td>
            <td className="border border-gray-400 p-2">{policy.intermediaryName}</td>
            <td className="border border-gray-400 p-2 font-bold">Intermediary Code</td>
            <td className="border border-gray-400 p-2">{policy.intermediaryCode}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Intermediary Contact Details</td>
            <td className="border border-gray-400 p-2">{policy.intermediaryContact}</td>
            <td className="border border-gray-400 p-2 font-bold">Intermediary E-mail ID</td>
            <td className="border border-gray-400 p-2">{policy.intermediaryEmail}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Toll Free Number</td>
            <td className="border border-gray-400 p-2">{policy.tollFreeNumber || policy.insurerTollFree}</td>
            <td className="border border-gray-400 p-2 font-bold">UIN</td>
            <td className="border border-gray-400 p-2">{policy.uin}</td>
          </tr>
        </tbody>
      </table>

      {/* TPA Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">TPA Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/4">TPA Name</td>
            <td className="border border-gray-400 p-2 w-1/4">{policy.tpaName}</td>
            <td className="border border-gray-400 p-2 font-bold w-1/4">TPA ID</td>
            <td className="border border-gray-400 p-2 w-1/4">{policy.tpaId}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">TPA Address</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.tpaAddress}</td>
          </tr>
        </tbody>
      </table>

      {/* I. Details of Policyholder */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">I. Details of Policyholder</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/4">Policyholder Name</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholderName}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Policyholder Address</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholderAddress}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Contact Number</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholderContactNumber || "-"}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Email Id</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholderEmail}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Policyholder GSTIN</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholderGSTIN}</td>
          </tr>
        </tbody>
      </table>

      {/* II. Policy Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">II. Policy Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/4">Product Name</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.productName}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Product Code</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.productCode}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Policy Number</td>
            <td className="border border-gray-400 p-2 font-bold">{policy.policyNumber}</td>
            <td className="border border-gray-400 p-2 font-bold">Policy Issued Date & Time</td>
            <td className="border border-gray-400 p-2">{policy.policyIssuedDateTime || policy.policyIssuedDate}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Start date & Time of Policy</td>
            <td className="border border-gray-400 p-2 font-bold">From {policy.startDateTime || `00:00 Hrs of ${formatDateStr(policy.startDate)}`}</td>
            <td className="border border-gray-400 p-2 font-bold">Expiry Date & Time of Policy</td>
            <td className="border border-gray-400 p-2">To {policy.expiryDateTime || `Midnight 23:59 Hrs of ${formatDateStr(policy.expiryDate)}`}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Group Type</td>
            <td className="border border-gray-400 p-2 font-bold">{policy.groupType}</td>
            <td className="border border-gray-400 p-2 font-bold">Policy Tenure</td>
            <td className="border border-gray-400 p-2">{policy.policyTenure || policy.tenure}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Policy Category</td>
            <td className="border border-gray-400 p-2 font-bold" colSpan="3">{policy.policyCategory}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Premium Payment Frequency</td>
            <td className="border border-gray-400 p-2 font-bold" colSpan="3">{policy.premiumPaymentFrequency || policy.premiumFrequency}</td>
          </tr>
        </tbody>
      </table>

      {/* III. Co-Insurance Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">III. Co-Insurance Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400 text-center">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold" colSpan="2">Co-Insurance Details</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 w-1/2">{policy.coInsuranceDetails || "NA"}</td>
            <td className="border border-gray-400 p-2 w-1/2">{policy.coInsuranceDetails || "NA"}</td>
          </tr>
        </tbody>
      </table>

      {/* IV. Coverage Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">IV. Coverage Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400 text-center">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 font-bold">Coverage Details</th>
            <th className="border border-gray-400 p-2 font-bold">Name of the Benefit</th>
            <th className="border border-gray-400 p-2 font-bold">Total Sum Insured</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">{policy.coverageDetailsName || "Group Mediclaim"}</td>
            <td className="border border-gray-400 p-2 font-bold">{policy.coverageBenefit || "As per Quote & Policy Wordings"}</td>
            <td className="border border-gray-400 p-2 font-bold">{policy.totalSumInsured || "As per the Annexure"}</td>
          </tr>
        </tbody>
      </table>

      {/* V. Insured Person Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">V. Insured Person Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400 text-left">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 font-bold text-center">Relationship Type</th>
            <th className="border border-gray-400 p-2 font-bold text-center">Number of Lives</th>
            <th className="border border-gray-400 p-2 font-bold text-center">Name of Insured Person</th>
            <th className="border border-gray-400 p-2 font-bold text-center">Nominee name and relationship</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2">Self</td>
            <td className="border border-gray-400 p-2">{policy.insuredSelfCount || policy.number_of_lives_self}</td>
            <td className="border border-gray-400 p-2">As per the Annexure</td>
            <td className="border border-gray-400 p-2">As per the Annexure</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2">Dependent</td>
            <td className="border border-gray-400 p-2">{policy.insuredDependentCount || policy.number_of_lives_dependent}</td>
            <td className="border border-gray-400 p-2">As per the Annexure</td>
            <td className="border border-gray-400 p-2">As per the Annexure</td>
          </tr>
        </tbody>
      </table>

      {/* VI. Base Covers */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">VI. Base Covers</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 font-bold w-1/5">Sr No</th>
            <th className="border border-gray-400 p-2 font-bold w-2/5">Cover Name</th>
            <th className="border border-gray-400 p-2 font-bold w-2/5">Coverage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2">1.1</td>
            <td className="border border-gray-400 p-2">In-patient Hospitalization</td>
            <td className="border border-gray-400 p-2">
              {policy.baseCoverInpatient || "Rs 500000.00"}<br />
              Hospital Room (Non ICU): {policy.hospitalRoomNonICU || "2% of SI per day, max Rs 10000"}<br />
              Hospital Room (ICU): {policy.hospitalRoomICU || "4% of SI per day, max Rs 20000"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* X. Cashless Claim Facility */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">X. Cashless Claim Facility</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><th className="border border-gray-400 p-2 font-bold w-1/3">Feature</th><td className="border border-gray-400 p-2">{policy.cashlessFeature || "Cashless Anywhere"}</td></tr>
          <tr><th className="border border-gray-400 p-2 font-bold">Description</th><td className="border border-gray-400 p-2">{policy.cashlessDescription || "Cashless Claims at any hospital of choice"}</td></tr>
          <tr><th className="border border-gray-400 p-2 font-bold">Planned Hospitalization</th><td className="border border-gray-400 p-2">{policy.claimIntimationPlanned || "At least 48 hours before hospitalization"}</td></tr>
          <tr><th className="border border-gray-400 p-2 font-bold">Emergency Hospitalization</th><td className="border border-gray-400 p-2">{policy.claimIntimationEmergency || "Within 48 hours of hospitalization"}</td></tr>
        </tbody>
      </table>
    </div>
  );
};

// ==================== POLICY SCHEDULE FOR GROUP ACTIV SECURE (snake_case) ====================
const GroupActivSecureSchedule = ({ policy }) => {
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

      {/* Policy Offices */}
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/4">Policy Issuing Office</td>
            <td className="border border-gray-400 p-2 w-1/4">{policy.policy_issuing_office}</td>
            <td className="border border-gray-400 p-2 font-bold w-1/4">Policy Servicing Office</td>
            <td className="border border-gray-400 p-2 w-1/4">{policy.policy_servicing_office}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Intermediary Name</td>
            <td className="border border-gray-400 p-2">{policy.intermediary_name}</td>
            <td className="border border-gray-400 p-2 font-bold">Intermediary Code</td>
            <td className="border border-gray-400 p-2">{policy.intermediary_code}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Intermediary Contact Details</td>
            <td className="border border-gray-400 p-2">{policy.intermediary_contact}</td>
            <td className="border border-gray-400 p-2 font-bold">Intermediary E-mail ID</td>
            <td className="border border-gray-400 p-2">{policy.intermediary_email}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Toll Free Number</td>
            <td className="border border-gray-400 p-2">{policy.toll_free_number}</td>
            <td className="border border-gray-400 p-2 font-bold">UIN</td>
            <td className="border border-gray-400 p-2">{policy.uin}</td>
          </tr>
        </tbody>
      </table>

      {/* Policyholder Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">I. Details of Policyholder</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/4">Policyholder Name</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholder_name}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Policyholder Address</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholder_address}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Contact Number</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholder_contact_number || "-"}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Email Id</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholder_email}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Policyholder GSTIN</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policyholder_gstin}</td>
          </tr>
        </tbody>
      </table>

      {/* Policy Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">II. Policy Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 font-bold w-1/4">Product Name</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.product_name}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Plan Name</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.plan_name}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Product Code</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.product_code}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Policy Number</td>
            <td className="border border-gray-400 p-2 font-bold">{policy.policy_number}</td>
            <td className="border border-gray-400 p-2 font-bold">Start date & Time</td>
            <td className="border border-gray-400 p-2">{policy.start_date_time}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Group Type</td>
            <td className="border border-gray-400 p-2">{policy.group_type}</td>
            <td className="border border-gray-400 p-2 font-bold">Policy Tenure</td>
            <td className="border border-gray-400 p-2">{policy.policy_tenure}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Policy Category</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.policy_category}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 font-bold">Premium Payment Frequency</td>
            <td className="border border-gray-400 p-2" colSpan="3">{policy.premium_payment_frequency}</td>
          </tr>
        </tbody>
      </table>

      {/* Coverage Details - Personal Accident */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">III. Coverage Details - Personal Accident</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 p-2 font-bold w-1/3">Coverage Type</td><td className="border border-gray-400 p-2">{policy.coverage_type}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Capital Sum Insured</td><td className="border border-gray-400 p-2">Rs {policy.capital_sum_insured?.toLocaleString()}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Accidental Death Cover</td><td className="border border-gray-400 p-2">{policy.accidental_death_cover}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Permanent Partial Disablement</td><td className="border border-gray-400 p-2">{policy.permanent_partial_disablement}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Permanent Total Disablement</td><td className="border border-gray-400 p-2">{policy.permanent_total_disablement}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Medical Expenses</td><td className="border border-gray-400 p-2">{policy.medical_expenses}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Modification Benefit (Residence)</td><td className="border border-gray-400 p-2">{policy.modification_benefit_residence}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Modification Benefit (Vehicle)</td><td className="border border-gray-400 p-2">{policy.modification_benefit_vehicle}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Education Fund for Children</td><td className="border border-gray-400 p-2">{policy.education_fund_for_children}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Burns Benefit</td><td className="border border-gray-400 p-2">{policy.burns_benefit}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Compassionate Visit</td><td className="border border-gray-400 p-2">{policy.compassionate_visit}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Funeral Expenses</td><td className="border border-gray-400 p-2">{policy.funeral_expenses}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Coma Benefit</td><td className="border border-gray-400 p-2">{policy.coma_benefit}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Repatriation of Mortal Remains</td><td className="border border-gray-400 p-2">{policy.repatriation_of_mortal_remains}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Road Ambulance Cover</td><td className="border border-gray-400 p-2">{policy.road_ambulance_cover}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Temporary Total Disablement</td><td className="border border-gray-400 p-2">{policy.temporary_total_disablement}</td></tr>
        </tbody>
      </table>

      {/* Special Conditions */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">IV. Special Conditions</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 p-2 font-bold w-1/3">Terrorism Cover</td><td className="border border-gray-400 p-2">{policy.special_condition_terrorism_cover}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Exclusions</td><td className="border border-gray-400 p-2">{policy.special_condition_exclusions}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Age Group</td><td className="border border-gray-400 p-2">{policy.special_condition_age_group}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Global Coverage</td><td className="border border-gray-400 p-2">{policy.special_condition_global_coverage}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Animal/Snake Bite Cover</td><td className="border border-gray-400 p-2">{policy.special_condition_animal_snake_bite}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Per Mile Rate</td><td className="border border-gray-400 p-2">{policy.per_mile_rate}</td></tr>
        </tbody>
      </table>

      {/* TPA Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">V. TPA Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 p-2 font-bold w-1/4">TPA Name</td><td className="border border-gray-400 p-2 w-1/4">{policy.tpa_name}</td>
              <td className="border border-gray-400 p-2 font-bold w-1/4">TPA ID</td><td className="border border-gray-400 p-2 w-1/4">{policy.tpa_id}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">TPA Address</td><td className="border border-gray-400 p-2" colSpan="3">{policy.tpa_address}</td></tr>
        </tbody>
      </table>

      {/* Premium Details */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">VI. Premium Details</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 p-2 font-bold w-1/3">Net Premium</td><td className="border border-gray-400 p-2">Rs {policy.net_premium}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">CGST (9%)</td><td className="border border-gray-400 p-2">Rs {policy.cgst_amount}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">SGST (9%)</td><td className="border border-gray-400 p-2">Rs {policy.sgst_amount}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">IGST (18%)</td><td className="border border-gray-400 p-2">Rs {policy.igst_amount}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">Gross Premium</td><td className="border border-gray-400 p-2">Rs {policy.gross_premium}</td></tr>
          <tr><td className="border border-gray-400 p-2 font-bold">GST Registration No</td><td className="border border-gray-400 p-2">{policy.gst_registration_no}</td></tr>
        </tbody>
      </table>

      {/* Cashless Claim Facility */}
      <div className="bg-[#c0504d] text-white px-2 py-1 font-bold text-[13px] mt-5">VII. Cashless Claim Facility</div>
      <table className="w-full border-collapse text-[13px] mb-0 border border-gray-400">
        <tbody>
          <tr><th className="border border-gray-400 p-2 font-bold w-1/3">Feature</th><td className="border border-gray-400 p-2">{policy.cashless_feature || "Cashless Anywhere"}</td></tr>
          <tr><th className="border border-gray-400 p-2 font-bold">Description</th><td className="border border-gray-400 p-2">{policy.cashless_description}</td></tr>
        </tbody>
      </table>
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
                const response = await axios.get(`http://localhost:5000/api/personal-details?userId=${userIdToFetch}`);
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
    
    // Check for Shanghai Social Insurance
    if (selectedPolicy.policy_type === "Social Insurance" || selectedPolicy.country === "China") {
      return <ShanghaiSocialInsuranceSchedule policy={selectedPolicy} />;
    }
    // Check for Group Activ Secure
    if (selectedPolicy.product_name === "Group Activ Secure" || selectedPolicy.coverage_type) {
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