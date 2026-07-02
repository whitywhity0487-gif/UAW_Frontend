import React from 'react';
import { Phone, Briefcase, Building2, Clock, Edit2, Trash2, Mail, MessageCircle, FileText } from 'lucide-react';
import { getVisaBorderColor, parseKeySkills } from '../utils/formatters';

const CandidateCard = ({
  candidate,
  userRole,
  searchParams,
  selectedCandidates,
  candidateInProgress,
  handleViewDetails,
  handleEditClick,
  handleDeleteClick,
  handleSelectCandidate,
  handleSendEmail,
  handleSendWhatsApp,
  handleViewResume
}) => {
  return (
    <div
      className={`border rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer ${getVisaBorderColor(candidate.visaType)}`}
      onClick={(e) => handleViewDetails(candidate, e)}
    >
      {/* Candidate Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg truncate hover:text-blue-600">{candidate.name?.replace(/[^\x20-\x7E]/g, ' ')}</h4>
          <p className="text-gray-600 text-sm truncate">{candidate.currentOrg?.replace(/[^\x20-\x7E]/g, ' ')}</p>
        </div>

        {/* Visa Type Badge */}
        {candidate.visaType && candidate.visaType !== "NA" && (
          <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${candidate.visaType === "China"
            ? "bg-blue-100 text-blue-800"
            : "bg-red-100 text-red-800"
            }`}>
            {candidate.visaType}
          </span>
        )}

        {/* Action section */}
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button
            onClick={(e) => handleEditClick(candidate, e)}
            className="p-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
            title="Edit Candidate"
          >
            <Edit2 size={16} />
          </button>

          {userRole === 'Admin' && (
            <button
              onClick={(e) => handleDeleteClick(candidate, e)}
              className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
              title="Delete Candidate"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Status logic */}
          {(() => {
            const demandId = searchParams.get('demandId');
            const selectedCandidate = selectedCandidates.find(sc => sc.id === candidate.id);
            const candidateStatus = selectedCandidate?.status;

            const activeStatuses = [
              'In Progress',
              'Pending Screening',
              'Pending Interview',
              'Pending Client Screening',
              'Pending Client Interview',
              'Pending Offer',
              'Pending Joinee'
            ];

            const hasActiveStatus = candidateStatus && activeStatuses.includes(candidateStatus);
            const isInProgressFlag = candidateInProgress[candidate.id] === true || candidate.isInProgress === true;

            if (hasActiveStatus || isInProgressFlag) {
              return (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium flex items-center gap-1">
                  <Clock size={14} />
                  In Progress
                </span>
              );
            } else if (selectedCandidate) {
              return (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                  {candidateStatus || 'Selected'}
                </span>
              );
            } else {
              return (
                <button
                  onClick={(e) => handleSelectCandidate(candidate, e)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium cursor-pointer"
                >
                  Select
                </button>
              );
            }
          })()}
        </div>
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

      {/* Skills */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Key Skills:</p>
        <div className="flex flex-wrap gap-2">
          {(() => {
            let skillsArray = parseKeySkills(candidate.keySkills);
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
};

export default CandidateCard;
