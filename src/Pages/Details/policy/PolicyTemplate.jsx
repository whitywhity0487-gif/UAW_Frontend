// components/PolicyTemplate.jsx (UPDATED with screenshot + download blocking)
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PolicySecurity from "./PolicySecurity";

const API_BASE_URL = "https://uaw-backend.vercel.app/api/policy";

// ─── Modal Components ─────────────────────────────────────────────────────────

const AddEditPolicyModal = ({ isOpen, onClose, onSave, policy = null }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = !!policy;

  useEffect(() => {
    if (policy) {
      setTitle(policy.title || "");
      setDescription(policy.description || "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [policy, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await onSave({ title: title.trim(), description: description.trim() });
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "white", borderRadius: 16, width: "90%", maxWidth: 800,
        maxHeight: "90vh", overflow: "auto", padding: 0,
      }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div style={{
            padding: "24px 28px", borderBottom: "1px solid #E5E7EB",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              {isEditing ? "Edit Policy" : "Add New Policy"}
            </h2>
            <button type="button" onClick={onClose} style={{
              background: "none", border: "none", fontSize: 24, cursor: "pointer",
              color: "#9CA3AF", padding: 4,
            }}>×</button>
          </div>

          <div style={{ padding: "28px" }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                Policy Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Code of Conduct, Data Privacy Policy..."
                style={{
                  width: "100%", padding: "12px 14px", border: "1px solid #D1D5DB",
                  borderRadius: 8, fontSize: 15, outline: "none",
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                Policy Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write the policy content here..."
                rows={12}
                style={{
                  width: "100%", padding: "12px 14px", border: "1px solid #D1D5DB",
                  borderRadius: 8, fontSize: 14, fontFamily: "monospace",
                  resize: "vertical", outline: "none",
                }}
                required
              />
            </div>
          </div>

          <div style={{
            padding: "20px 28px", borderTop: "1px solid #E5E7EB",
            display: "flex", gap: 12, justifyContent: "flex-end",
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
  footerMessage
}) => {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToEdit, setPolicyToEdit] = useState(null);
  const [policyToDelete, setPolicyToDelete] = useState(null);

  const navigate = useNavigate();

  // Get user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const adminCheck = user.role === "Admin" || user.role === "admin" || user.role === "ADMIN";
        setIsAdmin(adminCheck);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  // Fetch filtered policies
  useEffect(() => {
    fetchFilteredPolicies();
  }, []);

  // ─── Block keyboard shortcuts (screenshot, copy, print, devtools) ────────────
  // Handled by PolicySecurity wrapper

  const fetchFilteredPolicies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_BASE_URL);

      if (response.data.success) {
        let filtered = response.data.data;

        // Apply include filters (if any)
        if (filterKeywords.length > 0) {
          filtered = filtered.filter(policy =>
            filterKeywords.some(keyword =>
              policy.title.toLowerCase().includes(keyword)
            )
          );
        }

        // Apply exclude filters (if any)
        if (excludeKeywords.length > 0) {
          filtered = filtered.filter(policy =>
            !excludeKeywords.some(keyword =>
              policy.title.toLowerCase().includes(keyword)
            )
          );
        }

        setPolicies(filtered);
        if (filtered.length > 0 && !selectedPolicy) {
          setSelectedPolicy(filtered[0]);
        }
      }
    } catch (err) {
      setError(`Failed to load ${policyType} policies. Make sure the backend server is running.`);
      console.error(`Error fetching ${policyType} policies:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = async (policyData) => {
    try {
      const response = await axios.post(API_BASE_URL, policyData);
      if (response.data.success) {
        await fetchFilteredPolicies();
        const newPolicy = response.data.data;
        setSelectedPolicy(newPolicy);
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
        await fetchFilteredPolicies();
        if (selectedPolicy?.id === policyToEdit.id) {
          setSelectedPolicy(response.data.data);
        }
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
        await fetchFilteredPolicies();
        if (selectedPolicy?.id === policyToDelete.id) {
          setSelectedPolicy(policies.length > 1 ? policies[0] : null);
        }
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

  const filteredPolicies = policies.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PolicySecurity isAdmin={isAdmin}>
      <div
        style={{
          display: "flex",
          height: "100vh",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          backgroundColor: "#F8F9FB",
          overflow: "hidden",
          color: "#111827",
        }}
      >
        {/* SIDEBAR */}
      <aside
        style={{
          width: sidebarOpen ? 320 : 0,
          minWidth: sidebarOpen ? 320 : 0,
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.25s ease, min-width 0.25s ease",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10,
              cursor: "pointer", padding: "10px 14px", marginBottom: 20,
              fontSize: 13, color: "#4B5563", fontWeight: 500, width: "100%",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Home
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32,
              background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
              borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>UANDWE</p>
              <p style={{ fontSize: 10.5, color: "#9CA3AF", margin: 0, textTransform: "uppercase" }}>
                {title}
              </p>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            border: "1px solid #E5E7EB", borderRadius: 8,
            padding: "7px 10px", backgroundColor: "#F9FAFB",
          }}>
            <svg width="13" height="13" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, width: "100%" }}
            />
          </div>
        </div>

        <div style={{ padding: "14px 20px 8px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", margin: 0 }}>
            {title}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: "2px solid #DBEAFE", borderTopColor: accentColor,
                animation: "spin 0.7s linear infinite",
              }} />
            </div>
          ) : error ? (
            <p style={{ fontSize: 13, color: "#EF4444", padding: "12px", textAlign: "center" }}>{error}</p>
          ) : filteredPolicies.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9CA3AF", padding: "12px", textAlign: "center" }}>
              {searchTerm ? `No matching ${policyType} policies` : `No ${policyType} policies available`}
            </p>
          ) : (
            filteredPolicies.map((policy) => {
              const isActive = selectedPolicy?.id === policy.id;
              return (
                <button
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy)}
                  style={{
                    width: "100%", textAlign: "left", padding: "11px 14px",
                    borderRadius: 7, border: "none", cursor: "pointer", marginBottom: 4,
                    backgroundColor: isActive ? "#F3F4F6" : "transparent",
                  }}
                >
                  <span style={{
                    fontSize: 14.5, lineHeight: 1.55,
                    color: isActive ? "#111827" : "#6B7280",
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {policy.title}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div style={{ padding: "10px 20px", borderTop: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 12, color: "#D1D5DB", margin: 0 }}>
            {filteredPolicies.length} polic{filteredPolicies.length === 1 ? "y" : "ies"}
          </p>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <header style={{
          backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB",
          height: 54, display: "flex", alignItems: "center",
          padding: "0 28px", gap: 14, flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: 30, height: 30, borderRadius: 6, border: "1px solid #E5E7EB",
              background: "white", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <svg width="13" height="13" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9CA3AF" }}>
            {icon}
            <ChevronRight />
            <span>{title}</span>
            {selectedPolicy && (
              <>
                <ChevronRight />
                <span style={{
                  color: "#374151", fontWeight: 500,
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", maxWidth: 300,
                }}>
                  {selectedPolicy.title}
                </span>
              </>
            )}
          </nav>

          <div style={{ flex: 1 }} />

          {/* Add New Policy — only for admin */}
          {showAddButton && isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 13.5, fontWeight: 600, color: "#FFFFFF",
                backgroundColor: "#111827", border: "none", borderRadius: 8,
                padding: "9px 18px", cursor: "pointer",
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add New Policy
            </button>
          )}
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "40px 72px" }}>
          {selectedPolicy ? (
            <div style={{ width: "100%" }}>
              <div style={{
                backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB",
                borderRadius: 12, overflow: "hidden", marginBottom: 24,
              }}>
                <div style={{ height: 3, background: headerGradient }} />

                <div style={{ padding: "34px 48px 30px" }}>
                  <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", gap: 20, marginBottom: 26,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12,
                          background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {icon}
                        </div>
                        <span style={{
                          fontSize: 13, fontWeight: 700, letterSpacing: "0.13em",
                          textTransform: "uppercase", color: accentColor,
                          backgroundColor: bgColor, padding: "4px 12px", borderRadius: 20,
                        }}>
                          {title}
                        </span>
                      </div>
                      <h1 style={{
                        fontSize: 38, fontWeight: 700, color: "#111827",
                        margin: 0, lineHeight: 1.2, flex: 1,
                      }}>
                        {selectedPolicy.title}
                      </h1>
                    </div>

                    {/* Edit + Delete — only for admin */}
                    {showAddButton && isAdmin && (
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

                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: 24,
                    paddingTop: 22, borderTop: "1px solid #F3F4F6",
                  }}>
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

              <div style={{
                backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB",
                borderRadius: 12, padding: "44px 52px",
              }}>
                <PolicyContent description={selectedPolicy.description} accentColor={accentColor} />
              </div>

              <div style={{
                marginTop: 20, padding: "14px 20px",
                backgroundColor: bgColor, border: `1px solid ${gradientColors[1]}`,
                borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <svg width="16" height="16" fill="none" stroke={accentColor} strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ fontSize: 14, color: accentColor, margin: 0, lineHeight: 1.7 }}>
                  {footerMessage}
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 16, textAlign: "center",
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 14, backgroundColor: bgColor,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {icon}
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>
                  No {policyType} policy selected
                </h2>
                <p style={{ fontSize: 15, color: "#9CA3AF", margin: 0 }}>
                  Choose a {policyType} policy from the sidebar to view it here.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

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
        policyTitle={policyToDelete?.title}
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

// ─── Helper Components ────────────────────────────────────────────────────────

const ChevronRight = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
  </svg>
);

const MetaItem = ({ icon, label }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "#6B7280" }}>
    {icon}
    {label}
  </span>
);

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

  if (parts.every((p) => p.type === "text")) {
    return (
      <p style={{ fontSize: 19, color: "#374151", lineHeight: 1.9, whiteSpace: "pre-wrap", margin: 0 }}>
        {description}
      </p>
    );
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
    <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
      {sections.map((section, idx) => (
        <div key={idx}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <span style={{
              fontSize: 13, fontWeight: 700, letterSpacing: "0.13em",
              textTransform: "uppercase", color: accentColor,
              whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
            }}>
              {section.heading}
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {section.body.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              const numMatch = trimmed.match(/^(\d+)\)\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{
                      width: 27, height: 27, borderRadius: "50%",
                      backgroundColor: `${accentColor}20`, color: accentColor,
                      fontSize: 12, fontWeight: 700, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 3, border: `1px solid ${accentColor}40`,
                    }}>
                      {numMatch[1]}
                    </span>
                    <p style={{ fontSize: 18, color: "#374151", lineHeight: 1.9, margin: 0 }}>
                      {numMatch[2]}
                    </p>
                  </div>
                );
              }

              if (trimmed.startsWith("|")) {
                const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
                const isDivider = cells.every((c) => /^[-:]+$/.test(c));
                if (isDivider) return null;
                return (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
                    gap: 1, backgroundColor: "#F3F4F6",
                    border: "1px solid #E5E7EB", borderRadius: 6, overflow: "hidden",
                  }}>
                    {cells.map((cell, ci) => (
                      <div key={ci} style={{
                        fontSize: 16, color: "#374151", padding: "10px 16px",
                        backgroundColor: "#FFFFFF", fontWeight: ci === 0 ? 600 : 400,
                      }}>
                        {cell}
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <p key={i} style={{ fontSize: 18, color: "#4B5563", lineHeight: 1.9, margin: 0 }}>
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

export default PolicyTemplate;
