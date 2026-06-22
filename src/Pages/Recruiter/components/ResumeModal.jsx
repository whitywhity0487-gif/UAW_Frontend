import React from 'react';
import { X } from 'lucide-react';

// Convert Google Drive view/share links to embeddable preview links
const getEmbeddableUrl = (url) => {
  if (!url) return url;
  
  if (url.includes('drive.google.com')) {
    // Extract file ID from various Google Drive URL formats
    let fileId = null;
    
    // Format: /file/d/{fileId}/view or /file/d/{fileId}/edit etc.
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
      fileId = fileMatch[1];
    }
    
    // Format: ?id={fileId} or &id={fileId}
    if (!fileId) {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        fileId = idMatch[1];
      }
    }
    
    // Format: /open?id={fileId}
    if (!fileId) {
      const openMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
      if (openMatch) {
        fileId = openMatch[1];
      }
    }
    
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  return url;
};

const ResumeModal = ({
  showResumeModal,
  selectedResumeUrl,
  setShowResumeModal,
  setSelectedResumeUrl
}) => {
  if (!showResumeModal || !selectedResumeUrl) return null;

  const embedUrl = getEmbeddableUrl(selectedResumeUrl);

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
          <iframe
            src={embedUrl}
            className="w-full h-full"
            title="Resume Viewer"
            allow="autoplay"
          />
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
