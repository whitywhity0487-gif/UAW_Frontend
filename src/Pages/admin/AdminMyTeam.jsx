import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Trash2, Edit, Save, X, ChevronLeft, Search, CheckCircle, XCircle, Shield
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/teams';

export default function AdminMyTeam() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    supervisorId: '',
    members: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState('');
  const [showSupervisorDropdown, setShowSupervisorDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, empRes] = await Promise.all([
        axios.get(API_BASE_URL),
        axios.get('http://localhost:5000/api/profile-approval/admin/profiles')
      ]);

      if (teamsRes.data.success) {
        setTeams(teamsRes.data.data);
      }
      if (empRes.data.success) {
        const approved = empRes.data.data.filter(emp => 
          emp.profileStatus === 'APPROVED' || emp.approvalStatus === 'APPROVED'
        );
        setEmployees(approved);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberToggle = (userId) => {
    setFormData(prev => {
      const isSelected = prev.members.includes(userId);
      if (isSelected) {
        return { ...prev, members: prev.members.filter(id => id !== userId) };
      } else {
        return { ...prev, members: [...prev.members, userId] };
      }
    });
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentTeamId(null);
    setFormData({ name: '', supervisorId: '', members: [] });
    setSearchTerm('');
    setShowMemberDropdown(false);
    setSupervisorSearchTerm('');
    setShowSupervisorDropdown(false);
    setShowModal(true);
  };

  const openEditModal = (team) => {
    setIsEditing(true);
    setCurrentTeamId(team.id);
    setFormData({
      name: team.name,
      supervisorId: team.supervisorId || '',
      members: team.members.map(m => m.userId)
    });
    setSearchTerm('');
    setShowMemberDropdown(false);
    setSupervisorSearchTerm('');
    setShowSupervisorDropdown(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.name.trim() || !formData.supervisorId) {
      setError('Name and Supervisor are required.');
      return;
    }

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/${currentTeamId}`, formData);
        setSuccess('Team updated successfully.');
      } else {
        await axios.post(API_BASE_URL, formData);
        setSuccess('Team created successfully.');
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save team.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await axios.delete(`${API_BASE_URL}/${id}`);
        setSuccess('Team deleted successfully.');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete team.');
      }
    }
  };


  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-gray-200 pb-6">
          <div>
            <button
              onClick={() => navigate('/home')}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Team Management</h1>
            <p className="text-gray-500 mt-1">Create and manage teams, assign supervisors and members</p>
          </div>
          <div>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <UserPlus size={18} /> Create Team
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-fade-in">
            <XCircle size={20} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100 animate-fade-in">
            <CheckCircle size={20} /> {success}
          </div>
        )}

        {/* Teams List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 animate-pulse">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Teams Found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">Get started by creating your first team and assigning a supervisor.</p>
            <button onClick={openCreateModal} className="text-blue-600 font-medium hover:text-blue-700">
              Create Team →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <div key={team.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                    <div className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1.5">
                      <Shield size={12} className="text-emerald-500" />
                      Supervisor: <span className="font-semibold text-gray-700">{team.supervisorName || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(team)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(team.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 mt-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex justify-between">
                    <span>Members</span>
                    <span className="bg-gray-100 text-gray-600 px-2 rounded-full">{team.members.length}</span>
                  </h4>
                  {team.members.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No members assigned.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {team.members.slice(0, 10).map(m => (
                        <div key={m.userId} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                          {m.name}
                        </div>
                      ))}
                      {team.members.length > 10 && (
                        <div className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-md">
                          +{team.members.length - 10} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Team' : 'Create Team'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Name *</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleInputChange} required
                  placeholder="e.g. Kyotrails, Recruitment Team"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supervisor *</label>
                {formData.supervisorId ? (
                  <div className="flex items-center justify-between border border-blue-200 bg-blue-50/50 rounded-xl px-4 py-2.5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold border border-blue-200">
                        {employees.find(e => e.userId === formData.supervisorId)?.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-blue-900">
                          {employees.find(e => e.userId === formData.supervisorId)?.firstName} {employees.find(e => e.userId === formData.supervisorId)?.lastName}
                        </span>
                        <span className="block text-xs font-mono text-blue-600/80">Emp No: {employees.find(e => e.userId === formData.supervisorId)?.employeeNumber || formData.supervisorId}</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, supervisorId: ''}))}
                      className="text-blue-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      title="Remove Supervisor"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search and select supervisor..."
                      value={supervisorSearchTerm}
                      onChange={(e) => {
                        setSupervisorSearchTerm(e.target.value);
                        setShowSupervisorDropdown(true);
                      }}
                      onFocus={() => setShowSupervisorDropdown(true)}
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow shadow-sm"
                    />
                    
                    {showSupervisorDropdown && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {employees.filter(emp => 
                          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(supervisorSearchTerm.toLowerCase()) ||
                          (emp.employeeNumber && emp.employeeNumber.toLowerCase().includes(supervisorSearchTerm.toLowerCase())) ||
                          emp.userId.toLowerCase().includes(supervisorSearchTerm.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No matching employees found</div>
                        ) : (
                          employees.filter(emp => 
                            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(supervisorSearchTerm.toLowerCase()) ||
                            (emp.employeeNumber && emp.employeeNumber.toLowerCase().includes(supervisorSearchTerm.toLowerCase())) ||
                            emp.userId.toLowerCase().includes(supervisorSearchTerm.toLowerCase())
                          ).map(emp => (
                            <div 
                              key={emp.userId}
                              onClick={() => {
                                setFormData(prev => ({...prev, supervisorId: emp.userId}));
                                setSupervisorSearchTerm('');
                                setShowSupervisorDropdown(false);
                              }}
                              className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 border border-gray-200">
                                {emp.firstName?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs text-gray-500 font-mono">Emp No: {emp.employeeNumber || emp.userId}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Team Members</label>
                  <span className="text-xs text-gray-500">{formData.members.length} selected</span>
                </div>
                
                {/* Selected Members Chips */}
                {formData.members.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                    {formData.members.map(memberId => {
                      const emp = employees.find(e => e.userId === memberId);
                      return emp ? (
                        <div key={memberId} className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-2.5 py-1.5 rounded-lg text-sm shadow-sm transition-colors hover:border-red-200">
                          <span className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</span>
                          <button 
                            type="button" 
                            onClick={() => handleMemberToggle(memberId)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md p-0.5 transition-colors"
                            title="Remove Member"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text" placeholder="Search and add members..."
                    value={searchTerm} 
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowMemberDropdown(true);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow shadow-sm"
                  />
                  
                  {showMemberDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {employees.filter(emp => 
                        !formData.members.includes(emp.userId) && emp.userId !== formData.supervisorId &&
                        (`${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (emp.employeeNumber && emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         emp.userId.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No employees available to add</div>
                      ) : (
                        employees.filter(emp => 
                          !formData.members.includes(emp.userId) && emp.userId !== formData.supervisorId &&
                          (`${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (emp.employeeNumber && emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           emp.userId.toLowerCase().includes(searchTerm.toLowerCase()))
                        ).map(emp => (
                          <div 
                            key={emp.userId} 
                            onClick={() => {
                              handleMemberToggle(emp.userId);
                              setSearchTerm('');
                              setShowMemberDropdown(false);
                            }}
                            className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 border border-gray-200">
                              {emp.firstName?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                              <p className="text-xs text-gray-500 font-mono">Emp No: {emp.employeeNumber || emp.userId}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Note: Assigning an employee will remove them from their previous team.</p>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 rounded-b-2xl">
              <button
                type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit} 
                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm transition flex justify-center items-center gap-2"
              >
                <Save size={18} /> {isEditing ? 'Update Team' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
