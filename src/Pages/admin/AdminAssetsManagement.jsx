import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Package } from 'lucide-react';
import DashboardLayout, { DashboardContainer } from "../../components/dashboard/DashboardLayout";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatCard from "../../components/dashboard/StatCard";

import { API_BASE_URL as GLOBAL_API_BASE_URL } from "../../config/constants.js";

const API_BASE_URL = `${GLOBAL_API_BASE_URL}/api/employeeassets`;

const AdminAssetsManagement = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSubmissions: 0,
    totalAssets: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const adminCheck = user.role === "Admin" || user.role === "admin" || user.role === "ADMIN";
        setIsAdmin(adminCheck);
        if (!adminCheck) {
          navigate('/home');
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
    fetchAllAssets();
  }, []);

  const fetchAllAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/all`);
      if (response.data.success) {
        setAssets(response.data.data);
        setFilteredAssets(response.data.data);

        // Calculate stats
        const uniqueEmployees = new Set(response.data.data.map(a => a.employee_number));
        const totalAssetsCount = response.data.data.reduce((sum, asset) => sum + (asset.assets?.length || 0), 0);

        setStats({
          totalEmployees: uniqueEmployees.size,
          totalSubmissions: response.data.data.length,
          totalAssets: totalAssetsCount
        });
      }
    } catch (err) {
      setError("Failed to fetch assets. Make sure the backend server is running.");
      console.error("Error fetching assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === "") {
      setFilteredAssets(assets);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search?q=${encodeURIComponent(term)}`);
      if (response.data.success) {
        setFilteredAssets(response.data.data);
      }
    } catch (err) {
      console.error("Search error:", err);
      const filtered = assets.filter(asset =>
        asset.employee_name?.toLowerCase().includes(term.toLowerCase()) ||
        asset.employee_number?.toLowerCase().includes(term.toLowerCase()) ||
        asset.assets?.some(a => a.asset_name?.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredAssets(filtered);
    } finally {
      setLoading(false);
    }
  };

  const viewAssetDetails = (asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "Good": return "bg-green-100 text-green-700";
      case "Fair": return "bg-yellow-100 text-yellow-700";
      case "Poor": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Employee Assets Management"
      />

      <DashboardContainer>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            {
              icon: Users,
              title: "Employees",
              value: stats.totalEmployees,
              colorClass: "text-blue-600 bg-blue-50"
            },
            {
              icon: FileText,
              title: "Submissions",
              value: stats.totalSubmissions,
              colorClass: "text-emerald-600 bg-emerald-50"
            },
            {
              icon: Package,
              title: "Total Assets",
              value: stats.totalAssets,
              colorClass: "text-purple-600 bg-purple-50"
            }
          ].map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by employee name, ID, or asset type..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Assets Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 rounded-full border-3 border-gray-200 border-t-blue-500 animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">
            <p>{error}</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No assets found</h3>
            <p className="text-gray-400">
              {searchTerm ? "Try a different search term" : "No employees have submitted assets yet"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Employee ID</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Employee Name</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Assets</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Last Updated</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                        {asset.employee_number || "-"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                        {asset.employee_name}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {Array.isArray(asset.assets) && asset.assets.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {asset.assets.slice(0, 3).map((a, idx) => (
                              <span key={idx} className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                {a.quantity}x {a.asset_name}
                              </span>
                            ))}
                            {asset.assets.length > 3 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                +{asset.assets.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : 'No assets'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {asset.updated_at ? new Date(asset.updated_at).toLocaleDateString() : asset.submitted_date}
                      </td>
                      <td className="py-4 px-6 text-sm text-center">
                        <button
                          onClick={() => viewAssetDetails(asset)}
                          className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DashboardContainer>

      {/* Modal - View Employee Assets Details */}
      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedAsset.employee_name}</h2>
                <p className="text-sm text-gray-500">
                  Employee No: {selectedAsset.employee_number || "-"}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700">
                    Submitted on: {selectedAsset.submitted_date}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAsset.status)}`}>
                    {selectedAsset.status || "Submitted"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Asset Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 w-24">Quantity</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Serial Number</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 w-28">Model Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(selectedAsset.assets) && selectedAsset.assets.length > 0 ? (
                        selectedAsset.assets.map((asset, assetIdx) => (
                          <tr key={assetIdx} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-700 font-medium">{asset.asset_name}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{asset.quantity}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{asset.serial_number || "-"}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">
                              {asset.model_name || asset.condition || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-gray-500">
                            No asset details available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedAsset.remarks && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Remarks:</span> {selectedAsset.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin { to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}
      </style>
    </DashboardLayout>
  );
};

export default AdminAssetsManagement;