import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Shield, User, Mail, Bell } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import Button from '../../components/Button';

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
          
          // If supervising, fetch team leave requests
          if (res.data.data.supervises && res.data.data.supervises.length > 0) {
            try {
              const leaveRes = await axios.get(`http://localhost:5000/api/leave/team/${username}`);
              if (leaveRes.data.success) {
                setTeamLeaves(leaveRes.data.data);
              }
            } catch (err) {
              console.error("Failed to fetch team leaves", err);
            }
          }
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
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-gray-200 pb-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              onClick={() => navigate('/home')}
              className="mb-4"
            >
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Team</h1>
            <p className="text-gray-500 mt-1">View your team members and supervisor information</p>
          </div>
        </div>

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
              Teams You Supervise
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
                    {team.members && team.members.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.members.map(member => (
                          <div key={member.userId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold shadow-sm border border-indigo-200/50">
                              {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                              <div className="flex flex-col mt-0.5">
                                <p className="text-xs text-gray-500 font-mono truncate">ID: {member.employeeNumber || member.userId}</p>
                                {member.email && (
                                  <a href={`mailto:${member.email}`} className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline truncate mt-0.5">
                                    {member.email}
                                  </a>
                                )}
                              </div>
                            </div>
                            <a href={`mailto:${member.email}`} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors bg-white hover:bg-indigo-50 border border-transparent hover:border-indigo-100">
                              <Mail size={14} />
                            </a>
                          </div>
                        ))}
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
        {supervisedTeams.length > 0 && (
          <div className="mb-10 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Bell size={18} />
              </span>
              Team Leave Requests
            </h2>
            
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {teamLeaves.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic">No leave requests found for your team.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {teamLeaves.map(leave => (
                    <div key={leave.id} className="p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{leave.employeeName || leave.userId}</h4>
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                            leave.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            leave.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-semibold text-gray-700">{leave.leaveType}</span>: {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} 
                          <span className="text-gray-500 ml-2 font-medium">({leave.totalDays} days total)</span>
                        </p>
                        
                        {(leave.leaveType === 'Annual Leave' || leave.leaveType === 'Leave') && (
                          <div className="flex gap-4 mt-2 text-xs">
                            <div className="bg-gray-100 px-2 py-1 rounded">AL Used: <span className="font-semibold">{leave.annualLeaveDays || (leave.totalDays - (leave.lopDays || 0))}</span></div>
                            <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded">LOP Days: <span className="font-semibold">{leave.lopDays || 0}</span></div>
                            <div className={`px-2 py-1 rounded ${leave.isLOP ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                              Salary Impact: <span className="font-semibold">{leave.isLOP ? 'Applicable' : 'No'}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-gray-500 mt-2 italic">"{leave.reason}"</p>
                      </div>
                      
                      {leave.status === 'Pending' && (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="danger-soft"
                            onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                            disabled={actionLoading === leave.id}
                          >
                            Reject
                          </Button>
                          <Button 
                            variant="success"
                            onClick={() => handleLeaveAction(leave.id, 'Approved')}
                            disabled={actionLoading === leave.id}
                            isLoading={actionLoading === leave.id}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
              <div className="md:col-span-2 bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Team Supervisor</h3>
                </div>
                <div className="p-6 flex items-center">
                  {memberTeam.supervisor ? (
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold text-xl shadow-sm border border-emerald-200">
                        {memberTeam.supervisor.name ? memberTeam.supervisor.name.charAt(0).toUpperCase() : 'S'}
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
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-sm border ${
                            isCurrentUser 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-700' 
                              : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border-blue-200/50'
                          }`}>
                            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {member.name} {isCurrentUser && <span className="text-xs text-blue-600 font-normal ml-1 border border-blue-200 bg-blue-100 px-1.5 py-0.5 rounded-md">(You)</span>}
                            </p>
                            <div className="flex flex-col mt-0.5">
                              <p className="text-xs text-gray-500 font-mono truncate">ID: {member.employeeNumber || member.userId}</p>
                              {member.email && (
                                <a href={`mailto:${member.email}`} className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline truncate mt-0.5">
                                  {member.email}
                                </a>
                              )}
                            </div>
                          </div>
                          <a href={`mailto:${member.email}`} className={`p-1.5 rounded-lg transition-colors border ${
                            isCurrentUser
                              ? 'text-blue-500 bg-white border-blue-100 hover:bg-blue-50'
                              : 'text-gray-400 bg-white border-transparent hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50'
                          }`}>
                            <Mail size={14} />
                          </a>
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
    </div>
  );
};

export default MyTeam;
