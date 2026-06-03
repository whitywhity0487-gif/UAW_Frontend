import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  setCurrentPage, 
  goToPreviousPage, 
  goToNextPage,
  showInput = true
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="flex items-center gap-2">
        {showInput ? (
          <>
            <span className="text-sm text-gray-500">Page</span>
            <input
              key={currentPage}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={currentPage}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  } else {
                    e.target.value = currentPage;
                  }
                }
              }}
              onBlur={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages && page !== currentPage) {
                  setCurrentPage(page);
                } else {
                  e.target.value = currentPage;
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Page"
            />
            <span className="text-sm text-gray-500">of {totalPages}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
