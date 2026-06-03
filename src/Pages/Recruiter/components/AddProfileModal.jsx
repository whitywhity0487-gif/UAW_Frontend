import React from 'react';
import { X, CheckCircle, Upload, Trash2, Loader, Save } from 'lucide-react';
import DatePicker from 'react-datepicker';

const AddProfileModal = ({
  showAddProfile,
  setShowAddProfile,
  successMessage,
  formErrors,
  setFormErrors,
  handleAddProfile,
  newProfile,
  setNewProfile,
  handleInputChange,
  visaTypesLoading,
  visaTypes,
  profileSubmissionDate,
  setProfileSubmissionDate,
  handleRemoveSkill,
  skillInput,
  handleAddSkillInputChange,
  handleAddSkillKeyDown,
  handleAddSkillToProfile,
  showAddSkillSuggestions,
  filteredAddSkillSuggestions,
  selectedAddSkillSuggestionIndex,
  skillSuggestions,
  handlePdfUpload,
  pdfFile,
  setPdfFile,
  submitLoading
}) => {
  if (!showAddProfile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold">Add New Candidate Profile</h3>
              <p className="text-gray-500 text-sm">Fill in the details to add a new candidate</p>
            </div>
            <button
              onClick={() => setShowAddProfile(false)}
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
          {formErrors.submit && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formErrors.submit}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleAddProfile(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Client Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={newProfile.clientName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Broadcom"
                  />
                </div>

                {/* Current Organization */}
                <div>
                  <label className="block text-sm font-medium mb-1">Current Organization</label>
                  <input
                    type="text"
                    name="currentOrg"
                    value={newProfile.currentOrg}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tech Mahindra"
                  />
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newProfile.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter full name"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium mb-1">Experience</label>
                  <input
                    type="text"
                    name="experience"
                    value={newProfile.experience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5 years"
                  />
                </div>

                {/* Current CTC */}
                <div>
                  <label className="block text-sm font-medium mb-1">Current CTC</label>
                  <input
                    type="text"
                    name="currentCTC"
                    value={newProfile.currentCTC}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 12LPA"
                  />
                </div>

                {/* Expected CTC */}
                <div>
                  <label className="block text-sm font-medium mb-1">Expected CTC</label>
                  <input
                    type="text"
                    name="expectedCTC"
                    value={newProfile.expectedCTC}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 18LPA"
                  />
                </div>
              </div>
            </div>

            {/* Second Row - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Left Column of Second Row */}
              <div className="space-y-4">
                {/* Notice Period */}
                <div>
                  <label className="block text-sm font-medium mb-1">Notice Period</label>
                  <input
                    type="text"
                    name="noticePeriod"
                    value={newProfile.noticePeriod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2 months"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={newProfile.mobile}
                    onChange={(e) => {
                      let value = e.target.value;
                      let digitsOnly = value.replace(/\D/g, '');
                      if (digitsOnly.length > 11) {
                        digitsOnly = digitsOnly.slice(0, 11);
                      }
                      setNewProfile(prev => ({ ...prev, mobile: digitsOnly }));
                      if (digitsOnly.length === 10 || digitsOnly.length === 11) {
                        setFormErrors(prev => ({ ...prev, mobile: null }));
                      } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
                        setFormErrors(prev => ({ ...prev, mobile: `Mobile number must be 10 or 11 digits (currently ${digitsOnly.length})` }));
                      } else if (digitsOnly.length > 11) {
                        setFormErrors(prev => ({ ...prev, mobile: "Mobile number cannot exceed 11 digits" }));
                      } else {
                        setFormErrors(prev => ({ ...prev, mobile: null }));
                      }
                    }}
                    onKeyPress={(e) => {
                      const currentDigits = newProfile.mobile.replace(/\D/g, '');
                      if (currentDigits.length >= 11 && /[0-9]/.test(e.key)) {
                        e.preventDefault();
                        return;
                      }
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter mobile number"
                  />
                  {formErrors.mobile && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Only numbers allowed, 10 digits (India) or 11 digits (China,USA)</p>
                  {newProfile.mobile && (newProfile.mobile.length === 10 || newProfile.mobile.length === 11) && (
                    <p className="text-xs text-green-600 mt-1">
                      Valid {newProfile.mobile.length}-digit number
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column of Second Row */}
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newProfile.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Profile Sourced By */}
                <div>
                  <label className="block text-sm font-medium mb-1">Profile Sourced By</label>
                  <input
                    type="text"
                    name="profileSourcedBy"
                    value={newProfile.profileSourcedBy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Swathi - Linkedin"
                  />
                </div>
              </div>
            </div>

            {/* Third Row - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Left Column of Third Row */}
              <div className="space-y-4">
                {/* Visa Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Visa Type</label>
                  <select
                    name="visaType"
                    value={newProfile.visaType}
                    onChange={handleInputChange}
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
                    value={newProfile.visaValidityDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">When does the visa expire? (Leave empty if N/A)</p>
                </div>
              </div>

              {/* Right Column of Third Row */}
              <div className="space-y-4">
                {/* Profile Submission Date - with DatePicker */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Profile Submission Date
                  </label>
                  <div className="w-full">
                    <DatePicker
                      selected={profileSubmissionDate}
                      onChange={(date) => {
                        setProfileSubmissionDate(date);
                      }}
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
                    {profileSubmissionDate
                      ? `Selected: ${profileSubmissionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`
                      : `Today's date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Skills */}
            <div className="mt-6 w-full">
              <label className="block text-sm font-medium mb-2">
                Key Skills <span className="text-red-500">*</span>
              </label>

              {/* Skill Input with Suggestions and Tags Inside */}
              <div className="relative w-full">
                <div className="flex flex-wrap items-center gap-1 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[42px]">
                  {/* Display selected skills as clean tags without quotes */}
                  {newProfile.keySkills.map((skill, index) => (
                    <span
                      key={`skill-tag-${index}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {/* Show skill without quotes */}
                      {skill.replace(/["']/g, '')}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-blue-600 focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}

                  {/* Input field for new skills */}
                  <input
                    type="text"
                    value={skillInput}
                    onChange={handleAddSkillInputChange}
                    onKeyDown={handleAddSkillKeyDown}
                    placeholder={newProfile.keySkills.length === 0 ? "Enter a skill and press Enter" : ""}
                    className="flex-1 min-w-[150px] outline-none bg-transparent"
                  />
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (skillInput.trim()) {
                      handleAddSkillToProfile();
                    }
                  }}
                  disabled={!skillInput.trim()}
                  className="absolute right-2 top-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Add
                </button>

                {/* Add Skill Suggestions Dropdown */}
                {showAddSkillSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredAddSkillSuggestions.length > 0 ? (
                      filteredAddSkillSuggestions.map((skill, index) => (
                        <div
                          key={`add-skill-suggestion-${skill}`}
                          onClick={() => {
                            handleAddSkillToProfile(skill);
                          }}
                          className={`px-3 py-2 cursor-pointer text-sm ${index === selectedAddSkillSuggestionIndex
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-blue-50'
                            }`}
                        >
                          {skill}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center">
                        <p className="text-sm text-red-500 font-medium mb-2">
                          ✗ "{skillInput.trim()}" is not available
                        </p>
                        <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                          <span className="font-semibold">Only these skills can be added:</span><br />
                          {skillSuggestions.slice(0, 5).join(', ')}
                          {skillSuggestions.length > 5 && '...'}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Please select from the existing skills
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Skills Error */}
              {formErrors.keySkills && (
                <p className="text-red-500 text-xs mt-2">{formErrors.keySkills}</p>
              )}
            </div>

            {/* PDF Upload */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Upload Resume (PDF)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-500">
                      {pdfFile ? pdfFile.name : "Click to upload PDF"}
                    </p>
                  </div>
                </label>
                {pdfFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setNewProfile(prev => ({ ...prev, resumePdf: null }));
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
                onClick={() => setShowAddProfile(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={submitLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Profile
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

export default AddProfileModal;
