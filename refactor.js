const fs = require('fs');

let content = fs.readFileSync('src/Pages/Recruiter.jsx', 'utf8');

// 1. Add import
content = content.replace(
  'import { useVisaTypes } from "./Recruiter/hooks/useVisaTypes";',
  'import { useVisaTypes } from "./Recruiter/hooks/useVisaTypes";\nimport { useSkills } from "./Recruiter/hooks/useSkills";'
);

// 2. Replace state definitions
const stateRegex = /\/\/ State for skills from API[\s\S]*?\/\/ Skill suggestions state\s+const \[skillSuggestions, setSkillSuggestions\] = useState\(\[\]\);/m;
const stateReplacement = `// Use custom hook for skills
  const {
    skills,
    skillCounts,
    totalSkills,
    skillsLoading,
    skillSuggestions,
    newSkillName,
    setNewSkillName,
    showAddSkillInput,
    setShowAddSkillInput,
    fetchSkillsData,
    updateSkillCounts,
    handleAddSkillToDatabase,
    handleDeleteSkill
  } = useSkills(setSuccessMessage, setError);

  // Search filter state
  const [searchFilters, setSearchFilters] = useState({
    primarySkills: [],
    secondarySkills: [],
    experienceMin: "",
    experienceMax: "",
    location: ""
  });`;

content = content.replace(stateRegex, stateReplacement);

// 3. Remove updateSkillCounts
const updateSkillCountsRegex = /\/\/ Update skill counts based on candidates[\s\S]*?setSkillCounts\(counts\);\n  };/m;
content = content.replace(updateSkillCountsRegex, '');

// 4. Remove fetchSkillsData
const fetchSkillsDataRegex = /\/\/ Re-run when URL changes or candidates load\s+const fetchSkillsData = async \(\) => \{[\s\S]*?setSkillsLoading\(false\);\n    \}\n  \};/m;
content = content.replace(fetchSkillsDataRegex, '');

// 5. Remove handleAddSkillToDatabase, handleDeleteSkill, and newSkillName state
const handleAddSkillRegex = /\/\/ Handle adding new skill to database \(for sidebar admin\)[\s\S]*?const \[showAddSkillInput, setShowAddSkillInput\] = useState\(false\);/m;
content = content.replace(handleAddSkillRegex, '');

fs.writeFileSync('src/Pages/Recruiter.jsx', content);
console.log('Done refactoring Recruiter.jsx');
