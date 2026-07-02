// MyAssets.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, X } from 'lucide-react';
import Button from "../../components/Button";
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from "../../components/dashboard/DashboardHeader";

const API_BASE_URL = "http://localhost:5000/api/employeeassets";

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
    { id: 1, asset_name: "Laptop", quantity: "", serial_number: "", model_name: "", remarks: "", custom_asset: "" }
  ]);
  const [submittedAssets, setSubmittedAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [userId, setUserId] = useState("");
  const [nextId, setNextId] = useState(2);
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();

  // Get employee info from localStorage and fetch personal details
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const identifier = user.userId || user.username || user.id;
        if (identifier) {
          setUserId(identifier);
          fetchPersonalDetailsAndAssets(identifier);
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

const fetchPersonalDetailsAndAssets = async (username) => {
  setLoading(true);
  try {
    let empNum = "";
    let fullName = "";
    
    // 1. Fetch personal details
    try {
      const pdRes = await axios.get(`http://localhost:5000/api/personal-details?userId=${username}`);
      console.log("Personal details response:", pdRes.data);
      
      if (pdRes.data.success && pdRes.data.data) {
        empNum = pdRes.data.data.employeeNumber || "";
        fullName = pdRes.data.data.fullName || "";
      }
    } catch (e) {
      console.warn("Could not fetch personal details:", e);
      // Try alternative endpoint if needed
      try {
        const altRes = await axios.get(`http://localhost:5000/api/personal-details/${username}`);
        if (altRes.data.success && altRes.data.data) {
          empNum = altRes.data.data.employeeNumber || "";
          fullName = altRes.data.data.fullName || "";
        }
      } catch (altErr) {
        console.warn("Alternative fetch also failed:", altErr);
      }
    }
    
    console.log("Found employee data:", { empNum, fullName });
    setEmployeeNumber(empNum);
    setEmployeeName(fullName);

    // 2. Fetch existing assets only if we have employee number
    if (empNum) {
      const response = await axios.get(`${API_BASE_URL}/employee/${empNum}`);
      console.log("Assets response:", response.data);
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const existingRecord = response.data.data[0];
        if (existingRecord.assets && existingRecord.assets.length > 0) {
          setSubmittedAssets(existingRecord.assets.map((asset, index) => ({
            ...asset,
            submitted_date: existingRecord.submitted_date
          })));
        }
      }
    } else {
      console.warn("No employee number found, cannot fetch assets");
    }
  } catch (err) {
    console.error("Error fetching data:", err);
    if (err.response) {
      console.error("Error response:", err.response.data);
    }
  } finally {
    setLoading(false);
  }
};

  // Add new asset row
  const addAsset = () => {
    setAssets([
      ...assets,
      { id: nextId, asset_name: "", quantity: "", serial_number: "", model_name: "", remarks: "", custom_asset: "" }
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
          model_name: asset.model_name || "",
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
        employee_number: employeeNumber,
        employee_name: employeeName,
        assets: filteredAssets
      };

      const response = await axios.post(API_BASE_URL, payload);
      if (response.data.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Reset form
        setAssets([
          { id: 1, asset_name: "Laptop", quantity: "", serial_number: "", model_name: "", remarks: "", custom_asset: "" }
        ]);
        setNextId(2);
        
        // Refresh history
        if (employeeNumber) {
          fetchPersonalDetailsAndAssets(employeeNumber);
        } else {
          fetchPersonalDetailsAndAssets(employeeName);
        }
      }
    } catch (err) {
      console.error("Error submitting assets:", err);
      alert(err.response?.data?.message || "Failed to save assets");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        title="My Assets"
        actions={
          <div className="text-sm text-white/90 font-medium">
            Welcome, <span className="font-bold text-white">{userId}</span>
          </div>
        }
      />

      <DashboardContainer>
        <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-slideInDown">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-green-700 font-medium">
                Assets saved successfully!
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
              Enter Your Assets
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please list all assets provided to you by the company
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Assets Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Asset Type</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600 w-24">Quantity</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Serial Number</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Model Name</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <div>
                          <select
                            value={asset.asset_name}
                            onChange={(e) => updateAsset(asset.id, "asset_name", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="" className="cursor-pointer">Select Asset</option>
                            {assetOptions.map(opt => (
                              <option key={opt.value} value={opt.value} className="cursor-pointer">{opt.label}</option>
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
                        <input
                          type="text"
                          value={asset.model_name}
                          onChange={(e) => updateAsset(asset.id, "model_name", e.target.value)}
                          placeholder="e.g. Lenovo, Dell"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        {asset.id !== 1 && (
                          <Button
                            variant="danger-soft"
                            size="sm"
                            icon={X}
                            onClick={() => removeAsset(asset.id)}
                            title="Remove asset"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Asset Button */}
            <Button
              variant="ghost"
              className="mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              icon={Plus}
              onClick={addAsset}
            >
              Add Asset
            </Button>

            {/* Form Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={submitting}
              >
                Save Assets
              </Button>
            </div>
          </form>
        </div>

        {/* Previously Submitted Assets History */}
        {submittedAssets.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Submissions History</h3>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Asset</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Serial Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Model Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Submitted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedAssets.map((asset, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-700">{asset.asset_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{asset.quantity}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{asset.serial_number || "-"}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {asset.model_name || asset.condition || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{asset.submitted_date || "-"}</td>
                      </tr>
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
      </DashboardContainer>
    </DashboardLayout>
  );
};

export default MyAssets;