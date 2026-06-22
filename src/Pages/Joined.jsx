// src/Pages/Joined.jsx
import React, { useState, useEffect } from "react";
// Option 1: If Header.jsx exists in src/components/
import Header from "../components/Header";// import bgImage from "../assets/Images/back.png";
import axios from "axios";
import * as XLSX from 'xlsx';
import {
  Search,
  Users,
  Eye,
  FileText,
  X,
  Briefcase,
  Building2,
  User,
  Download,
  Loader,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Phone,
  Mail,
  Award,
  Clock,
  DollarSign,
  CalendarDays,
  Globe,
  Code,
  UserCircle,
  FileCheck,
  MessageCircle,
  XCircle
} from "lucide-react";

// Convert Google Drive view/share links to embeddable preview links
const getEmbeddableUrl = (url) => {
  if (!url) return url;
  
  if (url.includes('drive.google.com')) {
    let fileId = null;
    
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) fileId = fileMatch[1];
    
    if (!fileId) {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) fileId = idMatch[1];
    }
    
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  return url;
};

const Joined = () => {
  const [joinedCandidates, setJoinedCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDemands, setSelectedDemands] = useState({});
  

  // Parse key skills (same as Recruiter)
  const parseKeySkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) {
      return skills.filter(s => s && s.trim());
    }
    if (typeof skills === 'string') {
      try {
        const parsed = JSON.parse(skills);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => s && s.trim());
        }
        if (typeof parsed === 'string') {
          return [parsed.trim()];
        }
      } catch (e) {
        if (skills.includes(',')) {
          return skills.split(',').map(s => s.trim()).filter(s => s);
        }
      }
      const trimmed = skills.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  };

  // Process candidate (same as Recruiter)
  const processCandidate = (candidate) => {
    if (!candidate) return null;

    let actualCanId = candidate.Can_ID || candidate.canId;
    
    if (actualCanId && typeof actualCanId === 'number') {
      actualCanId = Math.floor(actualCanId);
    } else if (actualCanId && typeof actualCanId === 'string') {
      actualCanId = parseInt(actualCanId);
    }

    // Get skills
    const getSkills = () => {
      const skillsSource = candidate['Key Skills'] ||
        candidate.keySkills ||
        candidate.skills ||
        [];
      
      if (Array.isArray(skillsSource)) {
        return skillsSource.filter(s => s && s.trim());
      }
      
      if (typeof skillsSource === 'string') {
        try {
          const parsed = JSON.parse(skillsSource);
          if (Array.isArray(parsed)) {
            return parsed.filter(s => s && s.trim());
          }
          if (typeof parsed === 'string') {
            return parsed.split(',').map(s => s.trim()).filter(s => s);
          }
        } catch (e) {
          if (skillsSource.includes(',')) {
            return skillsSource.split(',').map(s => s.trim()).filter(s => s);
          }
        }
        const trimmed = skillsSource.trim();
        return trimmed ? [trimmed] : [];
      }
      
      return [];
    };

    const processed = {
      id: actualCanId,
      canId: actualCanId,
      name: candidate['Candidate Name'] || candidate.name || '',
      email: candidate.Email || candidate.email || '',
      mobile: candidate['Mobile No'] || candidate.mobile || '',
      experience: candidate.Experience || candidate.experience || '',
      currentOrg: candidate['Current Org'] || candidate.currentOrg || '',
      currentCTC: candidate['Current CTC'] || candidate.currentCTC || '',
      expectedCTC: candidate['Expected CTC'] || candidate.expectedCTC || '',
      noticePeriod: candidate['Notice Period in days'] || candidate.noticePeriod || '',
      profileSourcedBy: candidate['Profiles sourced by'] || candidate.profileSourcedBy || '',
      clientName: candidate['Client Name'] || candidate.clientName || '',
      profileSubmissionDate: candidate['Profile submission date'] || candidate.profileSubmissionDate || '',
      visaType: candidate['Visa type'] || candidate.visaType || 'NA',
      visaValidityDate: candidate['Visa Validity Date'] || candidate.visaValidityDate || '',
      resumePath: candidate.resumePath || '',
      googleDriveViewLink: candidate.googleDriveViewLink || '',
      keySkills: getSkills(),
      joinedDemand: selectedDemands[actualCanId] || 'N/A'
    };

    processed.experienceNum = parseFloat(processed.experience) || 0;
    return processed;
  };

  // Get border color for visa type
  const getVisaBorderColor = (visaType) => {
    if (!visaType || visaType === "NA") return "border-gray-200";
    if (visaType.toUpperCase() === "CHINA") {
      return "border-blue-500 border-2";
    }
    return "border-red-500 border-2";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Only change the fetchJoinedCandidates function
const fetchJoinedCandidates = async () => {
  try {
    setLoading(true);
    setError(null);

    // Single API call to get all joined candidates directly
    const response = await axios.get("http://localhost:5000/api/candidates/joined/all");
    
    if (response.data.success) {
      const joined = response.data.data.map(candidate => ({
        id: candidate.id,
        canId: candidate.canId,
        name: candidate.name,
        email: candidate.email,
        mobile: candidate.mobile,
        experience: candidate.experience,
        currentOrg: candidate.currentOrg,
        currentCTC: candidate.currentCTC,
        expectedCTC: candidate.expectedCTC,
        noticePeriod: candidate.noticePeriod,
        profileSourcedBy: candidate.profileSourcedBy,
        clientName: candidate.clientName,
        profileSubmissionDate: candidate.profileSubmissionDate,
        visaType: candidate.visaType,
        visaValidityDate: candidate.visaValidityDate,
        resumePath: candidate.resumePath,
        googleDriveViewLink: candidate.googleDriveViewLink,
        keySkills: parseKeySkills(candidate.keySkills),
        joinedDemand: candidate.joinedDemandRrNumber,
        joinedAt: candidate.joinedAt
      }));
      
      setJoinedCandidates(joined);
      setFilteredCandidates(joined);
      
      console.log(`✅ Found ${joined.length} joined candidates`);
    }
  } catch (err) {
    console.error("Error fetching joined candidates:", err);
    setError("Failed to load joined candidates. Please try again.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchJoinedCandidates();
  }, []);

  // Filter candidates by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(joinedCandidates);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = joinedCandidates.filter(candidate => 
        candidate.name?.toLowerCase().includes(searchLower) ||
        candidate.email?.toLowerCase().includes(searchLower) ||
        candidate.mobile?.includes(searchLower) ||
        candidate.clientName?.toLowerCase().includes(searchLower) ||
        candidate.currentOrg?.toLowerCase().includes(searchLower) ||
        (candidate.keySkills && candidate.keySkills.some(skill => skill.toLowerCase().includes(searchLower)))
      );
      setFilteredCandidates(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, joinedCandidates]);

  // Handle view details
  const handleViewDetails = (candidate, e) => {
    if (e) e.stopPropagation();
    setSelectedCandidate(candidate);
    setShowDetailsModal(true);
  };

  // Handle view resume
  const handleViewResume = (candidate, e) => {
    e.stopPropagation();
    
    if (candidate.googleDriveViewLink) {
      setSelectedResumeUrl(candidate.googleDriveViewLink);
      setShowResumeModal(true);
    } else if (candidate.resumePath) {
      const resumeUrl = candidate.resumePath.startsWith('http') 
        ? candidate.resumePath 
        : `http://localhost:5000${candidate.resumePath}`;
      setSelectedResumeUrl(resumeUrl);
      setShowResumeModal(true);
    } else {
      alert('No resume available for this candidate');
    }
  };

  // Handle send email
  const handleSendEmail = (email, e) => {
    e.stopPropagation();
    if (!email) return;
    const outlookComposeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
    window.open(outlookComposeUrl, '_blank');
  };

  // Handle send WhatsApp
  const handleSendWhatsApp = (mobile, e) => {
    e.stopPropagation();
    if (!mobile) return;
    const message = "Hello, I came across your profile and wanted to discuss a job opportunity.";
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setLoading(true);

      const response = await axios.get('http://localhost:5000/api/candidates/joined/all');

      if (!response.data.success) {
        alert("Failed to fetch candidates");
        return;
      }

      const allJoinedCandidates = response.data.data;

      if (allJoinedCandidates.length === 0) {
        alert("No data to export");
        return;
      }

      const excelData = allJoinedCandidates.map((candidate, index) => {
        let skillsString = '';
        if (Array.isArray(candidate.keySkills)) {
          skillsString = candidate.keySkills.join('; ');
        } else if (typeof candidate.keySkills === 'string') {
          try {
            const parsed = JSON.parse(candidate.keySkills);
            skillsString = Array.isArray(parsed) ? parsed.join('; ') : parsed;
          } catch {
            skillsString = candidate.keySkills;
          }
        }

        const formatDate = (dateValue) => {
          if (!dateValue) return '';
          try {
            const date = new Date(dateValue);
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch {
            return dateValue;
          }
        };

        return {
          'S.No': index + 1,
          'Can_ID': candidate.canId || candidate.id || '',
          'Candidate Name': candidate.name || '',
          'ID': candidate.id || candidate.canId || '',
          'Email': candidate.email || '',
          'Mobile No': candidate.mobile || '',
          'Experience': candidate.experience || '',
          'Current Org': candidate.currentOrg || '',
          'Current CTC': candidate.currentCTC || '',
          'Expected CTC': candidate.expectedCTC || '',
          'Notice Period in days': candidate.noticePeriod || '',
          'Profiles sourced by': candidate.profileSourcedBy || '',
          'Client Name': candidate.clientName || '',
          'Demand RR No': candidate.joinedDemandRrNumber || candidate.joinedDemand || '',
          'Profile submission date': candidate.profileSubmissionDate || '',
          'Visa type': candidate.visaType || 'NA',
          'Visa Validity Date': candidate.visaValidityDate || '',
          'Key Skills': skillsString,
          'Joined At': formatDate(candidate.joinedAt),
          'createdAt': formatDate(candidate.createdAt),
          'updatedAt': formatDate(candidate.updatedAt)
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      worksheet['!cols'] = [
        { wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 10 },
        { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 25 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
        { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Joined Candidates");
      const filename = `Joined_Candidates_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      setSuccessMessage(`✅ Exported ${allJoinedCandidates.length} joined candidates to Excel`);
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      console.error('Error exporting candidates:', err);
      setError('Failed to export candidates: ' + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);

  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" >
        <div className="min-h-screen bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading joined candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" >
        <div className="min-h-screen bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" >
      <div className="min-h-screen bg-white/50 backdrop-blur-sm">
        <Header />

        <div className="p-6 max-w-[95%] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 bg-white shadow-md rounded-2xl p-4">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <CheckCircle className="text-green-600" size={28} />
                Joined Candidates
              </h2>
              <p className="text-gray-500">
                {filteredCandidates.length} candidates successfully hired
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
              >
                <Download size={18} />
                Export
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border-2 border-blue-500 rounded-xl w-64 
                    focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Joined Candidates</h3>
                <p className="text-sm text-gray-500">
                  {filteredCandidates.length > 0 ? (
                    `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, filteredCandidates.length)} of ${filteredCandidates.length} joined candidates`
                  ) : (
                    "No joined candidates found"
                  )}
                  {searchTerm && ` (filtered by "${searchTerm}")`}
                </p>
              </div>
            </div>
          </div>

          {/* Candidates Grid - Same design as Recruiter */}
          <div className="bg-white rounded-2xl shadow-xl p-4">
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No joined candidates found
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? "Try a different search term." : "Candidates marked as 'Joined' will appear here."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {currentItems.map(candidate => (
                    <div
                      key={`joined-card-${candidate.id}`}
                      className={`border rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer ${getVisaBorderColor(candidate.visaType)}`}
                      onClick={(e) => handleViewDetails(candidate, e)}
                    >
                      {/* Candidate Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate hover:text-blue-600">{candidate.name}</h4>
                          <p className="text-gray-600 text-sm truncate">{candidate.currentOrg}</p>
                        </div>

                        {/* Visa Type Badge */}
                        {candidate.visaType && candidate.visaType !== "NA" && (
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                            candidate.visaType === "China" || candidate.visaType === "CHINA"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {candidate.visaType}
                          </span>
                        )}

                        {/* Joined Badge */}
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle size={12} />
                          Joined
                        </span>
                      </div>

                      {/* Candidate Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-500 flex-shrink-0" />
                          <span>{candidate.mobile}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase size={14} className="text-gray-500 flex-shrink-0" />
                          <span>Exp: {candidate.experience} years</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 size={14} className="text-gray-500 flex-shrink-0" />
                          <span>Client: {candidate.clientName || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Award size={14} className="text-gray-500 flex-shrink-0" />
                          <span>Demand RR: {candidate.joinedDemand || "N/A"}</span>
                        </div>
                      </div>

                      {/* Key Skills */}
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Key Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {candidate.keySkills && candidate.keySkills.length > 0 ? (
                            candidate.keySkills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {skill.replace(/["'\[\]]/g, '').trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 italic">No skills listed</span>
                          )}
                          {candidate.keySkills && candidate.keySkills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{candidate.keySkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - Same as Recruiter */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleSendEmail(candidate.email, e)}
                          className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          title="Send Email"
                        >
                          <Mail size={14} />
                          Email
                        </button>
                        <button
                          onClick={(e) => handleSendWhatsApp(candidate.mobile, e)}
                          className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          title="Send WhatsApp"
                        >
                          <MessageCircle size={14} />
                          WhatsApp
                        </button>
                        <button
                          onClick={(e) => handleViewResume(candidate, e)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                            candidate.resumePath || candidate.googleDriveViewLink
                              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          title={candidate.resumePath || candidate.googleDriveViewLink ? "View Resume" : "No Resume Available"}
                          disabled={!candidate.resumePath && !candidate.googleDriveViewLink}
                        >
                          <FileText size={14} />
                          Resume
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <ChevronLeft size={18} />
                        Previous
                      </button>
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Next
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Candidate Details Modal - Same as Recruiter */}
        {showDetailsModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">Candidate Profile</h3>
                    <p className="text-gray-500 text-sm">Complete details of {selectedCandidate.name}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <UserCircle size={18} />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="font-medium">{selectedCandidate.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{selectedCandidate.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Mobile</p>
                        <p className="font-medium">{selectedCandidate.mobile}</p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="bg-green-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <Briefcase size={18} />
                      Professional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Current Organization</p>
                        <p className="font-medium">{selectedCandidate.currentOrg || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="font-medium">{selectedCandidate.experience || "N/A"} years</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Current CTC</p>
                        <p className="font-medium">{selectedCandidate.currentCTC || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expected CTC</p>
                        <p className="font-medium">{selectedCandidate.expectedCTC || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Notice Period</p>
                        <p className="font-medium">{selectedCandidate.noticePeriod || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Visa Type</p>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium mt-1 ${
                          selectedCandidate.visaType === "China" || selectedCandidate.visaType === "CHINA"
                            ? "bg-blue-100 text-blue-800"
                            : selectedCandidate.visaType === "NA"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                        }`}>
                          {selectedCandidate.visaType || "NA"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Visa Validity Date</p>
                        <p className="font-medium">
                          {selectedCandidate.visaValidityDate ? formatDate(selectedCandidate.visaValidityDate) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Demand Information */}
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <Building2 size={18} />
                      Demand Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Client Name</p>
                        <p className="font-medium">{selectedCandidate.clientName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Demand RR Number</p>
                        <p className="font-medium">{selectedCandidate.joinedDemand || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sourcing Information */}
                  <div className="bg-yellow-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                      <FileCheck size={18} />
                      Sourcing Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Profile Sourced By</p>
                        <p className="font-medium">{selectedCandidate.profileSourcedBy || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Profile Submission Date</p>
                        <p className="font-medium">{formatDate(selectedCandidate.profileSubmissionDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Skills */}
                  {selectedCandidate.keySkills && selectedCandidate.keySkills.length > 0 && (
                    <div className="bg-indigo-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                        <Code size={18} />
                        Key Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.keySkills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">
                            {skill.replace(/["'\[\]]/g, '').trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume Button */}
                  {(selectedCandidate.resumePath || selectedCandidate.googleDriveViewLink) && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleViewResume(selectedCandidate, { stopPropagation: () => {} })}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                      >
                        <FileText size={16} />
                        View Resume
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resume Modal */}
        {showResumeModal && selectedResumeUrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh]">
              <div className="p-4 flex justify-between items-center border-b">
                <h3 className="text-xl font-bold">Resume Viewer</h3>
                <button
                  onClick={() => {
                    setShowResumeModal(false);
                    setSelectedResumeUrl(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="h-[calc(80vh-80px)]">
                <iframe
                  src={getEmbeddableUrl(selectedResumeUrl)}
                  className="w-full h-full"
                  title="Resume Viewer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Joined;