import React from 'react';
import { X } from 'lucide-react';

const SearchFiltersPopup = ({
  showSearchPopup,
  setShowSearchPopup,
  primarySkillInput,
  handlePrimarySkillInputChange,
  handlePrimarySkillKeyDown,
  showPrimarySuggestions,
  filteredPrimarySuggestions,
  selectPrimarySkill,
  selectedPrimarySuggestionIndex,
  secondarySkillInput,
  handleSecondarySkillInputChange,
  handleSecondarySkillKeyDown,
  showSecondarySuggestions,
  filteredSecondarySuggestions,
  selectSecondarySkill,
  selectedSecondarySuggestionIndex,
  searchFilters,
  handleSearchFilterChange,
  resetSearchFilters,
  applySearchFilters
}) => {
  if (!showSearchPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold">Search Filters</h3>
              <p className="text-gray-500 text-sm">Type and select skills (use comma for multiple)</p>
            </div>
            <button
              onClick={() => setShowSearchPopup(false)}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Primary Skills Filter */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2">
                Primary Skills (comma separated)
              </label>
              <input
                type="text"
                value={primarySkillInput}
                onChange={handlePrimarySkillInputChange}
                onKeyDown={handlePrimarySkillKeyDown}
                placeholder="e.g., Python, Java, React"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Primary Skills Suggestions Dropdown */}
              {showPrimarySuggestions && filteredPrimarySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredPrimarySuggestions.map((skill, index) => (
                    <div
                      key={`primary-suggestion-${skill}`}
                      onClick={() => {
                        selectPrimarySkill(skill);
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm ${index === selectedPrimarySuggestionIndex
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-blue-50'
                        }`}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Secondary Skills Filter */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2">
                Secondary Skills (comma separated)
              </label>
              <input
                type="text"
                value={secondarySkillInput}
                onChange={handleSecondarySkillInputChange}
                onKeyDown={handleSecondarySkillKeyDown}
                placeholder="e.g., AWS, Docker, Kubernetes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Secondary Skills Suggestions Dropdown */}
              {showSecondarySuggestions && filteredSecondarySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSecondarySuggestions.map((skill, index) => (
                    <div
                      key={`secondary-suggestion-${skill}`}
                      onClick={() => {
                        selectSecondarySkill(skill);
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm ${index === selectedSecondarySuggestionIndex
                        ? 'bg-green-100 text-green-700'
                        : 'hover:bg-green-50'
                        }`}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Experience Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Experience Range (years)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    name="experienceMin"
                    value={searchFilters.experienceMin}
                    onChange={handleSearchFilterChange}
                    placeholder="Min"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="experienceMax"
                    value={searchFilters.experienceMax}
                    onChange={handleSearchFilterChange}
                    placeholder="Max"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={resetSearchFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applySearchFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFiltersPopup;
