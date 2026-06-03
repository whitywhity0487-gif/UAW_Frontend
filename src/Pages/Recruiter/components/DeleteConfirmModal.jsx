import React from 'react';
import { X, Loader, Trash2 } from 'lucide-react';

const DeleteConfirmModal = ({
  showDeleteConfirm,
  setShowDeleteConfirm,
  deletingCandidateName,
  setDeletingCandidateId,
  setDeletingCandidateName,
  error,
  deleteLoading,
  handleConfirmDelete
}) => {
  if (!showDeleteConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-red-600">Confirm Delete</h3>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingCandidateId(null);
                setDeletingCandidateName("");
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-bold">{deletingCandidateName}</span>'s profile?
            </p>
            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingCandidateId(null);
                setDeletingCandidateName("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
