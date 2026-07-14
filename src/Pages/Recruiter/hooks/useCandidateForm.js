import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { candidateService } from '../services/candidateService';

export const useCandidateForm = (fetchAllCandidates, setSuccessMessage, skillSuggestions) => {
  // Add Profile State
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [newProfile, setNewProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    experience: "",
    currentOrg: "",
    currentCTC: "",
    expectedCTC: "",
    noticePeriod: "",
    profileSourcedBy: "",
    clientName: "",
    keySkills: [],
    visaType: "NA",
    visaValidityDate: "",
    resumePdf: null
  });
  const [profileSubmissionDate, setProfileSubmissionDate] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Edit Profile State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    experience: "",
    currentOrg: "",
    currentCTC: "",
    expectedCTC: "",
    noticePeriod: "",
    profileSourcedBy: "",
    clientName: "",
    profileSubmissionDate: "",
    keySkills: [],
    visaType: "NA",
    visaValidityDate: "",
    resumePdf: null
  });
  const [editProfileSubmissionDate, setEditProfileSubmissionDate] = useState(null);
  const [editPdfFile, setEditPdfFile] = useState(null);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Skill Input State
  const [skillInput, setSkillInput] = useState("");
  const [editSkillInput, setEditSkillInput] = useState("");

  const [showAddSkillSuggestions, setShowAddSkillSuggestions] = useState(false);
  const [filteredAddSkillSuggestions, setFilteredAddSkillSuggestions] = useState([]);
  const [selectedAddSkillSuggestionIndex, setSelectedAddSkillSuggestionIndex] = useState(0);

  const [showEditSkillSuggestions, setShowEditSkillSuggestions] = useState(false);
  const [filteredEditSkillSuggestions, setFilteredEditSkillSuggestions] = useState([]);
  const [selectedEditSkillSuggestionIndex, setSelectedEditSkillSuggestionIndex] = useState(0);

  // ADD PROFILE LOGIC
  const validateForm = async () => {
    const errors = {};

    if (!newProfile.name?.trim()) errors.name = "Name is required";
    
    if (!newProfile.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newProfile.email)) {
      errors.email = "Email is invalid";
    }

    if (!newProfile.mobile?.trim()) {
      errors.mobile = "Mobile number is required";
    } else {
      const cleanMobile = newProfile.mobile.replace(/\D/g, '');
      if (cleanMobile.length < 10 || cleanMobile.length > 11) {
        errors.mobile = "Mobile number must be 10 or 11 digits";
      }
    }

    if (!newProfile.keySkills || newProfile.keySkills.length === 0) {
      errors.keySkills = "At least one skill is required";
    }

    if (newProfile.email?.trim() && !errors.email) {
      const exists = await candidateService.checkEmailExists(newProfile.email);
      if (exists) errors.email = "This email is already registered";
    }

    if (newProfile.mobile?.trim() && !errors.mobile) {
      const exists = await candidateService.checkMobileExists(newProfile.mobile);
      if (exists) errors.mobile = "This mobile number is already registered";
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProfile(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddProfile = async () => {
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormErrors({});

      const formData = new FormData();
      formData.append('name', newProfile.name);
      formData.append('email', newProfile.email);
      formData.append('mobile', newProfile.mobile);
      formData.append('experience', newProfile.experience || '');
      formData.append('currentOrg', newProfile.currentOrg || '');
      formData.append('currentCTC', newProfile.currentCTC || '');
      formData.append('expectedCTC', newProfile.expectedCTC || '');
      formData.append('noticePeriod', newProfile.noticePeriod || '');
      formData.append('profileSourcedBy', newProfile.profileSourcedBy || '');
      formData.append('clientName', newProfile.clientName || '');
      formData.append('visaValidityDate', newProfile.visaValidityDate || '');

      if (profileSubmissionDate) {
        const day = profileSubmissionDate.getDate().toString().padStart(2, '0');
        const month = profileSubmissionDate.toLocaleString('default', { month: 'short' });
        const year = profileSubmissionDate.getFullYear().toString().slice(-2);
        formData.append('profileSubmissionDate', `${day}-${month}-${year}`);
      } else {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = today.toLocaleString('default', { month: 'short' });
        const year = today.getFullYear().toString().slice(-2);
        formData.append('profileSubmissionDate', `${day}-${month}-${year}`);
      }

      formData.append('keySkills', JSON.stringify(newProfile.keySkills));
      formData.append('visaType', newProfile.visaType || 'NA');

      if (newProfile.resumePdf) {
        formData.append('resume', newProfile.resumePdf);
      }

      const response = await candidateService.addCandidate(formData);

      if (response.data.success) {
        setSuccessMessage("Candidate profile added successfully!");
        toast.success("Candidate profile added successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        
        setShowAddProfile(false);
        setNewProfile({
          name: "", email: "", mobile: "", experience: "", currentOrg: "", currentCTC: "",
          expectedCTC: "", noticePeriod: "", profileSourcedBy: "", clientName: "",
          keySkills: [], visaType: "NA", visaValidityDate: "", resumePdf: null
        });
        setProfileSubmissionDate(null);
        setPdfFile(null);
        setFormErrors({});
        
        await fetchAllCandidates();
      }
    } catch (err) {
      console.error('Error adding profile:', err);
      setFormErrors({ submit: err.response?.data?.message || err.message || "Failed to add profile" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // ADD SKILLS LOGIC
  const handleAddSkillInputChange = (e) => {
    const value = e.target.value;
    setSkillInput(value);
    setSelectedAddSkillSuggestionIndex(0);

    if (value.trim()) {
      const filtered = skillSuggestions.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase().trim())
      );
      setFilteredAddSkillSuggestions(filtered);
      setShowAddSkillSuggestions(true);
    } else {
      setFilteredAddSkillSuggestions([]);
      setShowAddSkillSuggestions(false);
    }
  };

  const handleAddSkillKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedAddSkillSuggestionIndex(prev =>
        prev < filteredAddSkillSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedAddSkillSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAddSkillSuggestions.length > 0 && selectedAddSkillSuggestionIndex >= 0) {
        handleAddSkillToProfile(filteredAddSkillSuggestions[selectedAddSkillSuggestionIndex]);
      } else if (skillInput.trim()) {
        handleAddSkillToProfile();
      }
    } else if (e.key === 'Escape') {
      setShowAddSkillSuggestions(false);
      setSelectedAddSkillSuggestionIndex(0);
    }
  };

  const handleAddSkillToProfile = (skillToAdd = null) => {
    let skill = skillToAdd || skillInput.trim();
    if (!skill) return;

    const skillExists = skillSuggestions.some(
      existingSkill => existingSkill.toLowerCase() === skill.toLowerCase()
    );

    if (skillExists) {
      if (!newProfile.keySkills.includes(skill)) {
        setNewProfile(prev => ({ ...prev, keySkills: [...prev.keySkills, skill] }));
      } else {
        toast.error(`"${skill}" is already added`);
        return;
      }
      if (formErrors.keySkills) setFormErrors(prev => ({ ...prev, keySkills: null }));
      setSkillInput("");
      setShowAddSkillSuggestions(false);
      setSelectedAddSkillSuggestionIndex(0);
    } else {
      toast.error(`"${skill}" is not in the skills database. Please select from the suggestions.`);
      setShowAddSkillSuggestions(false);
      setSelectedAddSkillSuggestionIndex(0);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setNewProfile(prev => ({
      ...prev,
      keySkills: prev.keySkills.filter(s => s !== skillToRemove)
    }));
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        e.target.value = '';
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File size must be less than 10MB.`);
        e.target.value = '';
        return;
      }
      setPdfFile(file);
      setNewProfile(prev => ({ ...prev, resumePdf: file }));
    }
  };

  // EDIT PROFILE LOGIC
  const handleEditClick = (candidate, e) => {
    e.stopPropagation();
    setEditingCandidate(candidate);
    
    let parsedSkills = [];
    if (Array.isArray(candidate.keySkills)) {
      parsedSkills = [...candidate.keySkills];
    } else if (typeof candidate.keySkills === 'string') {
      try {
        const parsed = JSON.parse(candidate.keySkills);
        parsedSkills = Array.isArray(parsed) ? parsed : [candidate.keySkills];
      } catch {
        parsedSkills = candidate.keySkills.split(',').map(s => s.trim());
      }
    }

    setEditFormData({
      name: candidate.name || "",
      email: candidate.email || "",
      mobile: candidate.mobile || "",
      experience: candidate.experience || "",
      currentOrg: candidate.currentOrg || "",
      currentCTC: candidate.currentCTC || "",
      expectedCTC: candidate.expectedCTC || "",
      noticePeriod: candidate.noticePeriod || "",
      profileSourcedBy: candidate.profileSourcedBy || "",
      clientName: candidate.clientName || "",
      profileSubmissionDate: candidate.profileSubmissionDate || "",
      keySkills: parsedSkills.filter(s => s),
      visaType: candidate.visaType || "NA",
      visaValidityDate: candidate.visaValidityDate || "",
      resumePdf: null
    });

    if (candidate.profileSubmissionDate) {
      const parts = candidate.profileSubmissionDate.split('-');
      if (parts.length === 3) {
        const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
        const day = parseInt(parts[0], 10);
        const monthIndex = months[parts[1]];
        let year = parseInt(parts[2], 10);
        year = year < 100 ? 2000 + year : year;
        if (!isNaN(day) && monthIndex !== undefined && !isNaN(year)) {
          setEditProfileSubmissionDate(new Date(year, monthIndex, day));
        }
      }
    } else {
      setEditProfileSubmissionDate(null);
    }

    setEditFormErrors({});
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (editFormErrors[name]) setEditFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateEditForm = async () => {
    const errors = {};
    const candidateId = editingCandidate?.actualId || editingCandidate?.canId || editingCandidate?.id;

    if (!editFormData.name?.trim()) errors.name = "Name is required";
    
    if (!editFormData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = "Email is invalid";
    }

    if (!editFormData.mobile?.trim()) {
      errors.mobile = "Mobile number is required";
    } else {
      const cleanMobile = editFormData.mobile.replace(/\D/g, '');
      if (cleanMobile.length < 10 || cleanMobile.length > 11) {
        errors.mobile = "Mobile number must be 10 or 11 digits";
      }
    }

    if (!editFormData.keySkills || editFormData.keySkills.length === 0) {
      errors.keySkills = "At least one skill is required";
    }

    if (editFormData.email?.trim() && editFormData.email !== editingCandidate?.email && !errors.email) {
      const exists = await candidateService.checkEmailExists(editFormData.email, candidateId);
      if (exists) errors.email = "This email is already registered";
    }

    if (editFormData.mobile?.trim() && editFormData.mobile !== editingCandidate?.mobile && !errors.mobile) {
      const exists = await candidateService.checkMobileExists(editFormData.mobile, candidateId);
      if (exists) errors.mobile = "This mobile number is already registered";
    }

    return errors;
  };

  const handleUpdateProfile = async () => {
    const errors = await validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    try {
      setEditLoading(true);
      setEditFormErrors({});

      let candidateId = editingCandidate?.actualId || editingCandidate?.canId || editingCandidate?.id;
      if (candidateId && typeof candidateId === 'string' && candidateId.startsWith('temp-')) {
        candidateId = null;
      }
      if (candidateId && typeof candidateId === 'string' && !isNaN(candidateId)) {
        candidateId = parseInt(candidateId);
      }

      if (!candidateId || isNaN(candidateId)) {
        throw new Error("Invalid candidate ID - cannot update.");
      }

      const formData = new FormData();
      formData.append('name', editFormData.name);
      formData.append('email', editFormData.email);
      formData.append('mobile', editFormData.mobile);
      formData.append('experience', editFormData.experience || '');
      formData.append('currentOrg', editFormData.currentOrg || '');
      formData.append('currentCTC', editFormData.currentCTC || '');
      formData.append('expectedCTC', editFormData.expectedCTC || '');
      formData.append('noticePeriod', editFormData.noticePeriod || '');
      formData.append('profileSourcedBy', editFormData.profileSourcedBy || '');
      formData.append('clientName', editFormData.clientName || '');
      formData.append('visaValidityDate', editFormData.visaValidityDate || '');

      if (editProfileSubmissionDate) {
        const day = editProfileSubmissionDate.getDate().toString().padStart(2, '0');
        const month = editProfileSubmissionDate.toLocaleString('default', { month: 'short' });
        const year = editProfileSubmissionDate.getFullYear().toString().slice(-2);
        formData.append('profileSubmissionDate', `${day}-${month}-${year}`);
      }

      formData.append('keySkills', JSON.stringify(editFormData.keySkills));
      formData.append('visaType', editFormData.visaType || 'NA');

      if (editPdfFile) {
        formData.append('resume', editPdfFile);
      }

      const response = await candidateService.updateCandidate(candidateId, formData);

      if (response.data.success) {
        setSuccessMessage("Candidate profile updated successfully!");
        toast.success("Candidate profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        
        setShowEditModal(false);
        setEditingCandidate(null);
        setEditPdfFile(null);
        
        await fetchAllCandidates();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setEditFormErrors({ submit: err.response?.data?.message || err.message || "Failed to update profile" });
    } finally {
      setEditLoading(false);
    }
  };

  // EDIT SKILLS LOGIC
  const handleEditSkillInputChange = (e) => {
    const value = e.target.value;
    setEditSkillInput(value);
    setSelectedEditSkillSuggestionIndex(0);

    if (value.trim()) {
      const filtered = skillSuggestions.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase().trim())
      );
      setFilteredEditSkillSuggestions(filtered);
      setShowEditSkillSuggestions(true);
    } else {
      setFilteredEditSkillSuggestions([]);
      setShowEditSkillSuggestions(false);
    }
  };

  const handleEditSkillKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedEditSkillSuggestionIndex(prev => prev < filteredEditSkillSuggestions.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedEditSkillSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEditSkillSuggestions.length > 0 && selectedEditSkillSuggestionIndex >= 0) {
        handleEditSkillAdd(filteredEditSkillSuggestions[selectedEditSkillSuggestionIndex]);
      } else if (editSkillInput.trim()) {
        handleEditSkillAdd();
      }
    } else if (e.key === 'Escape') {
      setShowEditSkillSuggestions(false);
      setSelectedEditSkillSuggestionIndex(0);
    }
  };

  const handleEditSkillAdd = (skillToAdd = null) => {
    const skill = skillToAdd || editSkillInput.trim();
    if (!skill) return;

    const skillExists = skillSuggestions.some(
      existingSkill => existingSkill.toLowerCase() === skill.toLowerCase()
    );

    if (skillExists) {
      if (!editFormData.keySkills.includes(skill)) {
        setEditFormData(prev => ({ ...prev, keySkills: [...prev.keySkills, skill] }));
      } else {
        toast.error(`"${skill}" is already added`);
        return;
      }
      if (editFormErrors.keySkills) setEditFormErrors(prev => ({ ...prev, keySkills: null }));
      setEditSkillInput("");
      setShowEditSkillSuggestions(false);
      setSelectedEditSkillSuggestionIndex(0);
    } else {
      toast.error(`"${skill}" is not in the skills database. Please select from the suggestions.`);
      setShowEditSkillSuggestions(false);
      setSelectedEditSkillSuggestionIndex(0);
    }
  };

  const handleEditSkillRemove = (skillToRemove) => {
    setEditFormData(prev => ({
      ...prev,
      keySkills: prev.keySkills.filter(s => s !== skillToRemove)
    }));
  };

  const handleEditPdfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        e.target.value = '';
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File size must be less than 10MB.`);
        e.target.value = '';
        return;
      }
      setEditPdfFile(file);
      setEditFormData(prev => ({ ...prev, resumePdf: file }));
    }
  };

  return {
    showAddProfile, setShowAddProfile,
    newProfile, setNewProfile,
    profileSubmissionDate, setProfileSubmissionDate,
    formErrors, setFormErrors,
    submitLoading,
    handleInputChange, handleAddProfile,
    
    skillInput, setSkillInput,
    showAddSkillSuggestions, setShowAddSkillSuggestions,
    filteredAddSkillSuggestions, setFilteredAddSkillSuggestions,
    selectedAddSkillSuggestionIndex, setSelectedAddSkillSuggestionIndex,
    handleAddSkillInputChange, handleAddSkillKeyDown, handleAddSkillToProfile, handleRemoveSkill,
    handlePdfUpload,
    pdfFile, setPdfFile,

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
    editPdfFile, setEditPdfFile
  };
};
