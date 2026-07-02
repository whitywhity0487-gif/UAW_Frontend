import React from 'react';
import { Filter, Loader, Trash2, Plus, Save } from 'lucide-react';

const SkillsSidebar = ({
  skillsLoading,
  handleSkillSelect,
  selectedSkill,
  totalSkills,
  skills,
  skillCounts,
  filterLoading,
  userRole,
  handleDeleteSkill,
  showAddSkillInput,
  newSkillName,
  setNewSkillName,
  handleAddSkillToDatabase,
  setShowAddSkillInput
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Skills Filter</h3>
        <Filter size={18} className="text-gray-500" />
      </div>

      {skillsLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
          <button
            onClick={() => handleSkillSelect("All")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
              selectedSkill === "All"
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "hover:bg-gray-100"
            }`}
          >
            <span className="font-medium">All Skills</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              {totalSkills}
            </span>
          </button>

          {skills.length > 0 ? (
            <>
              {/* Skills List */}
              {skills.map((skill) => {
                const count = skillCounts[skill.name] || 0;
                return (
                  <div key={skill.name} className="flex items-center gap-1">
                    <button
                      onClick={() => handleSkillSelect(skill.name)}
                      disabled={filterLoading}
                      className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
                        selectedSkill === skill.name
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "hover:bg-gray-100"
                      } ${filterLoading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <span className="truncate">{skill.name}</span>
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        {count}
                      </span>
                    </button>

                    {/* Delete button - only show for admin users */}
                    {userRole && userRole.toLowerCase() === "admin" && (
                      <button
                        onClick={(e) => handleDeleteSkill(skill.name, e)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete skill"
                        disabled={skillsLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add Skill Section - only show for admin users */}
              {userRole && userRole.toLowerCase() === "admin" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {showAddSkillInput ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="Enter new skill name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddSkillToDatabase();
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddSkillToDatabase}
                          disabled={!newSkillName.trim() || skillsLoading}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setShowAddSkillInput(false);
                            setNewSkillName("");
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddSkillInput(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer"
                    >
                      <Plus size={16} />
                      Add New Skill
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">No skills found</p>
          )}
        </div>
      )}
    </>
  );
};

export default SkillsSidebar;
