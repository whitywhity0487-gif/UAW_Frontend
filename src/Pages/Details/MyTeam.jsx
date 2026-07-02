import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Shield, User, Mail, Bell, Star, Phone } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import Button from '../../components/Button';
import DashboardLayout, { DashboardContainer } from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';

const extractDriveId = (url) => {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/d\/([a-zA-Z0-9_-]{10,})\//,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /open\?id=([a-zA-Z0-9_-]{10,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const getImageUrl = (url) => {
  const driveId = extractDriveId(url);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
  }
  return url;
};

const MyTeam = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [supervisedTeams, setSupervisedTeams] = useState([]);
  const [memberTeam, setMemberTeam] = useState(null);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      const username = currentUser?.username || JSON.parse(localStorage.getItem('user'))?.username;
      if (!username) return;
      
      try {
        const res = await axios.get(`http://localhost:5000/api/teams/user/${username}`);
        if (res.data.success) {
          setSupervisedTeams(res.data.data.supervises || []);
          setMemberTeam(res.data.data.memberOf || null);
          
       
        }
      } catch (err) {
        setError('Failed to fetch team details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [currentUser]);

  const handleLeaveAction = async (leaveId, status) => {
    setActionLoading(leaveId);
    try {
      const res = await axios.put(`http://localhost:5000/api/leave/status/${leaveId}`, {
        status,
        remarks: ''
      });
      if (res.data.success) {
        setTeamLeaves(prev => prev.map(leave => 
          leave.id === leaveId ? { ...leave, status } : leave
        ));
      }
    } catch (err) {
      console.error("Failed to update leave status", err);
      alert("Failed to update leave status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="text-gray-500 font-medium">Loading your team details...</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        title="My Team"
        subtitle="View your team members and supervisor information"
      />
      <DashboardContainer>
        <div className="max-w-5xl mx-auto">

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {supervisedTeams.length === 0 && !memberTeam && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Not Assigned to a Team</h3>
            <p className="text-gray-500 max-w-sm mx-auto">You are currently not a member or supervisor of any team. Please contact your admin for team assignment.</p>
          </div>
        )}

        {/* Teams I Supervise */}
        {supervisedTeams.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-indigo-600" />
              {currentUser?.role === 'HR' ? 'Teams You Support (HR)' : 'Teams You Supervise'}
            </h2>
            
            <div className="space-y-6">
              {supervisedTeams.map(team => (
                <div key={team.id} className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                  <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-indigo-900">{team.name}</h3>
                      <p className="text-sm text-indigo-700 mt-0.5">{team.members?.length || 0} Members</p>
                    </div>
                  </div>
                  <div className="p-6">
                    {team.supervisor && team.supervisor.userId !== currentUser?.username && (
                      <div className="mb-6 pb-6 border-b border-indigo-100">
                        <h4 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                          <Shield size={16} className="text-indigo-500" />
                          Team Supervisor
                        </h4>
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-indigo-100 hover:shadow-sm hover:border-indigo-200 transition-all">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold shadow-sm border border-indigo-200 overflow-hidden">
                            {team.supervisor.profilePhotoLink ? (
                              <img src={getImageUrl(team.supervisor.profilePhotoLink)} alt={team.supervisor.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              team.supervisor.name ? team.supervisor.name.charAt(0).toUpperCase() : 'S'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-gray-900 truncate">{team.supervisor.name || 'Unknown Name'}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1">
                              <p className="text-xs text-gray-600 flex items-center gap-1.5 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100 w-fit">
                                <span className="text-gray-400 font-sans text-[10px] uppercase tracking-wider">ID:</span> {team.supervisor.employeeNumber || team.supervisor.userId}
                              </p>
                              {team.supervisor.email && (
                                <a href={`mailto:${team.supervisor.email}`} className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5 truncate transition-colors">
                                  <Mail size={12} /> {team.supervisor.email}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {team.members && team.members.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                          <Users size={16} className="text-indigo-500" />
                          Team Members
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {team.members.map(member => (
                          <div key={member.userId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold shadow-sm border border-indigo-200/50 overflow-hidden">
                              {member.profilePhotoLink ? (
                                <img src={getImageUrl(member.profilePhotoLink)} alt={member.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                member.name ? member.name.charAt(0).toUpperCase() : 'U'
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                              <div className="flex flex-col mt-1 space-y-1.5">
                                <p className="text-xs text-gray-500 font-mono truncate">ID: {member.employeeNumber || member.userId}</p>
                                
                                {member.email && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                    <Mail size={12} className="text-gray-400 shrink-0" />
                                    <a href={`mailto:${member.email}`} className="hover:text-indigo-600 hover:underline truncate">
                                      {member.email}
                                    </a>
                                  </div>
                                )}
                                
                                {member.mobileNumber && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                    <Phone size={12} className="text-gray-400 shrink-0" />
                                    <a href={`tel:${member.mobileNumber}`} className="hover:text-green-600 hover:underline truncate">
                                      {member.mobileNumber}
                                    </a>
                                  </div>
                                )}
                                
                                {member.skills && member.skills.length > 0 && (
                                  <div className="flex items-start gap-1.5 text-[11px] text-gray-600 mt-0.5">
                                    <Star size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div className="flex flex-wrap gap-1">
                                      {member.skills.map((s, i) => (
                                        <span key={i} className="bg-gray-50 text-gray-700 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-sm">No members are currently assigned to this team.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave Requests Awaiting Approval */}
   

        {/* Team I belong to */}
        {memberTeam && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              Your Team
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Team Info Card */}
              <div className="md:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                  <Users size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{memberTeam.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Your assigned team</p>
                </div>
              </div>

              {/* Supervisor Info Card */}
              <div className="md:col-span-1 bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Team Supervisor</h3>
                </div>
                <div className="p-6 flex items-center">
                  {memberTeam.supervisor ? (
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold text-xl shadow-sm border border-emerald-200 overflow-hidden">
                        {memberTeam.supervisor.profilePhotoLink ? (
                          <img src={getImageUrl(memberTeam.supervisor.profilePhotoLink)} alt={memberTeam.supervisor.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          memberTeam.supervisor.name ? memberTeam.supervisor.name.charAt(0).toUpperCase() : 'S'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 truncate">{memberTeam.supervisor.name || 'Unknown Name'}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1.5">
                          <p className="text-sm text-gray-600 flex items-center gap-1.5 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100 w-fit">
                            <span className="text-gray-400 font-sans text-xs uppercase tracking-wider">ID:</span> {memberTeam.supervisor.employeeNumber || memberTeam.supervisor.userId}
                          </p>
                          {memberTeam.supervisor.email && (
                            <a href={`mailto:${memberTeam.supervisor.email}`} className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 truncate transition-colors">
                              <Mail size={14} /> {memberTeam.supervisor.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-gray-500 italic">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><User size={20} className="text-gray-400" /></div>
                      <p>No supervisor is currently assigned to this team.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* HR Info Card */}
              <div className="md:col-span-1 bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
                <div className="bg-purple-50/50 px-6 py-4 border-b border-purple-100 flex items-center gap-2">
                  <Shield size={18} className="text-purple-600" />
                  <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">Assigned HR</h3>
                </div>
                <div className="p-6 flex items-center">
                  {memberTeam.hr ? (
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0 text-purple-700 font-bold text-xl shadow-sm border border-purple-200 overflow-hidden">
                        {memberTeam.hr.profilePhotoLink ? (
                          <img src={getImageUrl(memberTeam.hr.profilePhotoLink)} alt={memberTeam.hr.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          memberTeam.hr.name ? memberTeam.hr.name.charAt(0).toUpperCase() : 'H'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 truncate">{memberTeam.hr.name || 'Unknown Name'}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1.5">
                          <p className="text-sm text-gray-600 flex items-center gap-1.5 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100 w-fit">
                            <span className="text-gray-400 font-sans text-xs uppercase tracking-wider">ID:</span> {memberTeam.hr.employeeNumber || memberTeam.hr.userId}
                          </p>
                          {memberTeam.hr.email && (
                            <a href={`mailto:${memberTeam.hr.email}`} className="text-sm text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1.5 truncate transition-colors">
                              <Mail size={14} /> {memberTeam.hr.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-gray-500 italic">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><User size={20} className="text-gray-400" /></div>
                      <p>No HR is currently assigned to this team.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Render Team Members */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden animate-fade-in">
              <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-blue-900">Your Team Members</h3>
                <p className="text-sm text-blue-700">{memberTeam.members?.length || 0} Members</p>
              </div>
              <div className="p-6">
                {memberTeam.members && memberTeam.members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {memberTeam.members.map(member => {
                      const isCurrentUser = member.userId === (currentUser?.username || JSON.parse(localStorage.getItem('user'))?.username);
                      return (
                        <div key={member.userId} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          isCurrentUser 
                            ? 'border-blue-200 bg-blue-50/50 shadow-sm' 
                            : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                        }`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-sm border overflow-hidden ${
                            isCurrentUser 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-700' 
                              : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border-blue-200/50'
                          }`}>
                            {member.profilePhotoLink ? (
                              <img src={getImageUrl(member.profilePhotoLink)} alt={member.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              member.name ? member.name.charAt(0).toUpperCase() : 'U'
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {member.name} {isCurrentUser && <span className="text-xs text-blue-600 font-normal ml-1 border border-blue-200 bg-blue-100 px-1.5 py-0.5 rounded-md">(You)</span>}
                            </p>
                            <div className="flex flex-col mt-1 space-y-1.5">
                              <p className="text-xs text-gray-500 font-mono truncate">ID: {member.employeeNumber || member.userId}</p>
                              
                              {member.email && (
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                  <Mail size={12} className="text-gray-400 shrink-0" />
                                  <a href={`mailto:${member.email}`} className="hover:text-blue-600 hover:underline truncate">
                                    {member.email}
                                  </a>
                                </div>
                              )}
                              
                              {member.mobileNumber && (
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                  <Phone size={12} className="text-gray-400 shrink-0" />
                                  <a href={`tel:${member.mobileNumber}`} className="hover:text-green-600 hover:underline truncate">
                                    {member.mobileNumber}
                                  </a>
                                </div>
                              )}
                              
                              {member.skills && member.skills.length > 0 && (
                                <div className="flex items-start gap-1.5 text-[11px] text-gray-600 mt-0.5">
                                  <Star size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                  <div className="flex flex-wrap gap-1">
                                    {member.skills.map((s, i) => (
                                      <span key={i} className="bg-gray-50 text-gray-700 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm">No members are currently assigned to this team.</p>
                )}
              </div>
            </div>
          </div>
        )}

        </div>
      </DashboardContainer>
    </DashboardLayout>
  );
};

export default MyTeam;
