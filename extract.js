const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'src/Pages/Recruiter_backup.jsx');
const recruiterPath = path.join(__dirname, 'src/Pages/Recruiter.jsx');
const addProfilePath = path.join(__dirname, 'src/Pages/Recruiter/components/AddProfileModal.jsx');
const editProfilePath = path.join(__dirname, 'src/Pages/Recruiter/components/EditProfileModal.jsx');

const content = fs.readFileSync(backupPath, 'utf8');
const lines = content.split('\n');

function extractLines(startMarker, endMarker) {
    let startIndex = -1;
    let endIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(startMarker)) startIndex = i;
        if (startIndex !== -1 && lines[i].includes(endMarker) && i > startIndex + 10) {
            endIndex = i;
            break;
        }
    }
    return { startIndex, endIndex, content: lines.slice(startIndex, endIndex + 1).join('\n') };
}

const addProfileInfo = extractLines('{/* ADD PROFILE MODAL */}', ')}');
// The AddProfileModal ends at line 4349 in the backup (it is followed by {/* EDIT PROFILE MODAL */})
const addProfileActualEnd = lines.findIndex((line, i) => i > addProfileInfo.startIndex && line.includes('{/* EDIT PROFILE MODAL */}')) - 2;

const addProfileContent = lines.slice(addProfileInfo.startIndex, addProfileActualEnd + 1).join('\n');

const editProfileInfo = extractLines('{/* EDIT PROFILE MODAL */}', ')}');
const editProfileActualEnd = lines.findIndex((line, i) => i > editProfileInfo.startIndex && line.includes('{/* DELETE CONFIRMATION MODAL */}')) - 2;

const editProfileContent = lines.slice(editProfileInfo.startIndex, editProfileActualEnd + 1).join('\n');

const addProfileComponent = `import React from 'react';
import { X, CheckCircle, Upload, Trash2, Loader, Save } from 'lucide-react';
import DatePicker from 'react-datepicker';

const AddProfileModal = ({
  showAddProfile, setShowAddProfile, successMessage, formErrors, setFormErrors,
  handleAddProfile, newProfile, setNewProfile, handleInputChange,
  visaTypesLoading, visaTypes, profileSubmissionDate, setProfileSubmissionDate,
  handleRemoveSkill, skillInput, handleAddSkillInputChange, handleAddSkillKeyDown,
  handleAddSkillToProfile, showAddSkillSuggestions, filteredAddSkillSuggestions,
  selectedAddSkillSuggestionIndex, skillSuggestions, handlePdfUpload, pdfFile,
  setPdfFile, submitLoading
}) => {
  if (!showAddProfile) return null;
  return (
    <>
${addProfileContent.replace('{showAddProfile && (', '').replace(/}\s*\)\s*}$/, '')}
    </>
  );
};

export default AddProfileModal;
`;

const editProfileComponent = `import React from 'react';
import { X, CheckCircle, Upload, Trash2, Loader, Save } from 'lucide-react';
import DatePicker from 'react-datepicker';

const EditProfileModal = ({
  showEditModal, setShowEditModal, userRole, editingCandidate, setEditingCandidate,
  setEditFormData, setEditSkillInput, setEditPdfFile, setEditFormErrors,
  successMessage, editFormErrors, handleUpdateProfile, editFormData,
  handleEditInputChange, handleEditRemoveSkill, editSkillInput, handleEditSkillInputChange,
  handleEditSkillKeyDown, handleEditAddSkillToProfile, showEditSkillSuggestions,
  filteredEditSkillSuggestions, selectedEditSkillSuggestionIndex, skillSuggestions,
  visaTypesLoading, visaTypes, editProfileSubmissionDate, setEditProfileSubmissionDate,
  handleEditPdfUpload, editPdfFile, setEditPdfFile, editSubmitLoading
}) => {
  if (!showEditModal || !editingCandidate) return null;
  return (
    <>
${editProfileContent.replace('{showEditModal && editingCandidate && (', '').replace(/}\s*\)\s*}$/, '')}
    </>
  );
};

export default EditProfileModal;
`;

fs.writeFileSync(addProfilePath, addProfileComponent);
fs.writeFileSync(editProfilePath, editProfileComponent);
console.log("Extracted components successfully");
