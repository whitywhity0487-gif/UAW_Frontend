import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useLocation } from "react-router-dom";
import bgImage from "../assets/Images/back.png";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import {
  Search,
  Mail,
  Phone,
  Briefcase,
  FileText,
  XCircle,
  Plus,
  Loader,
  Users,
  Pencil,
  Building2,
  MessageCircle
} from "lucide-react";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import CandidateCard from "./Recruiter/components/CandidateCard";
import CandidateDetailsModal from "./Recruiter/components/CandidateDetailsModal";
import ResumeModal from "./Recruiter/components/ResumeModal";
import SearchFiltersPopup from "./Recruiter/components/SearchFiltersPopup";
import AddProfileModal from "./Recruiter/components/AddProfileModal";
import EditProfileModal from "./Recruiter/components/EditProfileModal";
import DeleteConfirmModal from "./Recruiter/components/DeleteConfirmModal";
import SkillsSidebar from "./Recruiter/components/SkillsSidebar";
import SelectedCandidatesPanel from "./Recruiter/components/SelectedCandidatesPanel";
import Pagination from "./Recruiter/components/Pagination";
import { parseKeySkills, formatDate, getVisaBorderColor } from "./Recruiter/utils/formatters";
import { processCandidate, filterOutRejectedCandidates } from "./Recruiter/utils/candidateHelpers";

import { useVisaTypes } from "./Recruiter/hooks/useVisaTypes";
import { useCandidateFilters } from "./Recruiter/hooks/useCandidateFilters";
import { useSelectedCandidates } from "./Recruiter/hooks/useSelectedCandidates";
import { useCandidateForm } from "./Recruiter/hooks/useCandidateForm";
import { useSkills } from "./Recruiter/hooks/useSkills";

const Recruiter = ({ user }) => {


  // Add this with other states
  const [candidateInProgress, setCandidateInProgress] = useState({});
  const [searchParams] = useSearchParams(); // Add this hook



  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);
  const [loading, setLoading] = useState(true);


  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [candidateClientStatus, setCandidateClientStatus] = useState({});

  const [joinedCandidateIds, setJoinedCandidateIds] = useState(new Set());
  const navigate = useNavigate();
  // Get user role from props
  const userRole = user?.role || "recruiter";

  // Use custom hook for visa types
  const { visaTypes, visaTypesLoading, fetchVisaTypes } = useVisaTypes();


  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCandidateId, setDeletingCandidateId] = useState(null);
  const [deletingCandidateName, setDeletingCandidateName] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage] = useState(4);

  // State for API data
  const [candidates, setCandidates] = useState([]);
  const [displayedCandidates, setDisplayedCandidates] = useState([]);

  // Use custom hook for skills
  const {
    selectedCandidates, setSelectedCandidates,
    submitLoading, setSubmitLoading,
    showSelectedView, setShowSelectedView,
    selectedViewPage, setSelectedViewPage,
    handleSelectCandidate,
    handleRemoveCandidate,
    handleSubmitSelectedCandidates
  } = useSelectedCandidates(setCandidateInProgress, setSuccessMessage, setError);

  const {
    skills,
    skillCounts,
    totalSkills,
    skillsLoading,
    skillSuggestions,
    newSkillName,
    setNewSkillName,
    showAddSkillInput,
    setShowAddSkillInput,
    fetchSkillsData,
    updateSkillCounts,
    handleAddSkillToDatabase,
    handleDeleteSkill
  } = useSkills(setSuccessMessage, setError);

  const {
    searchTerm, setSearchTerm,
    selectedSkill, setSelectedSkill,
    searchFilters, setSearchFilters,
    showSearchFilters, setShowSearchFilters,
    filterLoading, setFilterLoading,
    showPrimarySuggestions, setShowPrimarySuggestions,
    showSecondarySuggestions, setShowSecondarySuggestions,
    filteredPrimarySuggestions, setFilteredPrimarySuggestions,
    filteredSecondarySuggestions, setFilteredSecondarySuggestions,
    primarySkillInput, setPrimarySkillInput,
    secondarySkillInput, setSecondarySkillInput,
    selectedPrimarySuggestionIndex, setSelectedPrimarySuggestionIndex,
    selectedSecondarySuggestionIndex, setSelectedSecondarySuggestionIndex,
    filterCandidatesBySearch,
    handleClearFilters
  } = useCandidateFilters(candidates, setDisplayedCandidates);

  const {
    showAddProfile, setShowAddProfile,
    newProfile, setNewProfile,
    profileSubmissionDate, setProfileSubmissionDate,
    formErrors, setFormErrors,
    submitLoading: formSubmitLoading,
    handleInputChange, handleAddProfile,
    
    skillInput, setSkillInput,
    showAddSkillSuggestions, setShowAddSkillSuggestions,
    filteredAddSkillSuggestions, setFilteredAddSkillSuggestions,
    selectedAddSkillSuggestionIndex, setSelectedAddSkillSuggestionIndex,
    handleAddSkillInputChange, handleAddSkillKeyDown, handleAddSkillToProfile, handleRemoveSkill,
    handlePdfUpload,

    showEditModal, setShowEditModal,
    editingCandidate, setEditingCandidate,
    editFormData, setEditFormData,
    editProfileSubmissionDate, setEditProfileSubmissionDate,
    editFormErrors, setEditFormErrors,
    editLoading,
    handleEditClick, handleEditInputChange, handleUpdateProfile,

    editSkillInput, setEditSkillInput,
    showEditSkillSuggestions, setShowEditSkillSuggestions,
    filteredEditSkillSuggestions, setFilteredEditSkillSuggestions,
    selectedEditSkillSuggestionIndex, setSelectedEditSkillSuggestionIndex,
    handleEditSkillInputChange, handleEditSkillKeyDown, handleEditSkillAdd, handleEditSkillRemove,
    handleEditPdfUpload,
    pdfFile, setPdfFile, editPdfFile, setEditPdfFile
  } = useCandidateForm(() => fetchAllCandidates(), setSuccessMessage, skillSuggestions);

  // Function to fetch candidate's status for current client
  const fetchCandidateStatusForClient = async (candidateId, clientName) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/candidates/${candidateId}/status-for-client/${encodeURIComponent(clientName)}`
      );
      return response.data.data;
    } catch (err) {
      console.error(`Error fetching status for candidate ${candidateId} client ${clientName}:`, err);
      return null;
    }
  };

  // Fetch candidate IDs to exclude them (Joined, Pending Offer, Pending Joinee, Offer Decline)
  const fetchJoinedCandidateIds = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/candidates/hidden-ids');
      if (response.data.success) {
        // response.data.data is already an array of IDs
        const ids = new Set(response.data.data);
        setJoinedCandidateIds(ids);
        return ids;
      }
    } catch (err) {
      console.error('Error fetching hidden candidate IDs:', err);
    }
    return new Set();
  };
  const processCandidate = (candidate) => {
    if (!candidate) return null;

    let actualCanId = candidate.Can_ID || candidate.canId;

    if (actualCanId && typeof actualCanId === 'number') {
      actualCanId = Math.floor(actualCanId);
    } else if (actualCanId && typeof actualCanId === 'string') {
      actualCanId = parseInt(actualCanId);
    }

    const getSkills = (source = null) => {
      const skillsSource = source || candidate['Key Skills'] ||
        candidate.keySkills ||
        candidate.skills ||
        candidate['key_skills'] ||
        [];

      if (Array.isArray(skillsSource)) {
        return skillsSource.filter(s => s && typeof s === 'string' && s.trim());
      }

      if (typeof skillsSource === 'string') {
        try {
          const parsed = JSON.parse(skillsSource);
          if (Array.isArray(parsed)) {
            return parsed.filter(s => s && typeof s === 'string' && s.trim());
          }
          if (typeof parsed === 'string') {
            return parsed.split(',').map(s => s.trim()).filter(s => s);
          }
        } catch (e) {
          return skillsSource.split(',').map(s => s.trim()).filter(s => s);
        }
      }

      if (typeof skillsSource === 'object' && skillsSource !== null) {
        if (skillsSource.low !== undefined || Array.isArray(skillsSource)) {
          return Object.values(skillsSource).filter(s => s && typeof s === 'string' && s.trim());
        }
        if (Object.keys(skillsSource).length > 0) {
          if (skillsSource.skills) {
            return getSkills(skillsSource.skills);
          }
          return Object.values(skillsSource).filter(s => s && typeof s === 'string');
        }
      }

      return [];
    };

    const keySkills = getSkills();

    const numericId = actualCanId ? Number(actualCanId) : null;

    const processed = {
      canId: numericId,
      actualId: numericId,
      id: numericId,  // This will be an integer now
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
      googleDriveFileId: candidate.googleDriveFileId || '',
      googleDriveViewLink: candidate.googleDriveViewLink || '',
      googleDriveDownloadLink: candidate.googleDriveDownloadLink || '',
      keySkills: keySkills,
      isInProgress: candidate.isInProgress === true || candidate.isInProgress === 'true' || false
    };

    processed.experienceNum = parseFloat(processed.experience) || 0;

    return processed;
  };


  // Export to Excel function
  const exportToExcel = async () => {
    try {
      setLoading(true);

      const response = await axios.get('http://localhost:5000/api/candidates/all');

      if (!response.data.success) {
        alert("Failed to fetch candidates");
        return;
      }

      const allCandidates = response.data.data;

      if (allCandidates.length === 0) {
        alert("No data to export");
        return;
      }

      const excelData = allCandidates.map(candidate => {
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

        const isInProgress = candidate.isInProgress === true;

        return {
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
          'Profile submission date': candidate.profileSubmissionDate || '',
          'Visa type': candidate.visaType || 'NA',
          'Visa Validity Date': candidate.visaValidityDate || '',
          'Key Skills': skillsString,
          'googleDriveFileId': candidate.googleDriveFileId || '',
          'googleDriveViewLink': candidate.googleDriveViewLink || '',
          'googleDriveDownloadLink': candidate.googleDriveDownloadLink || '',
          'resumePath': candidate.resumePath || '',
          'createdAt': formatDate(candidate.createdAt),
          'updatedAt': formatDate(candidate.updatedAt),
          'lastStatusUpdate': formatDate(candidate.lastStatusUpdate),
          'isInProgress': isInProgress ? 'true' : 'false'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      worksheet['!cols'] = [
        { wch: 10 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 10 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 12 },
        { wch: 18 },
        { wch: 40 },
        { wch: 30 },
        { wch: 40 },
        { wch: 40 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 }
      ];

      const workbook = XLSX.utils.book_new();
      const sheetName = 'All Candidates';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `all_candidates_${date}.xlsx`;

      XLSX.writeFile(workbook, filename);

      setSuccessMessage(`✅ Exported ${allCandidates.length} candidates to Excel`);
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      console.error('Error exporting candidates:', err);
      setError('Failed to export candidates: ' + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };












  const location = useLocation();

  useEffect(() => {
    const applyFiltersFromUrl = async () => {
      const params = new URLSearchParams(location.search);

      if (params.get('autoFilter') === 'true') {
        const primarySkills = params.get('primarySkills')?.split(',').filter(s => s) || [];
        const secondarySkills = params.get('secondarySkills')?.split(',').filter(s => s) || [];
        const minExperience = params.get('minExperience');
        const maxExperience = params.get('maxExperience');

        setSearchFilters({
          primarySkills: primarySkills,
          secondarySkills: secondarySkills,
          experienceMin: minExperience || "",
          experienceMax: maxExperience || "",
          location: ""
        });

        setPrimarySkillInput(primarySkills.join(', '));
        setSecondarySkillInput(secondarySkills.join(', '));

        try {
          setFilterLoading(true);

          const apiParams = new URLSearchParams();

          if (primarySkills.length > 0) {
            apiParams.append('primarySkills', primarySkills.join(','));
          }

          if (secondarySkills.length > 0) {
            apiParams.append('secondarySkills', secondarySkills.join(','));
          }

          if (minExperience) {
            apiParams.append('minExperience', minExperience);
          }

          if (maxExperience) {
            apiParams.append('maxExperience', maxExperience);
          }

          // console.log("Auto-applying filters from demand:", apiParams.toString());

          const response = await axios.get(`http://localhost:5000/api/shortcandidates/filter?${apiParams.toString()}`);

          if (response.data.success) {
            const processedCandidates = response.data.data
              .map(processCandidate)
              .filter(c => c !== null);

            const filteredCandidates = filterOutRejectedCandidates(processedCandidates);

            setDisplayedCandidates(filteredCandidates);
            setCurrentPage(1);
            setSelectedSkill("All");
            setSearchTerm("");
          }
        } catch (err) {
          console.error('Error auto-applying filters:', err);
          setError(err.message || "Failed to filter candidates");
        } finally {
          setFilterLoading(false);
        }
      }
    };

    if (candidates.length > 0) {
      applyFiltersFromUrl();
    }
  }, [location.search, candidates.length]);

  useEffect(() => {
    const autoFilterFromDemand = async () => {
      if (searchParams.get('autoFilter') === 'true') {
        const primarySkills = searchParams.get('primarySkills')?.split(',').filter(s => s) || [];
        const secondarySkills = searchParams.get('secondarySkills')?.split(',').filter(s => s) || [];
        const minExperience = searchParams.get('minExperience');
        const maxExperience = searchParams.get('maxExperience');
        const demandId = searchParams.get('demandId');
        const clientName = searchParams.get('clientName');

        // console.log(`🔍 Auto-filtering for demand ID: ${demandId}`);

        setSearchFilters({
          primarySkills: primarySkills,
          secondarySkills: secondarySkills,
          experienceMin: minExperience || "",
          experienceMax: maxExperience || "",
          location: ""
        });

        setPrimarySkillInput(primarySkills.join(', '));
        setSecondarySkillInput(secondarySkills.join(', '));

        try {
          setFilterLoading(true);

          const params = new URLSearchParams();

          if (primarySkills.length > 0) {
            params.append('primarySkills', primarySkills.join(','));
          }

          if (secondarySkills.length > 0) {
            params.append('secondarySkills', secondarySkills.join(','));
          }

          if (minExperience) {
            params.append('minExperience', minExperience);
          }

          if (maxExperience) {
            params.append('maxExperience', maxExperience);
          }

          if (clientName) {
            params.append('clientName', clientName);
            // console.log(`🚫 Filtering out candidates in Zone for client: ${clientName}`);
          }

          // console.log("Calling filter API with:", params.toString());

          const response = await axios.get(`http://localhost:5000/api/shortcandidates/filter?${params.toString()}`);

          if (response.data.success) {
            // console.log(`✅ API response: Excluded ${response.data.excludedZoneCount || 0} candidates from Zone`);

            let processedCandidates = response.data.data
              .map(processCandidate)
              .filter(c => c !== null);

            processedCandidates = filterOutRejectedCandidates(processedCandidates);

            // console.log(`✅ Found ${processedCandidates.length} candidates matching demand requirements (after removing rejections)`);
            const filteredCandidates = filterOutRejectedCandidates(processedCandidates);

            setDisplayedCandidates(filteredCandidates);
            setCurrentPage(1);
            setSelectedSkill("All");
            setSearchTerm("");

            const candidateIds = processedCandidates.map(c => c.id).filter(id => id);
            if (candidateIds.length > 0) {
              const progressResponse = await axios.post('http://localhost:5000/api/candidates/progress/batch', {
                candidateIds: candidateIds,
                demandId: demandId
              });
              if (progressResponse.data.success) {
                const progressMap = {};
                progressResponse.data.data.forEach(item => {
                  progressMap[item.candidateId] = item.isInProgress;
                });
                setCandidateInProgress(progressMap);
              }
            }

            if (response.data.excludedZoneCount > 0) {
              setSuccessMessage(`Found ${processedCandidates.length} candidates (${response.data.excludedZoneCount} excluded from Zone)`);
              setTimeout(() => setSuccessMessage(""), 3000);
            } else {
              setSuccessMessage(`Found ${processedCandidates.length} candidates matching this demand`);
              setTimeout(() => setSuccessMessage(""), 3000);
            }
          }
        } catch (err) {
          console.error('❌ Error auto-applying filters:', err);
          setError("Failed to filter candidates for this demand");
        } finally {
          setFilterLoading(false);
        }
      }
    };
    if (candidates.length > 0) {
      autoFilterFromDemand();
    }
  }, [searchParams, candidates.length]);

  const fetchAllCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      const joinedIds = await fetchJoinedCandidateIds();

      const response = await axios.get('http://localhost:5000/api/candidates/all');

      if (response.data.success) {
        let processedCandidates = response.data.data
          .map(processCandidate)
          .filter(c => c !== null);

        const activeCandidates = processedCandidates.filter(
          candidate => !joinedIds.has(candidate.id)
        );

        activeCandidates.sort((a, b) => {
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idB - idA;
        });


        setCandidates(activeCandidates);

        const filteredCandidates = filterOutRejectedCandidates(activeCandidates);
        setDisplayedCandidates(filteredCandidates);
        setCurrentPage(1);

        const initialProgressMap = {};
        activeCandidates.forEach(candidate => {
          if (candidate.isInProgress === true) {
            initialProgressMap[candidate.id] = true;
          }
        });
        setCandidateInProgress(initialProgressMap);

        if (skills.length > 0) {
          updateSkillCounts(activeCandidates);
        }
      } else {
        setError("Failed to fetch candidates: " + (response.data.message || "Unknown error"));
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email, excludeId = null) => {
    try {
      const url = `http://localhost:5000/api/candidates/check-email/${encodeURIComponent(email)}${excludeId ? `?excludeId=${excludeId}` : ''}`;
      const response = await axios.get(url);
      return response.data.exists;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  };

  const checkMobileExists = async (mobile, excludeId = null) => {
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const url = `http://localhost:5000/api/candidates/check-mobile/${encodeURIComponent(cleanMobile)}${excludeId ? `?excludeId=${excludeId}` : ''}`;
      const response = await axios.get(url);
      return response.data.exists;
    } catch (err) {
      console.error('Error checking mobile:', err);
      return false;
    }
  };

  const handleViewDetails = (candidate, e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log("Viewing candidate:", candidate);
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  const handleViewResume = (candidate, e) => {
    e.stopPropagation();

    console.log("Viewing resume for candidate:", candidate);

    if (candidate.googleDriveViewLink) {
      console.log("Opening Google Drive resume:", candidate.googleDriveViewLink);
      setSelectedResumeUrl(candidate.googleDriveViewLink);
      setShowResumeModal(true);
    }
    else if (candidate.resumePath) {
      const resumeUrl = candidate.resumePath.startsWith('http')
        ? candidate.resumePath
        : `http://localhost:5000${candidate.resumePath}`;

      console.log("Opening local resume:", resumeUrl);
      setSelectedResumeUrl(resumeUrl);
      setShowResumeModal(true);
    }
    else {
      alert('No resume uploaded for this candidate');
    }
  };



  const handleDeleteClick = (candidate, e) => {
    e.stopPropagation();
    if (!candidate || !candidate.id) {
      console.error("Invalid candidate for deletion:", candidate);
      alert("Cannot delete: Invalid candidate data");
      return;
    }
    setDeletingCandidateId(candidate.id);
    setDeletingCandidateName(candidate.name);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCandidateId) {
      console.error("No candidate ID for deletion");
      alert("Cannot delete: No candidate selected");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await axios.delete(`http://localhost:5000/api/candidates/${deletingCandidateId}`);

      if (response.data.success) {
        setSuccessMessage("Profile deleted successfully!");

        await fetchAllCandidates();

        setSelectedCandidates(prev => prev.filter(c => c.id !== deletingCandidateId));

        setTimeout(() => {
          setShowDeleteConfirm(false);
          setSuccessMessage("");
          setDeletingCandidateId(null);
          setDeletingCandidateName("");
        }, 1000);
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError(err.response?.data?.message || "Failed to delete profile. Please try again.");
      setTimeout(() => {
        setError(null);
        setShowDeleteConfirm(false);
        setDeletingCandidateId(null);
        setDeletingCandidateName("");
      }, 3000);
    } finally {
      setDeleteLoading(false);
    }
  };



  const handleSendEmail = (email, e) => {
    e.stopPropagation();
    if (!email) return;

    const outlookComposeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;

    window.open(outlookComposeUrl, '_blank');
  };

  const handleSendWhatsApp = (mobile, e) => {
    e.stopPropagation();
    if (!mobile) return;
    const message = "Hello, I came across your profile and wanted to discuss a job opportunity.";
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };



  const handleSearchClick = () => {
    setShowSearchPopup(true);
  };

  const handleSearchFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  const applySearchFilters = async () => {
    try {
      setFilterLoading(true);
      setError(null);

      let updatedFilters = { ...searchFilters };

      if (primarySkillInput.trim()) {
        let newPrimarySkills = [];
        if (primarySkillInput.includes(',')) {
          newPrimarySkills = primarySkillInput.split(',').map(s => s.trim()).filter(s => s);
        } else {
          newPrimarySkills = [primarySkillInput.trim()];
        }
        updatedFilters.primarySkills = [...new Set(newPrimarySkills)];
      } else {
        updatedFilters.primarySkills = [];
      }

      if (secondarySkillInput.trim()) {
        let newSecondarySkills = [];
        if (secondarySkillInput.includes(',')) {
          newSecondarySkills = secondarySkillInput.split(',').map(s => s.trim()).filter(s => s);
        } else {
          newSecondarySkills = [secondarySkillInput.trim()];
        }
        updatedFilters.secondarySkills = [...new Set(newSecondarySkills)];
      } else {
        updatedFilters.secondarySkills = [];
      }

      console.log("Applying search with updated filters:", updatedFilters);

      const params = new URLSearchParams();

      if (updatedFilters.primarySkills.length > 0) {
        params.append('primarySkills', updatedFilters.primarySkills.join(','));
      }

      if (updatedFilters.secondarySkills.length > 0) {
        params.append('secondarySkills', updatedFilters.secondarySkills.join(','));
      }

      if (updatedFilters.experienceMin) {
        params.append('minExperience', updatedFilters.experienceMin);
      }

      if (updatedFilters.experienceMax) {
        params.append('maxExperience', updatedFilters.experienceMax);
      }

      console.log("Query params:", params.toString());

      const response = await axios.get(`http://localhost:5000/api/shortcandidates/filter?${params.toString()}`);

      if (response.data.success) {
        let processedCandidates = response.data.data
          .map(processCandidate)
          .filter(c => c !== null);

        processedCandidates = filterOutRejectedCandidates(processedCandidates);

        console.log(`Smart search found ${processedCandidates.length} candidates (after removing rejects)`);
        const filteredCandidates = filterOutRejectedCandidates(processedCandidates);

        setDisplayedCandidates(filteredCandidates);
        setSearchFilters(updatedFilters);
        setCurrentPage(1);
        setShowSearchPopup(false);
        setSelectedSkill("All");
        setSearchTerm("");
      } else {
        setError("Failed to filter candidates: " + (response.data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFilterLoading(false);
    }
  };

  const resetSearchFilters = async () => {
    handleClearFilters();
    setPrimarySkillInput("");
    setSecondarySkillInput("");

    let allCandidates = [...candidates];
    allCandidates = filterOutRejectedCandidates(allCandidates);
    setDisplayedCandidates(allCandidates);

    setCurrentPage(1);
    setShowSearchPopup(false);
    setSelectedSkill("All");
    setSearchTerm("");
    setSelectedCandidates([]);
    setSelectedViewPage(1);
  };

  // Edit search filters - open popup with current filters
  const editSearchFilters = () => {
    setPrimarySkillInput(searchFilters.primarySkills.join(', '));
    setSecondarySkillInput(searchFilters.secondarySkills.join(', '));
    setShowSearchPopup(true);
  };

  // Toggle selected view
  const toggleSelectedView = () => {
    setShowSelectedView(!showSelectedView);
    setSelectedViewPage(1);
  };

  // Format date for display
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

  // Helper function to check if status is active (should be shown in recruiter)
 

  // Auto-set profile submission date to today when Add Profile modal opens
  useEffect(() => {
    if (showAddProfile) {
      const today = new Date();
      setProfileSubmissionDate(today);
    } else {
      setProfileSubmissionDate(null);
    }
  }, [showAddProfile]);
  // Add this useEffect in Demand.jsx to check for selected candidate
  useEffect(() => {
    const selectedCandidateData = sessionStorage.getItem('selectedCandidate');
    if (selectedCandidateData) {
      const candidate = JSON.parse(selectedCandidateData);
      console.log("Selected candidate from recruiter:", candidate);
      // You can show a message or pre-fill a form here
      setSuccessMessage(`Candidate ${candidate.name} selected. Please create a demand for them.`);
      // Clear the stored data after use
      sessionStorage.removeItem('selectedCandidate');

      // Optional: Auto-open create demand form
      // setShowCreateDemand(true);
      // setCreateFormData(prev => ({ ...prev, candidateInfo: candidate }));
    }
  }, []);

  // ============================================
  // FETCH EXISTING SELECTIONS FUNCTION (MOVED OUTSIDE)
  // ============================================
  const fetchExistingSelections = async () => {
    const demandId = searchParams.get('demandId');
    if (demandId && candidates.length > 0) {
      try {
        const response = await axios.get(`http://localhost:5000/api/selected-candidates/${demandId}`);
        if (response.data.success) {
          const existingCandidates = response.data.data
            .map(selected => {
              const matchingCandidate = candidates.find(c => c.id === selected.id);
              return {
                ...matchingCandidate,
                status: selected.status,
                history: selected.history
              };
            })
            .filter(c => c !== undefined);
          setSelectedCandidates(existingCandidates);
          // console.log("Loaded selected candidates with statuses:", existingCandidates.map(c => ({ name: c.name, status: c.status })));
        }
      } catch (err) {
        console.error('Error fetching existing selections:', err);
      }
    }
  };

  // Load existing selections when component mounts or dependencies change
  useEffect(() => {
    fetchExistingSelections();
  }, [searchParams, candidates]);

  // Refresh selections when window gets focus (user returns to tab)
  useEffect(() => {
    const refreshSelections = () => {
      const demandId = searchParams.get('demandId');
      if (demandId && candidates.length > 0) {
        fetchExistingSelections();
      }
    };

    window.addEventListener('focus', refreshSelections);

    return () => {
      window.removeEventListener('focus', refreshSelections);
    };
  }, [searchParams, candidates]);

  // Load data on component mount
  // Load data on component mount
  useEffect(() => {
    fetchAllCandidates();
    fetchSkillsData();
    fetchVisaTypes(); // Add this line
  }, []);

  // Update skill counts whenever candidates change
  useEffect(() => {
    if (skills.length > 0 && candidates.length > 0) {
      updateSkillCounts(candidates);
    }
  }, [candidates, skills]);

  // Get filtered candidates based on search term
  const filteredCandidates = filterCandidatesBySearch(displayedCandidates);

  // Pagination logic for main view
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination logic for selected candidates view
  const selectedTotalPages = Math.ceil(selectedCandidates.length / itemsPerPage);
  const selectedIndexOfLastItem = selectedViewPage * itemsPerPage;
  const selectedIndexOfFirstItem = selectedIndexOfLastItem - itemsPerPage;
  const selectedCurrentItems = selectedCandidates.slice(selectedIndexOfFirstItem, selectedIndexOfLastItem);

  useEffect(() => {
    const fetchAllClientStatuses = async () => {
      const currentClient = searchParams.get('clientName');

      if (!currentClient || currentItems.length === 0) return;

      const statusMap = {};

      for (const candidate of currentItems) {
        if (candidate.id) {
          const status = await fetchCandidateStatusForClient(candidate.id, currentClient);
          if (status && status.isSelected) {
            statusMap[candidate.id] = status;
          }
        }
      }

      setCandidateClientStatus(statusMap);
    };

    fetchAllClientStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItems.map(c => c.id).join(','), searchParams]);

  // Fetch in-progress status for displayed candidates
  // Fetch in-progress status for displayed candidates
  useEffect(() => {
    const fetchInProgressStatuses = async () => {
      // Get all candidate IDs from displayedCandidates
      const candidateIds = displayedCandidates.map(c => c.id).filter(id => id);

      // console.log("🔍 Fetching in-progress for candidates:", candidateIds);

      if (candidateIds.length === 0) return;

      try {
        const response = await axios.post('http://localhost:5000/api/candidates/progress/batch', {
          candidateIds: candidateIds
        });


        if (response.data.success) {
          const progressMap = {};
          response.data.data.forEach(item => {
            progressMap[item.candidateId] = item.isInProgress === true;
          });
          setCandidateInProgress(progressMap);
        }
      } catch (err) {
        console.error('Error fetching in-progress statuses:', err);
        // Fallback: Check each candidate individually
        for (const candidateId of candidateIds) {
          try {
            const singleResponse = await axios.get(`http://localhost:5000/api/candidates/debug/check-progress/${candidateId}`);
            if (singleResponse.data.success) {
              setCandidateInProgress(prev => ({
                ...prev,
                [candidateId]: singleResponse.data.isInProgress
              }));
            }
          } catch (singleErr) {
            // console.error(`Error checking candidate ${candidateId}:`, singleErr);
          }
        }
      }
    };

    if (displayedCandidates.length > 0) {
      fetchInProgressStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedCandidates.map(c => c.id).join(',')]);

  // Skill selection handlers
  const filterCandidatesBySkill = async (skill) => {
    if (skill === "All") {
      let allCandidates = [...candidates];
      allCandidates = filterOutRejectedCandidates(allCandidates);
      setDisplayedCandidates(allCandidates);
      setSelectedSkill("All");
      setCurrentPage(1);
      setSearchTerm("");
      return;
    }

    try {
      setFilterLoading(true);
      setError(null);

      const response = await axios.get(`http://localhost:5000/api/skillsmatch?skill=${encodeURIComponent(skill)}`);

      if (response.data.success) {
        const apiCandidates = response.data.data || [];
        let parsedCandidates = apiCandidates
          .map(candidate => processCandidate(candidate))
          .filter(c => c !== null);

        parsedCandidates = filterOutRejectedCandidates(parsedCandidates);

        parsedCandidates.sort((a, b) => {
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idB - idA;
        });

        setDisplayedCandidates(parsedCandidates);
        setCurrentPage(1);
        setSelectedSkill(skill);
        setSearchTerm("");
      }
    } catch (err) {
      console.error("Error filtering by skill:", err);
      setError("Failed to filter candidates by skill.");
    } finally {
      setFilterLoading(false);
    }
  };

  const handleSkillSelect = (skill) => {
    filterCandidatesBySkill(skill);
  };

  // Pagination handlers
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Selected view pagination handlers
  const goToSelectedPreviousPage = () => setSelectedViewPage(prev => Math.max(prev - 1, 1));
  const goToSelectedNextPage = () => setSelectedViewPage(prev => Math.min(prev + 1, selectedTotalPages));

  // Handle primary skill input
  const handlePrimarySkillInputChange = (e) => {
    const value = e.target.value;
    setPrimarySkillInput(value);
    setSelectedPrimarySuggestionIndex(0);

    const lastPart = value.split(',').pop().trim();

    if (lastPart) {
      const filtered = skillSuggestions.filter(skill =>
        skill.toLowerCase().includes(lastPart.toLowerCase())
      );
      setFilteredPrimarySuggestions(filtered);
      setShowPrimarySuggestions(true);
    } else {
      setFilteredPrimarySuggestions([]);
      setShowPrimarySuggestions(false);
    }
  };

  // Handle secondary skill input
  const handleSecondarySkillInputChange = (e) => {
    const value = e.target.value;
    setSecondarySkillInput(value);
    setSelectedSecondarySuggestionIndex(0);

    const lastPart = value.split(',').pop().trim();

    if (lastPart) {
      const filtered = skillSuggestions.filter(skill =>
        skill.toLowerCase().includes(lastPart.toLowerCase())
      );
      setFilteredSecondarySuggestions(filtered);
      setShowSecondarySuggestions(true);
    } else {
      setFilteredSecondarySuggestions([]);
      setShowSecondarySuggestions(false);
    }
  };

  // Handle primary skill key down for navigation
  const handlePrimarySkillKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedPrimarySuggestionIndex(prev =>
        prev < filteredPrimarySuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedPrimarySuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPrimarySuggestions.length > 0 && selectedPrimarySuggestionIndex >= 0) {
        const indexToUse = selectedPrimarySuggestionIndex >= 0 ? selectedPrimarySuggestionIndex : 0;
        selectPrimarySkill(filteredPrimarySuggestions[indexToUse]);
      } else if (primarySkillInput.trim()) {
        if (primarySkillInput.includes(',')) {
          const skills = primarySkillInput.split(',').map(s => s.trim()).filter(s => s);
          setSearchFilters(prev => ({
            ...prev,
            primarySkills: [...new Set([...prev.primarySkills, ...skills])]
          }));
        } else {
          setSearchFilters(prev => ({
            ...prev,
            primarySkills: [...new Set([...prev.primarySkills, primarySkillInput.trim()])]
          }));
        }
      }
    } else if (e.key === 'Escape') {
      setShowPrimarySuggestions(false);
      setSelectedPrimarySuggestionIndex(0);
    }
  };

  // Handle secondary skill key down for navigation
  const handleSecondarySkillKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSecondarySuggestionIndex(prev =>
        prev < filteredSecondarySuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSecondarySuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSecondarySuggestions.length > 0 && selectedSecondarySuggestionIndex >= 0) {
        const indexToUse = selectedSecondarySuggestionIndex >= 0 ? selectedSecondarySuggestionIndex : 0;
        selectSecondarySkill(filteredSecondarySuggestions[indexToUse]);
      } else if (secondarySkillInput.trim()) {
        if (secondarySkillInput.includes(',')) {
          const skills = secondarySkillInput.split(',').map(s => s.trim()).filter(s => s);
          setSearchFilters(prev => ({
            ...prev,
            secondarySkills: [...new Set([...prev.secondarySkills, ...skills])]
          }));
        } else {
          setSearchFilters(prev => ({
            ...prev,
            secondarySkills: [...new Set([...prev.secondarySkills, secondarySkillInput.trim()])]
          }));
        }
      }
    } else if (e.key === 'Escape') {
      setShowSecondarySuggestions(false);
      setSelectedSecondarySuggestionIndex(0);
    }
  };

  // Handle primary skill selection from suggestions
  const selectPrimarySkill = (skill) => {
    const parts = primarySkillInput.split(',');
    if (parts.length > 1) {
      parts[parts.length - 1] = skill;
      setPrimarySkillInput(parts.join(', '));
    } else {
      setPrimarySkillInput(skill);
    }

    setSearchFilters(prev => ({
      ...prev,
      primarySkills: [...new Set([...prev.primarySkills, skill])]
    }));
    setFilteredPrimarySuggestions([]);
    setShowPrimarySuggestions(false);
    setSelectedPrimarySuggestionIndex(0);
  };

  // Handle secondary skill selection from suggestions
  const selectSecondarySkill = (skill) => {
    const parts = secondarySkillInput.split(',');
    if (parts.length > 1) {
      parts[parts.length - 1] = skill;
      setSecondarySkillInput(parts.join(', '));
    } else {
      setSecondarySkillInput(skill);
    }

    setSearchFilters(prev => ({
      ...prev,
      secondarySkills: [...new Set([...prev.secondarySkills, skill])]
    }));
    setFilteredSecondarySuggestions([]);
    setShowSecondarySuggestions(false);
    setSelectedSecondarySuggestionIndex(0);
  };


  if (loading && candidates.length === 0) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="min-h-screen bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="min-h-screen bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="min-h-screen bg-white/50 backdrop-blur-sm">
        <Header />

        <div className="p-6 max-w-[95%] mx-auto">
          {/* TITLE AND CONTROLS */}
          <div className="flex justify-between mb-6 bg-white shadow-md rounded-2xl p-4">
            <div>
              <h2 className="text-3xl font-bold">Recruiter Dashboard</h2>
              <p className="text-gray-500">
                <span className="font-semibold">{totalSkills}</span> total skills •
                <span className="font-semibold ml-1">{candidates.length}</span> total candidates
              </p>
            </div>

            <div className="flex gap-3 items-center">

              {/* Export Profile button - Only show for Admin */}
              {userRole === 'Admin' && (
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition cursor-pointer"
                  title={showSelectedView ? "Export selected candidates to Excel" : "Export all candidates to Excel"}
                >
                  <FileText size={18} />
                  Export Profile
                </button>
              )}
              <button
                onClick={() => setShowAddProfile(true)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition cursor-pointer"
              >
                <Plus size={18} />
                Add Profile
              </button>



              <div className="relative">
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  onClick={handleSearchClick}
                  className="pl-10 pr-4 py-2 border-2 border-blue-500 rounded-xl w-64 
               focus:border-blue-600 focus:ring-2 focus:ring-blue-200 
               outline-none"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>


          {/* Filter Summary with Edit Button */}
          {(searchFilters.primarySkills.length > 0 || searchFilters.secondarySkills.length > 0 || searchFilters.experienceMin || searchFilters.experienceMax) && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-blue-700">Active Filters:</span>
                {searchFilters.primarySkills.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Primary: {searchFilters.primarySkills.join(', ')}
                  </span>
                )}
                {searchFilters.secondarySkills.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Secondary: {searchFilters.secondarySkills.join(', ')}
                  </span>
                )}
                {searchFilters.experienceMin && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Min Exp: {searchFilters.experienceMin} years
                  </span>
                )}
                {searchFilters.experienceMax && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Max Exp: {searchFilters.experienceMax} years
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={editSearchFilters}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={resetSearchFilters}
                  className="text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT SIDEBAR - SKILLS WIDGET */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-4 sticky top-6">
                <SkillsSidebar 
                  skillsLoading={skillsLoading}
                  handleSkillSelect={handleSkillSelect}
                  selectedSkill={selectedSkill}
                  totalSkills={totalSkills}
                  skills={skills}
                  skillCounts={skillCounts}
                  filterLoading={filterLoading}
                  userRole={userRole}
                  handleDeleteSkill={handleDeleteSkill}
                  showAddSkillInput={showAddSkillInput}
                  newSkillName={newSkillName}
                  setNewSkillName={setNewSkillName}
                  handleAddSkillToDatabase={handleAddSkillToDatabase}
                  setShowAddSkillInput={setShowAddSkillInput}
                />

                <SelectedCandidatesPanel 
                  selectedCandidates={selectedCandidates}
                  candidateInProgress={candidateInProgress}
                  handleSelectCandidate={handleSelectCandidate}
                  handleRemoveCandidate={handleRemoveCandidate}
                  toggleSelectedView={toggleSelectedView}
                  showSelectedView={showSelectedView}
                />

                {/* Loading indicator for filter */}
                {filterLoading && (
                  <div className="absolute inset-0 bg-white/50 rounded-2xl flex items-center justify-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* MAIN CONTENT - CANDIDATES */}
            <div className="lg:col-span-3">
              {/* Results Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {showSelectedView
                        ? "Selected Candidates"
                        : (selectedSkill === "All" ? "All Candidates" : `${selectedSkill} Professionals`)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {showSelectedView ? (
                        selectedCandidates.length > 0 ? (
                          `Showing ${selectedIndexOfFirstItem + 1} to ${Math.min(selectedIndexOfLastItem, selectedCandidates.length)} of ${selectedCandidates.length} selected candidates`
                        ) : (
                          "No candidates selected"
                        )
                      ) : (
                        filteredCandidates.length > 0 ? (
                          `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, filteredCandidates.length)} of ${filteredCandidates.length} candidates`
                        ) : (
                          "No candidates found"
                        )
                      )}
                      {!showSelectedView && searchTerm && ` (filtered by "${searchTerm}")`}
                    </p>
                  </div>
                  {showSelectedView && (
                    <button
                      onClick={() => setShowSelectedView(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                    >
                      Back to All Candidates
                    </button>
                  )}
                </div>
              </div>

              {/* Candidates Grid */}
              <div className="bg-white rounded-2xl shadow-xl p-4">
                {showSelectedView ? (
                  // Selected Candidates View
                  selectedCandidates.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No candidates selected
                      </h3>
                      <p className="text-gray-500">
                        Select candidates from the main list to view them here
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {selectedCurrentItems.map(candidate => {
                          const skills = parseKeySkills(candidate.keySkills);
                          return (
                            <div
                              key={`selected-card-${candidate.id}`}
                              className="border rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={(e) => handleViewDetails(candidate, e)}
                            >
                              {/* Candidate Header */}
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-lg truncate hover:text-blue-600">{candidate.name?.replace(/[^\x20-\x7E]/g, ' ')}</h4>
                                  <p className="text-gray-600 text-sm truncate">{candidate.currentOrg?.replace(/[^\x20-\x7E]/g, ' ')}</p>
                                </div>
                                <button
                                  onClick={(e) => handleRemoveCandidate(candidate.id, e)}
                                  className="px-3 py-1 rounded text-sm ml-2 flex-shrink-0 bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>

                              {/* Candidate Info */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>{candidate.mobile?.replace(/[^0-9+\s-]/g, '')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Briefcase size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>Exp: {candidate.experience} years</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Building2 size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>Client: {candidate.clientName ? candidate.clientName.replace(/[^\x20-\x7E]/g, ' ') : "N/A"}</span>
                                </div>
                              </div>

                              {/* Skills in selected view - Blue box for each skill */}
                              <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Key Skills:</p>
                                <div className="flex flex-wrap gap-2">
                                  {(() => {
                                    let skillsArray = [];

                                    if (Array.isArray(candidate.keySkills)) {
                                      skillsArray = candidate.keySkills;
                                    } else if (typeof candidate.keySkills === 'string') {
                                      try {
                                        const parsed = JSON.parse(candidate.keySkills);
                                        skillsArray = Array.isArray(parsed) ? parsed : [parsed];
                                      } catch (e) {
                                        if (candidate.keySkills.includes(',')) {
                                          skillsArray = candidate.keySkills.split(',').map(s => s.trim());
                                        } else {
                                          skillsArray = [candidate.keySkills.trim()];
                                        }
                                      }
                                    }

                                    // Clean each skill (remove quotes and brackets)
                                    skillsArray = skillsArray.map(skill => {
                                      if (typeof skill === 'string') {
                                        return skill.replace(/["'\[\]]/g, '').trim();
                                      }
                                      return skill;
                                    }).filter(skill => skill && skill !== '');

                                    if (skillsArray.length > 0) {
                                      return skillsArray.map((skill, index) => (
                                        <span
                                          key={`${candidate.id}-skill-${index}`}
                                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                                        >
                                          {skill}
                                        </span>
                                      ));
                                    } else {
                                      return <span className="text-sm text-gray-400 italic">No skills listed</span>;
                                    }
                                  })()}
                                </div>
                              </div>
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleSendEmail(candidate.email, e)}
                                  className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1 cursor-pointer"
                                  title="Send Email"
                                >
                                  <Mail size={14} />
                                  Email
                                </button>
                                <button
                                  onClick={(e) => handleSendWhatsApp(candidate.mobile, e)}
                                  className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1 cursor-pointer"
                                  title="Send WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                  WhatsApp
                                </button>
                                <button
                                  onClick={(e) => handleViewResume(candidate, e)}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 cursor-pointer ${candidate.resumePath || candidate.googleDriveViewLink
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
                          );
                        })}
                      </div>

                      {/* Pagination for selected view */}
                      <Pagination 
                        currentPage={selectedViewPage}
                        totalPages={selectedTotalPages}
                        setCurrentPage={setSelectedViewPage}
                        goToPreviousPage={goToSelectedPreviousPage}
                        goToNextPage={goToSelectedNextPage}
                        showInput={false}
                      />
                    </>
                  )
                ) : (
                  // Main Candidates View
                  currentItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No candidates found
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm
                          ? `No results for "${searchTerm}"`
                          : selectedSkill !== "All"
                            ? `No candidates with skill "${selectedSkill}"`
                            : "No candidates available"}
                      </p>
                      {(searchTerm || selectedSkill !== "All") && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedSkill("All");
                            setDisplayedCandidates(candidates);
                          }}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {currentItems.map(candidate => {
                          const skills = parseKeySkills(candidate.keySkills);
                          return (
                            <CandidateCard
                              key={`candidate-${candidate.id}`}
                              candidate={candidate}
                              userRole={userRole}
                              searchParams={searchParams}
                              selectedCandidates={selectedCandidates}
                              candidateInProgress={candidateInProgress}
                              handleViewDetails={handleViewDetails}
                              handleEditClick={handleEditClick}
                              handleDeleteClick={handleDeleteClick}
                              handleSelectCandidate={handleSelectCandidate}
                              handleSendEmail={handleSendEmail}
                              handleSendWhatsApp={handleSendWhatsApp}
                              handleViewResume={handleViewResume}
                            />
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                        goToPreviousPage={goToPreviousPage}
                        goToNextPage={goToNextPage}
                        showInput={true}
                      />
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CANDIDATE DETAILS MODAL */}
        <CandidateDetailsModal
          selectedCandidate={selectedCandidate}
          setShowCandidateDetails={setShowCandidateDetails}
          setSelectedCandidate={setSelectedCandidate}
          setShowResumeModal={setShowResumeModal}
          setSelectedResumeUrl={setSelectedResumeUrl}
        />

        {/* RESUME MODAL */}
        <ResumeModal
          showResumeModal={showResumeModal}
          selectedResumeUrl={selectedResumeUrl}
          setShowResumeModal={setShowResumeModal}
          setSelectedResumeUrl={setSelectedResumeUrl}
        />

        {/* SEARCH FILTER POPUP */}
        <SearchFiltersPopup
          showSearchPopup={showSearchPopup}
          setShowSearchPopup={setShowSearchPopup}
          primarySkillInput={primarySkillInput}
          handlePrimarySkillInputChange={handlePrimarySkillInputChange}
          handlePrimarySkillKeyDown={handlePrimarySkillKeyDown}
          showPrimarySuggestions={showPrimarySuggestions}
          filteredPrimarySuggestions={filteredPrimarySuggestions}
          selectPrimarySkill={selectPrimarySkill}
          selectedPrimarySuggestionIndex={selectedPrimarySuggestionIndex}
          secondarySkillInput={secondarySkillInput}
          handleSecondarySkillInputChange={handleSecondarySkillInputChange}
          handleSecondarySkillKeyDown={handleSecondarySkillKeyDown}
          showSecondarySuggestions={showSecondarySuggestions}
          filteredSecondarySuggestions={filteredSecondarySuggestions}
          selectSecondarySkill={selectSecondarySkill}
          selectedSecondarySuggestionIndex={selectedSecondarySuggestionIndex}
          searchFilters={searchFilters}
          handleSearchFilterChange={handleSearchFilterChange}
          resetSearchFilters={resetSearchFilters}
          applySearchFilters={applySearchFilters}
        />

        {/* ADD PROFILE MODAL */}
        <AddProfileModal
          showAddProfile={showAddProfile}
          setShowAddProfile={setShowAddProfile}
          successMessage={successMessage}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          handleAddProfile={handleAddProfile}
          newProfile={newProfile}
          setNewProfile={setNewProfile}
          handleInputChange={handleInputChange}
          visaTypesLoading={visaTypesLoading}
          visaTypes={visaTypes}
          profileSubmissionDate={profileSubmissionDate}
          setProfileSubmissionDate={setProfileSubmissionDate}
          handleRemoveSkill={handleRemoveSkill}
          skillInput={skillInput}
          handleAddSkillInputChange={handleAddSkillInputChange}
          handleAddSkillKeyDown={handleAddSkillKeyDown}
          handleAddSkillToProfile={handleAddSkillToProfile}
          showAddSkillSuggestions={showAddSkillSuggestions}
          filteredAddSkillSuggestions={filteredAddSkillSuggestions}
          selectedAddSkillSuggestionIndex={selectedAddSkillSuggestionIndex}
          skillSuggestions={skillSuggestions}
          handlePdfUpload={handlePdfUpload}
          pdfFile={pdfFile}
          setPdfFile={setPdfFile}
          submitLoading={formSubmitLoading}
        />

        {/* EDIT PROFILE MODAL */}
        <EditProfileModal
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          userRole={userRole}
          editingCandidate={editingCandidate}
          setEditingCandidate={setEditingCandidate}
          setEditFormData={setEditFormData}
          setEditSkillInput={setEditSkillInput}
          setEditPdfFile={setEditPdfFile}
          setEditFormErrors={setEditFormErrors}
          successMessage={successMessage}
          editFormErrors={editFormErrors}
          handleUpdateProfile={handleUpdateProfile}
          editFormData={editFormData}
          handleEditInputChange={handleEditInputChange}
          handleEditSkillRemove={handleEditSkillRemove}
          editSkillInput={editSkillInput}
          handleEditSkillInputChange={handleEditSkillInputChange}
          handleEditSkillKeyDown={handleEditSkillKeyDown}
          handleEditSkillAdd={handleEditSkillAdd}
          showEditSkillSuggestions={showEditSkillSuggestions}
          filteredEditSkillSuggestions={filteredEditSkillSuggestions}
          selectedEditSkillSuggestionIndex={selectedEditSkillSuggestionIndex}
          skillSuggestions={skillSuggestions}
          visaTypesLoading={visaTypesLoading}
          visaTypes={visaTypes}
          editProfileSubmissionDate={editProfileSubmissionDate}
          setEditProfileSubmissionDate={setEditProfileSubmissionDate}
          handleEditPdfUpload={handleEditPdfUpload}
          editPdfFile={editPdfFile}
          editLoading={editLoading}
        />

        {/* DELETE CONFIRMATION MODAL */}
        <DeleteConfirmModal
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          deletingCandidateName={deletingCandidateName}
          setDeletingCandidateId={setDeletingCandidateId}
          setDeletingCandidateName={setDeletingCandidateName}
          error={error}
          deleteLoading={deleteLoading}
          handleConfirmDelete={handleConfirmDelete}
        />
      </div>
    </div>
  );
};

export default Recruiter;
