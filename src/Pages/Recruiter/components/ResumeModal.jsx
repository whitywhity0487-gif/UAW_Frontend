import React from 'react';
import { X } from 'lucide-react';

const ResumeModal = ({
  showResumeModal,
  selectedResumeUrl,
  setShowResumeModal,
  setSelectedResumeUrl
}) => {
  if (!showResumeModal || !selectedResumeUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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
          {selectedResumeUrl.includes('drive.google.com') ? (
            <iframe
              src={selectedResumeUrl}
              className="w-full h-full"
              title="Resume Viewer"
              allow="autoplay"
            />
          ) : (
            <iframe
              src={selectedResumeUrl}
              className="w-full h-full"
              title="Resume Viewer"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
