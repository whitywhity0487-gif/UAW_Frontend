// MyAssets.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://uaw-backend.vercel.app/api/employee-assets";

// Available asset types for dropdown (without emojis)
const assetOptions = [
  { value: "Laptop", label: "Laptop" },
  { value: "Charger", label: "Charger" },
  { value: "Monitor", label: "Monitor" },
  { value: "Keyboard", label: "Keyboard" },
  { value: "Mouse", label: "Mouse" },
  { value: "Headset", label: "Headset" },
  { value: "Docking Station", label: "Docking Station" },
  { value: "Webcam", label: "Webcam" },
  { value: "Laptop Bag", label: "Laptop Bag" },
  { value: "Desk Phone", label: "Desk Phone" },
  { value: "External Hard Drive", label: "External Hard Drive" },
  { value: "USB Drive", label: "USB Drive" },
  { value: "Notebook", label: "Notebook" },
  { value: "Pen Drive", label: "Pen Drive" },
  { value: "Other", label: "Other (Please specify)" }
];

const MyAssets = () => {
  const [assets, setAssets] = useState([
    { id: 1, asset_name: "Laptop", quantity: "", serial_number: "", condition: "Good", remarks: "", custom_asset: "" }
  ]);
  const [submittedAssets, setSubmittedAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [nextId, setNextId] = useState(2);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const navigate = useNavigate();

  // Get employee info from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setEmployeeName(user.name || user.username || "Employee");
        setEmployeeId(user.id || user.username || "EMP001");
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
    fetchMyAssets();
  }, []);

  // Fetch employee's submitted assets
const fetchMyAssets = async () => {
  setLoading(true);
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    // Try to get userId, username, or employeeNumber
    const identifier = storedUser?.userId || storedUser?.username || storedUser?.id;
    
    const response = await axios.get(`${API_BASE_URL}/employee/${identifier}`);
    if (response.data.success) {
      setSubmittedAssets(response.data.data);
    }
  } catch (err) {
    console.error("Error fetching assets:", err);
  } finally {
    setLoading(false);
  }
};

  // Add new asset row
  const addAsset = () => {
    setAssets([
      ...assets,
      { id: nextId, asset_name: "", quantity: "", serial_number: "", condition: "Good", remarks: "", custom_asset: "" }
    ]);
    setNextId(nextId + 1);
  };

  // Remove asset row
  const removeAsset = (id) => {
    if (assets.length === 1) {
      alert("You must have at least one asset entry");
      return;
    }
    setAssets(assets.filter(asset => asset.id !== id));
  };

  // Update asset field
  const updateAsset = (id, field, value) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, [field]: value } : asset
    ));
  };

  // Get final asset name (for "Other" option)
  const getFinalAssetName = (asset) => {
    if (asset.asset_name === "Other" && asset.custom_asset) {
      return asset.custom_asset;
    }
    return asset.asset_name;
  };

  // Submit assets
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one asset has quantity
    const hasValidAsset = assets.some(asset => asset.quantity && parseInt(asset.quantity) > 0);
    if (!hasValidAsset) {
      alert("Please enter at least one asset with quantity");
      return;
    }

    // Filter out empty assets and validate "Other" selection
    const filteredAssets = [];
    for (const asset of assets) {
      if (asset.asset_name && asset.quantity && parseInt(asset.quantity) > 0) {
        // Check if "Other" is selected but no custom name provided
        if (asset.asset_name === "Other" && !asset.custom_asset.trim()) {
          alert("Please specify the asset name when selecting 'Other'");
          return;
        }
        filteredAssets.push({
          asset_name: getFinalAssetName(asset),
          quantity: parseInt(asset.quantity),
          serial_number: asset.serial_number || "",
          condition: asset.condition,
          remarks: asset.remarks || "",
          submitted_date: new Date().toISOString().split('T')[0]
        });
      }
    }
    
    if (filteredAssets.length === 0) {
      alert("Please fill at least one asset with name and quantity");
      return;
    }

    setSubmitting(true);
    try {
    // In handleSubmit function
const payload = {
  user_id: employeeId,  // Add this
  employee_id: employeeId,
  employee_name: employeeName,
  username: storedUser?.username,
  employee_number: employeeNumber || "",  // Add if you have it
  assets: filteredAssets
};

      const response = await axios.post(API_BASE_URL, payload);
      if (response.data.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Reset form
        setAssets([
          { id: 1, asset_name: "Laptop", quantity: "", serial_number: "", condition: "Good", remarks: "", custom_asset: "" }
        ]);
        setNextId(2);
        
        // Refresh submitted assets
        fetchMyAssets();
      }
    } catch (err) {
      console.error("Error submitting assets:", err);
      alert(err.response?.data?.message || "Failed to submit assets");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit existing submission
  const handleEdit = (submission) => {
    setEditMode(true);
    setEditId(submission.id);
    // Convert submission data to form format
    const convertedAssets = submission.assets.map((asset, index) => ({
      id: index + 1,
      asset_name: asset.asset_name,
      quantity: asset.quantity,
      serial_number: asset.serial_number || "",
      condition: asset.condition || "Good",
      remarks: asset.remarks || "",
      custom_asset: ""
    }));
    setAssets(convertedAssets);
    setNextId(convertedAssets.length + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditMode(false);
    setEditId(null);
    setAssets([
      { id: 1, asset_name: "Laptop", quantity: "", serial_number: "", condition: "Good", remarks: "", custom_asset: "" }
    ]);
    setNextId(2);
  };

  // Update existing submission
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const filteredAssets = [];
    for (const asset of assets) {
      if (asset.asset_name && asset.quantity && parseInt(asset.quantity) > 0) {
        if (asset.asset_name === "Other" && !asset.custom_asset.trim()) {
          alert("Please specify the asset name when selecting 'Other'");
          return;
        }
        filteredAssets.push({
          asset_name: getFinalAssetName(asset),
          quantity: parseInt(asset.quantity),
          serial_number: asset.serial_number || "",
          condition: asset.condition,
          remarks: asset.remarks || ""
        });
      }
    }
    
    setSubmitting(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/${editId}`, {
        assets: filteredAssets
      });
      
      if (response.data.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setEditMode(false);
        setEditId(null);
        setAssets([
          { id: 1, asset_name: "Laptop", quantity: "", serial_number: "", condition: "Good", remarks: "", custom_asset: "" }
        ]);
        fetchMyAssets();
      }
    } catch (err) {
      console.error("Error updating assets:", err);
      alert(err.response?.data?.message || "Failed to update assets");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans','Inter',sans-serif]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Home
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-800">My Assets</h1>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Welcome, <span className="font-semibold text-gray-700">{employeeName}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-slideInDown">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-green-700 font-medium">
                {editMode ? "Assets updated successfully!" : "Assets submitted successfully!"}
              </p>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Enter the quantity for each asset you have received from the company</li>
                <li>Click <strong>"+ Add Asset"</strong> to add more asset types</li>
                <li>Select <strong>"Other"</strong> from dropdown to type a custom asset name</li>
                <li>Provide serial numbers if available</li>
                <li>Submit the form to confirm your assets</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Asset Entry Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              {editMode ? "Edit Your Assets" : "Enter Your Assets"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please list all assets provided to you by the company
            </p>
          </div>

          <form onSubmit={editMode ? handleUpdate : handleSubmit} className="p-6">
            {/* Assets Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Asset Type</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600 w-24">Quantity</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Serial Number</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Condition</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        {asset.id === 1 && !editMode ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Laptop</span>
                            <input type="hidden" value="Laptop" />
                          </div>
                        ) : (
                          <div>
                            <select
                              value={asset.asset_name}
                              onChange={(e) => updateAsset(asset.id, "asset_name", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select Asset</option>
                              {assetOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            {asset.asset_name === "Other" && (
                              <input
                                type="text"
                                value={asset.custom_asset}
                                onChange={(e) => updateAsset(asset.id, "custom_asset", e.target.value)}
                                placeholder="Enter asset name"
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                              />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={asset.quantity}
                          onChange={(e) => updateAsset(asset.id, "quantity", e.target.value)}
                          placeholder="Qty"
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={asset.serial_number}
                          onChange={(e) => updateAsset(asset.id, "serial_number", e.target.value)}
                          placeholder="Serial No"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={asset.condition}
                          onChange={(e) => updateAsset(asset.id, "condition", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {asset.id !== 1 && (
                          <button
                            type="button"
                            onClick={() => removeAsset(asset.id)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Remove asset"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Asset Button */}
            <button
              type="button"
              onClick={addAsset}
              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + Add Asset
            </button>

            {/* Form Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {submitting ? "Updating..." : "Update Assets"}
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Assets"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Previously Submitted Assets */}
        {submittedAssets.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Previously Submitted Assets</h3>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Asset</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Serial Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Condition</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Submitted On</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedAssets.map((submission, submissionIdx) => (
                      <React.Fragment key={submission.id || submissionIdx}>
                        {submission.assets && submission.assets.map((asset, idx) => (
                          <tr key={`${submission.id}-${idx}`} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-700">{asset.asset_name}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{asset.quantity}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{asset.serial_number || "-"}</td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                asset.condition === "Good" ? "bg-green-100 text-green-700" :
                                asset.condition === "Fair" ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {asset.condition}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">{submission.submitted_date}</td>
                            {idx === 0 && (
                              <td className="py-3 px-4 text-center" rowSpan={submission.assets.length}>
                                <button
                                  onClick={() => handleEdit(submission)}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  Edit
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes slideInDown {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slideInDown {
            animation: slideInDown 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default MyAssets;
