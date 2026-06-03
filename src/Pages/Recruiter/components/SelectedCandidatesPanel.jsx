import React from 'react';
import { Users, Clock, XCircle, Eye } from 'lucide-react';

const SelectedCandidatesPanel = ({
  selectedCandidates,
  candidateInProgress,
  handleSelectCandidate,
  handleRemoveCandidate,
  toggleSelectedView,
  showSelectedView
}) => {
  return (
    <div className="mt-6 pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Selected Candidates</h4>
        <Users size={16} className="text-gray-500" />
      </div>
      
      {selectedCandidates.length === 0 ? (
        <p className="text-gray-500 text-sm">No candidates selected</p>
      ) : (
        <>
          <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
            {/* In selected candidates panel */}
            {selectedCandidates.map(candidate => (
              <div key={`selected-${candidate.id}`} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{candidate.name}</p>
                  <p className="text-xs text-gray-500 truncate">{candidate.currentOrg}</p>
                  
                  {/* Check if candidate is in progress */}
                  {(() => {
                    const activeStatusesList = [
                      'In Progress',
                      'Pending Screening',
                      'Pending Interview',
                      'Pending Client Screening',
                      'Pending Client Interview',
                      'Pending Offer',
                      'Pending Joinee'
                    ];

                    const selectedCandidate = selectedCandidates.find(sc => sc.id === candidate.id);
                    const candidateStatus = selectedCandidate?.status;

                    const shouldShowInProgress = candidate.isInProgress === true ||
                      candidateInProgress[candidate.id] === true ||
                      (candidateStatus && activeStatusesList.includes(candidateStatus));

                    if (shouldShowInProgress) {
                      return (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium flex items-center gap-1">
                          <Clock size={14} />
                          In Progress
                        </span>
                      );
                    } else if (selectedCandidate) {
                      return (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                          {selectedCandidate.status || 'Selected'}
                        </span>
                      );
                    } else {
                      return (
                        <button
                          onClick={(e) => handleSelectCandidate(candidate, e)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium"
                        >
                          Select
                        </button>
                      );
                    }
                  })()}
                </div>
                <button
                  onClick={(e) => handleRemoveCandidate(candidate.id, e)}
                  className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={toggleSelectedView}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Eye size={16} />
            {showSelectedView ? "View All Candidates" : `View Selected (${selectedCandidates.length})`}
          </button>
        </>
      )}
    </div>
  );
};

export default SelectedCandidatesPanel;
