import React from 'react';
import { X, CheckCircle, Upload, Trash2, Loader, Save } from 'lucide-react';
import DatePicker from 'react-datepicker';

const EditProfileModal = ({
  showEditModal,
  setShowEditModal,
  userRole,
  editingCandidate,
  setEditingCandidate,
  setEditFormData,
  setEditSkillInput,
  setEditPdfFile,
  setEditFormErrors,
  successMessage,
  editFormErrors,
  handleUpdateProfile,
  editFormData,
  handleEditInputChange,
  handleEditSkillRemove,
  editSkillInput,
  handleEditSkillInputChange,
  handleEditSkillKeyDown,
  handleEditSkillAdd,
  showEditSkillSuggestions,
  filteredEditSkillSuggestions,
  selectedEditSkillSuggestionIndex,
  skillSuggestions,
  visaTypesLoading,
  visaTypes,
  editProfileSubmissionDate,
  setEditProfileSubmissionDate,
  handleEditPdfUpload,
  editPdfFile,
  editLoading
}) => {
  if (!showEditModal || !editingCandidate) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold">Edit Candidate Profile</h3>
              <p className="text-gray-500 text-sm">
                {userRole === 'Admin'
                  ? '🔓 Full access - you can edit all fields'
                  : '🔒 Limited access - CTC and Sourcing fields are restricted (Contact Admin)'}
              </p>
            </div>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingCandidate(null);
                setEditFormData({
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
                setEditSkillInput("");
                setEditPdfFile(null);
                setEditFormErrors({});
              }}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              {successMessage}
            </div>
          )}

          {/* Form Error */}
          {editFormErrors.submit && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {editFormErrors.submit}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
            {/* FIRST ROW - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Client Name - Editable by both */}
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={editFormData.clientName}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Broadcom"
                  />
                </div>

                {/* Candidate Name - Editable by both */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editFormErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter full name"
                  />
                  {editFormErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.name}</p>
                  )}
                </div>

                {/* Email - Editable by both */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editFormErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter email address"
                  />
                  {editFormErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.email}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={editFormData.mobile}
                    onChange={(e) => {
                      let value = e.target.value;
                      let digitsOnly = value.replace(/\D/g, '');
                      if (digitsOnly.length > 11) {
                        digitsOnly = digitsOnly.slice(0, 11);
                      }
                      setEditFormData(prev => ({ ...prev, mobile: digitsOnly }));
                      if (digitsOnly.length === 10 || digitsOnly.length === 11) {
                        setEditFormErrors(prev => ({ ...prev, mobile: null }));
                      } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
                        setEditFormErrors(prev => ({ ...prev, mobile: `Mobile number must be 10 or 11 digits (currently ${digitsOnly.length})` }));
                      } else if (digitsOnly.length > 11) {
                        setEditFormErrors(prev => ({ ...prev, mobile: "Mobile number cannot exceed 11 digits" }));
                      } else {
                        setEditFormErrors(prev => ({ ...prev, mobile: null }));
                      }
                    }}
                    onKeyPress={(e) => {
                      const currentDigits = editFormData.mobile.replace(/\D/g, '');
                      if (currentDigits.length >= 11 && /[0-9]/.test(e.key)) {
                        e.preventDefault();
                        return;
                      }
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${editFormErrors.mobile ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter mobile number (10 or 11 digits)"
                  />
                  {editFormErrors.mobile && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.mobile}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Only numbers allowed, 10 digits (India) or 11 digits (China,USA)</p>
                  {editFormData.mobile && (editFormData.mobile.length === 10 || editFormData.mobile.length === 11) && (
                    <p className="text-xs text-green-600 mt-1">
                      Valid {editFormData.mobile.length}-digit number
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Current Organization - Editable by both */}
                <div>
                  <label className="block text-sm font-medium mb-1">Current Organization</label>
                  <input
                    type="text"
                    name="currentOrg"
                    value={editFormData.currentOrg}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tech Mahindra"
                  />
                </div>

                {/* Experience - Editable by both */}
                <div>
                  <label className="block text-sm font-medium mb-1">Experience</label>
                  <input
                    type="text"
                    name="experience"
                    value={editFormData.experience}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5 years"
                  />
                </div>

                {/* Current CTC - RESTRICTED: Only Admin can edit */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Current CTC
                    {userRole !== 'Admin' && (
                      <span className="ml-2 text-xs text-red-500">(Contact Admin)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="currentCTC"
                    value={editFormData.currentCTC}
                    onChange={handleEditInputChange}
                    disabled={userRole !== 'Admin'}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole !== 'Admin'
                      ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                      : 'border-gray-300'
                      }`}
                    placeholder="e.g., 12LPA"
                    title={userRole !== 'Admin' ? 'Only Admin can edit this field' : ''}
                  />
                </div>

                {/* Expected CTC - RESTRICTED: Only Admin can edit */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Expected CTC
                    {userRole !== 'Admin' && (
                      <span className="ml-2 text-xs text-red-500">(Contact Admin)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="expectedCTC"
                    value={editFormData.expectedCTC}
                    onChange={handleEditInputChange}
                    disabled={userRole !== 'Admin'}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole !== 'Admin'
                      ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                      : 'border-gray-300'
                      }`}
                    placeholder="e.g., 18LPA"
                    title={userRole !== 'Admin' ? 'Only Admin can edit this field' : ''}
                  />
                </div>
              </div>
            </div>

            {/* SECOND ROW - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Left Column of Second Row */}
              <div className="space-y-4">
                {/* Notice Period - Editable by both */}
                <div>
                  <label className="block text-sm font-medium mb-1">Notice Period</label>
                  <input
                    type="text"
                    name="noticePeriod"
                    value={editFormData.noticePeriod}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2 months"
                  />
                </div>

                {/* Profile Sourced By - RESTRICTED: Only Admin can edit */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Profile Sourced By
                    {userRole !== 'Admin' && (
                      <span className="ml-2 text-xs text-red-500">(Contact Admin)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="profileSourcedBy"
                    value={editFormData.profileSourcedBy}
                    onChange={handleEditInputChange}
                    disabled={userRole !== 'Admin'}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${userRole !== 'Admin'
                      ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                      : 'border-gray-300'
                      }`}
                    placeholder="e.g., Swathi - Linkedin"
                    title={userRole !== 'Admin' ? 'Only Admin can edit this field' : ''}
                  />
                </div>

                {/* Visa Type - Editable by both */}
                <div>
                  <label className="block text-sm font-medium mb-1">Visa Type</label>
                  <select
                    name="visaType"
                    value={editFormData.visaType}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={visaTypesLoading}
                  >
                    {visaTypesLoading ? (
                      <option>Loading visa types...</option>
                    ) : (
                      visaTypes.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Visa Validity Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">Visa Validity Date</label>
                  <input
                    type="date"
                    name="visaValidityDate"
                    value={editFormData.visaValidityDate}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">When does the visa expire?</p>
                </div>
              </div>

              {/* Right Column of Second Row */}
              <div className="space-y-4">
                {/* Profile Submission Date - Editable by both */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Profile Submission Date
                  </label>
                  <div className="w-full">
                    <DatePicker
                      selected={editProfileSubmissionDate}
                      onChange={(date) => setEditProfileSubmissionDate(date)}
                      dateFormat="dd-MMM-yy"
                      placeholderText="Select date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxDate={new Date()}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      wrapperClassName="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {editProfileSubmissionDate
                      ? `Selected: ${editProfileSubmissionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`
                      : `Current: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Skills Section - Full Width (Editable by both) */}
            <div className="mt-6 w-full">
              <label className="block text-sm font-medium mb-2">
                Key Skills <span className="text-red-500">*</span>
              </label>

              {/* Skill Input with Suggestions and Tags Inside */}
              <div className="relative w-full">
                <div className="flex flex-wrap items-center gap-1 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[42px]">
                  {/* Display selected skills as tags inside the input */}
                  {editFormData.keySkills.map((skill, index) => (
                    <span
                      key={`edit-skill-tag-${index}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleEditSkillRemove(skill)}
                        className="hover:text-blue-600 focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}

                  {/* Input field for new skills */}
                  <input
                    type="text"
                    value={editSkillInput}
                    onChange={handleEditSkillInputChange}
                    onKeyDown={handleEditSkillKeyDown}
                    placeholder={editFormData.keySkills.length === 0 ? "Enter a skill and press Enter (use comma for multiple)" : ""}
                    className="flex-1 min-w-[150px] outline-none bg-transparent"
                  />
                </div>

                {/* Add Button in Edit Modal */}
                <button
                  type="button"
                  onClick={() => {
                    if (editSkillInput.trim()) {
                      handleEditSkillAdd();
                    }
                  }}
                  disabled={!editSkillInput.trim()}
                  className="absolute right-2 top-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Add
                </button>

                {/* Edit Skill Suggestions Dropdown */}
                {showEditSkillSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredEditSkillSuggestions.length > 0 ? (
                      filteredEditSkillSuggestions.map((skill, index) => (
                        <div
                          key={`edit-skill-suggestion-${skill}`}
                          onClick={() => {
                            handleEditSkillAdd(skill);
                          }}
                          className={`px-3 py-2 cursor-pointer text-sm ${index === selectedEditSkillSuggestionIndex
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-blue-50'
                            }`}
                        >
                          {skill}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">
                          "{editSkillInput.split(',').pop().trim()}" is not in the skills list
                        </p>
                        <p className="text-xs text-gray-400">
                          Only skills from the database can be added
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Skills Error */}
              {editFormErrors.keySkills && (
                <p className="text-red-500 text-xs mt-2">{editFormErrors.keySkills}</p>
              )}
            </div>

            {/* PDF Upload Section (Editable by both) */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Upload Resume (PDF)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleEditPdfUpload}
                      className="hidden"
                    />
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-500">
                      {editPdfFile ? editPdfFile.name : editingCandidate?.resumePath ? "Replace existing resume" : "Click to upload PDF"}
                    </p>
                  </div>
                </label>
                {editPdfFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditPdfFile(null);
                      setEditFormData(prev => ({ ...prev, resumePdf: null }));
                    }}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCandidate(null);
                  setEditFormData({
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
                    resumePdf: null
                  });
                  setEditSkillInput("");
                  setEditPdfFile(null);
                  setEditFormErrors({});
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {editLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
