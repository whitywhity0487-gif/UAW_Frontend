import React from 'react';
import { X, UserCircle, User, Mail, Phone, Briefcase, Building2, Award, DollarSign, Clock, Globe, CalendarDays, FileCheck, Code, FileText } from 'lucide-react';
import { parseKeySkills, formatDate } from '../utils/formatters';

const CandidateDetailsModal = ({
  selectedCandidate,
  setShowCandidateDetails,
  setSelectedCandidate,
  setShowResumeModal,
  setSelectedResumeUrl
}) => {
  if (!selectedCandidate) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold">Candidate Profile</h3>
              <p className="text-gray-500 text-sm">Complete details of {selectedCandidate.name}</p>
            </div>
            <button
              onClick={() => {
                setShowCandidateDetails(false);
                setSelectedCandidate(null);
              }}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Candidate Details */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <UserCircle size={18} />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="font-medium">{selectedCandidate.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{selectedCandidate.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="font-medium">{selectedCandidate.mobile}</p>
                  </div>
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
                <div className="flex items-start gap-2">
                  <Building2 size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Current Organization</p>
                    <p className="font-medium">{selectedCandidate.currentOrg || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Award size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-medium">{selectedCandidate.experience || "N/A"} years</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Current CTC</p>
                    <p className="font-medium">{selectedCandidate.currentCTC || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Expected CTC</p>
                    <p className="font-medium">{selectedCandidate.expectedCTC || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Notice Period</p>
                    <p className="font-medium">{selectedCandidate.noticePeriod || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Visa Type</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium mt-1 ${selectedCandidate.visaType === "China"
                      ? "bg-blue-100 text-blue-800"
                      : selectedCandidate.visaType === "NA"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                      }`}>
                      {selectedCandidate.visaType || "NA"}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Visa Validity Date</p>
                    <p className="font-medium">
                      {selectedCandidate.visaValidityDate
                        ? new Date(selectedCandidate.visaValidityDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : "N/A"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sourcing Information */}
            <div className="bg-purple-50 p-4 rounded-xl">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <FileCheck size={18} />
                Sourcing Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Profile Sourced By</p>
                    <p className="font-medium">{selectedCandidate.profileSourcedBy || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Client Name</p>
                    <p className="font-medium">{selectedCandidate.clientName || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Profile Submission Date</p>
                    <p className="font-medium">{formatDate(selectedCandidate.profileSubmissionDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-yellow-50 p-4 rounded-xl">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <Code size={18} />
                Key Skills
              </h4>
              {(() => {
                let skillsArray = parseKeySkills(selectedCandidate.keySkills);
                skillsArray = skillsArray.map(skill =>
                  typeof skill === 'string' ? skill.replace(/["']/g, '').trim() : skill
                ).filter(skill => skill);

                if (skillsArray.length > 0) {
                  return (
                    <p className="text-gray-700">
                      {skillsArray.join(', ')}
                    </p>
                  );
                } else {
                  return <p className="text-gray-500">No skills listed</p>;
                }
              })()}
            </div>

            {/* Resume & Actions */}
            <div className="flex gap-3 justify-end mt-4">
              {selectedCandidate.resumePath && (
                <button
                  onClick={() => {
                    setSelectedResumeUrl(`https://uaw-backend.vercel.app${selectedCandidate.resumePath}`);
                    setShowResumeModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <FileText size={16} />
                  View Resume
                </button>
              )}
              <button
                onClick={() => {
                  setShowCandidateDetails(false);
                  setSelectedCandidate(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailsModal;
