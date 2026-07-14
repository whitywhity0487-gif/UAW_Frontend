import React from 'react';
import toast from 'react-hot-toast';

export const confirmAction = (message, onConfirm) => {
  toast((t) => (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-900">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition cursor-pointer border-none"
        >
          No, Cancel
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition cursor-pointer border-none"
        >
          Yes, Confirm
        </button>
      </div>
    </div>
  ), {
    id: 'confirm-action',
    duration: Infinity,
    position: 'top-center',
    style: { minWidth: '300px' }
  });
};
