// components/PolicyTemplate.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PolicySecurity from "./PolicySecurity";
import { API_BASE_URL as GLOBAL_API_BASE_URL } from '../../../config/constants.js';
import toast from 'react-hot-toast';

const API_BASE_URL = `${GLOBAL_API_BASE_URL}/api/policy`;

// ─── Chevron helper ───────────────────────────────────────────────────────────
const ChevronRight = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
  </svg>
);

// ─── MetaItem ─────────────────────────────────────────────────────────────────
const MetaItem = ({ icon, label }) => (
  <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
    {icon}
    {label}
  </span>
);

// ─── PolicyContent ────────────────────────────────────────────────────────────
const PolicyContent = ({ description, accentColor }) => {
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

  // (Early return removed to ensure list parsing always runs)

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
    <div className="flex flex-col gap-11">
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
                    <p className="text-[18px] text-[#374151] leading-[1.9] m-0">{numMatch[2]}</p>
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
                    <p className="text-[18px] text-[#374151] leading-[1.9] m-0">{bulletMatch[1]}</p>
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
                    className="grid gap-px bg-[#F3F4F6] border border-[#E5E7EB] rounded-md overflow-hidden"
                    style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}
                  >
                    {cells.map((cell, ci) => (
                      <div
                        key={ci}
                        className={`text-base text-[#374151] px-4 py-2.5 bg-white ${ci === 0 ? "font-semibold" : "font-normal"}`}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <p key={i} className="text-[18px] text-[#4B5563] leading-[1.9] m-0">
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

// ─── AddEditPolicyModal ───────────────────────────────────────────────────────
const AddEditPolicyModal = ({ isOpen, onClose, onSave, policy = null }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nationalities, setNationalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditing = !!policy;

  useEffect(() => {
    if (policy) {
      setTitle(policy.title || "");
      setDescription(policy.description || "");
      if (Array.isArray(policy.nationality)) {
        setNationalities(policy.nationality);
      } else if (typeof policy.nationality === "string" && policy.nationality.trim() !== "") {
        setNationalities([policy.nationality]);
      } else {
        setNationalities([]);
      }
    } else {
      setTitle("");
      setDescription("=== Objective ===\n\n\n=== Scope ===\n\n\n=== Policy Guidelines ===\n\n");
      setNationalities([]);
    }
  }, [policy, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || nationalities.length === 0) {
      toast.error("Please fill in all fields including Nationality Target");
      return;
    }
    setLoading(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), nationality: nationalities });
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[90%] max-w-[800px] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-7 py-6 border-b border-[#E5E7EB]">
            <h2 className="m-0 text-[22px] font-bold">
              {isEditing ? "Edit Policy" : "Add New Policy"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent border-none text-2xl cursor-pointer text-[#9CA3AF] p-1 leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-7">
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-sm">Policy Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Code of Conduct, Data Privacy Policy..."
                className="w-full px-3.5 py-3 border border-[#D1D5DB] rounded-lg text-[15px] outline-none"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-sm">Nationality Target *</label>
              <div className="flex flex-wrap gap-4 px-1 py-2">
                <label className="flex items-center gap-2 cursor-pointer text-[15px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={nationalities.includes("INDIA")}
                    onChange={(e) => {
                      if (e.target.checked) setNationalities(prev => [...prev, "INDIA"]);
                      else setNationalities(prev => prev.filter(n => n !== "INDIA"));
                    }}
                  /> India
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[15px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={nationalities.includes("CHINA")}
                    onChange={(e) => {
                      if (e.target.checked) setNationalities(prev => [...prev, "CHINA"]);
                      else setNationalities(prev => prev.filter(n => n !== "CHINA"));
                    }}
                  /> China
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[15px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={nationalities.includes("USA")}
                    onChange={(e) => {
                      if (e.target.checked) setNationalities(prev => [...prev, "USA"]);
                      else setNationalities(prev => prev.filter(n => n !== "USA"));
                    }}
                  /> USA
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[15px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={nationalities.includes("GLOBAL")}
                    onChange={(e) => {
                      if (e.target.checked) setNationalities(prev => [...prev, "GLOBAL"]);
                      else setNationalities(prev => prev.filter(n => n !== "GLOBAL"));
                    }}
                  /> Global (All)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[15px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={nationalities.includes("ADMIN_ONLY")}
                    onChange={(e) => {
                      if (e.target.checked) setNationalities(prev => [...prev, "ADMIN_ONLY"]);
                      else setNationalities(prev => prev.filter(n => n !== "ADMIN_ONLY"));
                    }}
                  /> Admin Only
                </label>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-2 text-sm">Policy Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write the policy content here..."
                rows={12}
                className="w-full px-3.5 py-3 border border-[#D1D5DB] rounded-lg text-sm font-mono resize-y outline-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end px-7 py-5 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-[#D1D5DB] bg-white cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg border-none bg-[#111827] text-white cursor-pointer font-semibold disabled:opacity-60"
            >
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, policyTitle }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[90%] max-w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-5 mx-auto">
            <svg width="24" height="24" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-center m-0 mb-3 text-xl font-semibold">Delete Policy?</h3>
          <p className="text-center text-[#6B7280] mb-6">
            Are you sure you want to delete <strong>"{policyTitle}"</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-[#D1D5DB] bg-white cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2.5 rounded-lg border-none bg-[#DC2626] text-white cursor-pointer font-semibold"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PolicyTemplate ───────────────────────────────────────────────────────────
const PolicyTemplate = ({
  policyType,
  title,
  icon,
  gradientColors,
  accentColor,
  bgColor,
  headerGradient,
  filterKeywords = [],
  excludeKeywords = [],
  showAddButton = false,
  footerMessage,
}) => {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userNationality, setUserNationality] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToEdit, setPolicyToEdit] = useState(null);
  const [policyToDelete, setPolicyToDelete] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const adminCheck = ["Admin", "admin", "ADMIN"].includes(user.role);
        setIsAdmin(adminCheck);

        if (!adminCheck) {
          let nat = user.nationality || "INDIA";
          setUserNationality(nat.toUpperCase());

          const userIdToFetch = user.username || user.employeeId || user.userId;
          if (userIdToFetch) {
            axios.get(`${GLOBAL_API_BASE_URL}/api/personal-details?userId=${userIdToFetch}`)
              .then(res => {
                if (res.data?.data?.nationality) {
                  setUserNationality(res.data.data.nationality.toUpperCase());
                }
              })
              .catch(() => { });
          }
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  useEffect(() => {
    fetchFilteredPolicies();
  }, []);

  const fetchFilteredPolicies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_BASE_URL);
      if (response.data.success) {
        let filtered = response.data.data;
        if (filterKeywords.length > 0) {
          filtered = filtered.filter((policy) =>
            filterKeywords.some((kw) => policy.title.toLowerCase().includes(kw))
          );
        }
        if (excludeKeywords.length > 0) {
          filtered = filtered.filter(
            (policy) => !excludeKeywords.some((kw) => policy.title.toLowerCase().includes(kw))
          );
        }
        setPolicies(filtered);
        if (filtered.length > 0 && !selectedPolicy) setSelectedPolicy(filtered[0]);
      }
    } catch (err) {
      setError(`Failed to load ${policyType} policies. Make sure the backend server is running.`);
      console.error(`Error fetching ${policyType} policies:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = async (policyData) => {
    const response = await axios.post(API_BASE_URL, policyData);
    if (response.data.success) {
      await fetchFilteredPolicies();
      setSelectedPolicy(response.data.data);
      toast.success("Policy created successfully!");
    }
    return response;
  };

  const handleEditPolicy = async (policyData) => {
    const response = await axios.put(`${API_BASE_URL}/${policyToEdit.id}`, policyData);
    if (response.data.success) {
      await fetchFilteredPolicies();
      if (selectedPolicy?.id === policyToEdit.id) setSelectedPolicy(response.data.data);
      toast.success("Policy updated successfully!");
    }
    return response;
  };

  const handleDeletePolicy = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${policyToDelete.id}`);
      if (response.data.success) {
        await fetchFilteredPolicies();
        if (selectedPolicy?.id === policyToDelete.id)
          setSelectedPolicy(policies.length > 1 ? policies[0] : null);
        setIsDeleteModalOpen(false);
        setPolicyToDelete(null);
        toast.success("Policy deleted successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete policy");
    }
  };

  const openEditModal = (policy) => { setPolicyToEdit(policy); setIsEditModalOpen(true); };
  const openDeleteModal = (policy) => { setPolicyToDelete(policy); setIsDeleteModalOpen(true); };

  const nationalityPolicies = React.useMemo(() => {
    return policies.filter((p) => {
      if (isAdmin) return true;
      if (userNationality && p.nationality) {
        const polNats = Array.isArray(p.nationality)
          ? p.nationality.map(n => n.toUpperCase())
          : [p.nationality.toUpperCase()];

        if (polNats.includes("ADMIN_ONLY")) return false;
        if (polNats.includes("GLOBAL")) return true;
        return polNats.includes(userNationality.toUpperCase());
      }
      return true;
    });
  }, [policies, isAdmin, userNationality]);

  const filteredPolicies = React.useMemo(() => {
    return nationalityPolicies.filter((p) => {
      return p.title.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [nationalityPolicies, searchTerm]);

  useEffect(() => {
    if (filteredPolicies.length > 0) {
      if (!selectedPolicy || !filteredPolicies.some((p) => p.id === selectedPolicy.id)) {
        setSelectedPolicy(filteredPolicies[0]);
      }
    }
  }, [filteredPolicies, selectedPolicy]);

  const displayPolicy = selectedPolicy && filteredPolicies.some((p) => p.id === selectedPolicy.id) ? selectedPolicy : null;

  return (
    <PolicySecurity isAdmin={isAdmin}>
      <div className="flex h-screen font-['DM_Sans','Inter',sans-serif] bg-[#F8F9FB] overflow-hidden text-[#111827]">

        {/* ── SIDEBAR ── */}
        <aside
          className="bg-white border-r border-[#E5E7EB] flex flex-col overflow-hidden shrink-0 transition-[width,min-width] duration-[250ms] ease-in-out"
          style={{ width: sidebarOpen ? 320 : 0, minWidth: sidebarOpen ? 320 : 0 }}
        >
          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-4 border-b border-[#F3F4F6]">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-2.5 bg-white border border-[#E5E7EB] rounded-[10px] cursor-pointer px-3.5 py-2.5 mb-5 text-[13px] text-[#4B5563] font-medium w-full"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Home
            </button>

            {(!loading && !error && nationalityPolicies.length === 0) ? null : (
              <>
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)` }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#111827] m-0">UANDWE</p>
                    <p className="text-[10.5px] text-[#9CA3AF] m-0 uppercase">{title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg px-2.5 py-[7px] bg-[#F9FAFB]">
                  <svg width="13" height="13" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder={`Search ${title.toLowerCase()}…`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none outline-none bg-transparent text-[13px] w-full"
                  />
                </div>
              </>
            )}
          </div>

          {/* Section label */}
          {(!loading && !error && nationalityPolicies.length === 0) ? null : (
            <div className="px-5 pt-3.5 pb-2">
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase m-0">{title}</p>
            </div>
          )}

          {/* Policy list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {loading ? (
              <div className="flex justify-center p-6">
                <div
                  className="w-[18px] h-[18px] rounded-full border-2 border-[#DBEAFE] animate-spin"
                  style={{ borderTopColor: accentColor }}
                />
              </div>
            ) : error ? (
              <p className="text-[13px] text-[#EF4444] p-3 text-center">{error}</p>
            ) : filteredPolicies.length === 0 ? (
              <p className="text-[13px] text-[#9CA3AF] p-3 text-center">
                {searchTerm ? `No matching ${policyType} policies` : (!userNationality && !isAdmin ? "Checking nationality..." : "No policies found for your nationality")}
              </p>
            ) : (
              filteredPolicies.map((policy) => {
                const isActive = selectedPolicy?.id === policy.id;
                return (
                  <button
                    key={policy.id}
                    onClick={() => setSelectedPolicy(policy)}
                    className={`w-full text-left px-3.5 py-[11px] rounded-[7px] border-none cursor-pointer mb-1 ${isActive ? "bg-[#F3F4F6]" : "bg-transparent"
                      }`}
                  >
                    <span
                      className={`text-[14.5px] leading-[1.55] ${isActive ? "text-[#111827] font-semibold" : "text-[#6B7280] font-normal"
                        }`}
                    >
                      {policy.title}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Sidebar footer */}
          {(!loading && !error && nationalityPolicies.length === 0) ? null : (
            <div className="px-5 py-2.5 border-t border-[#F3F4F6]">
              <p className="text-xs text-[#D1D5DB] m-0">
                {filteredPolicies.length} polic{filteredPolicies.length === 1 ? "y" : "ies"}
              </p>
            </div>
          )}
        </aside>

        {/* ── MAIN PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Top header bar */}
          <header className="bg-white border-b border-[#E5E7EB] h-[54px] flex items-center px-7 gap-3.5 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-[30px] h-[30px] rounded-md border border-[#E5E7EB] bg-white cursor-pointer flex items-center justify-center shrink-0"
            >
              <svg width="13" height="13" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <nav className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF]">
              {icon}
              <ChevronRight />
              <span>{title}</span>
              {selectedPolicy && (
                <>
                  <ChevronRight />
                  <span className="text-[#374151] font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[300px]">
                    {selectedPolicy.title}
                  </span>
                </>
              )}
            </nav>

            <div className="flex-1" />

            {showAddButton && isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 text-[13.5px] font-semibold text-white bg-[#111827] border-none rounded-lg px-[18px] py-[9px] cursor-pointer"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add New Policy
              </button>
            )}
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto px-[72px] py-10">
            {displayPolicy ? (
              <div className="w-full">

                {/* Policy header card */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
                  <div className="h-[3px]" style={{ background: headerGradient }} />

                  <div className="px-12 pt-[34px] pb-[30px]">
                    <div className="flex items-start justify-between gap-5 mb-[26px]">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)` }}
                          >
                            {icon}
                          </div>
                          <span
                            className="text-[13px] font-bold tracking-[0.13em] uppercase px-3 py-1 rounded-full"
                            style={{ color: accentColor, backgroundColor: bgColor }}
                          >
                            {title}
                          </span>
                        </div>
                        <h1 className="text-[38px] font-bold text-[#111827] m-0 leading-[1.2]">
                          {displayPolicy.title}
                        </h1>
                      </div>

                      {showAddButton && isAdmin && (
                        <div className="flex gap-2 shrink-0 mt-1.5">
                          <button
                            onClick={() => openEditModal(displayPolicy)}
                            className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#374151] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[18px] py-[9px] cursor-pointer"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(displayPolicy)}
                            className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-[18px] py-[9px] cursor-pointer"
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

                    <div className="flex flex-wrap gap-6 pt-[22px] border-t border-[#F3F4F6]">
                      <MetaItem
                        icon={
                          <svg width="15" height="15" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        }
                        label="UANDWE Technologies"
                      />
                    </div>
                  </div>
                </div>

                {/* Policy body card */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl px-[52px] py-11">
                  <PolicyContent description={displayPolicy.description} accentColor={accentColor} />
                </div>

                {/* Footer notice */}
                <div
                  className="mt-5 px-5 py-3.5 rounded-lg flex items-start gap-2.5 border"
                  style={{ backgroundColor: bgColor, borderColor: gradientColors[1] }}
                >
                  <svg width="16" height="16" fill="none" stroke={accentColor} strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm m-0 leading-[1.7]" style={{ color: accentColor }}>
                    {footerMessage}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div
                  className="w-[60px] h-[60px] rounded-[14px] flex items-center justify-center"
                  style={{ backgroundColor: bgColor }}
                >
                  {icon}
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-[#374151] m-0 mb-1.5">
                    {filteredPolicies.length === 0 ? `No ${policyType} policies found` : `No ${policyType} policy selected`}
                  </h2>
                  <p className="text-[15px] text-[#9CA3AF] m-0">
                    {filteredPolicies.length === 0
                      ? (nationalityPolicies.length === 0
                        ? (!userNationality && !isAdmin ? "Checking nationality..." : "There are no policies available for your assigned nationality at this time.")
                        : "No policies match your search term.")
                      : `Choose a ${policyType} policy from the sidebar to view it here.`}
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ── Modals ── */}
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
          policyTitle={policyToDelete?.title}
        />

        <style>{`
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        `}</style>
      </div>
    </PolicySecurity>
  );
};

export default PolicyTemplate;