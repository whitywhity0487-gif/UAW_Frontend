import { useState, useCallback } from 'react';
import axios from 'axios';

export const useSkills = (setSuccessMessage, setError) => {
  const [skills, setSkills] = useState([]);
  const [skillCounts, setSkillCounts] = useState({});
  const [totalSkills, setTotalSkills] = useState(0);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [showAddSkillInput, setShowAddSkillInput] = useState(false);

  // Fetch skills from API
  const fetchSkillsData = useCallback(async () => {
    try {
      setSkillsLoading(true);
      const response = await axios.get('http://localhost:5000/api/skillsmatch/skills');

      if (response.data.success && response.data.data) {
        let skillsList = response.data.data;
        
        // Alphabetical order
        skillsList.sort((a, b) => a.name.localeCompare(b.name));

        setSkills(skillsList);
        setTotalSkills(response.data.totalSkills || skillsList.length);

        const countsFromApi = {};
        skillsList.forEach(skill => {
          countsFromApi[skill.name] = skill.count || 0;
        });

        setSkillCounts(countsFromApi);

        const allSkills = skillsList.map(item => item.name);
        setSkillSuggestions(allSkills.sort());
      } else {
        setSkills([]);
        setTotalSkills(0);
        setSkillSuggestions([]);
        setSkillCounts({});
      }
    } catch (err) {
      console.error('Error fetching skills data:', err);
      setSkills([]);
      setTotalSkills(0);
      setSkillSuggestions([]);
      setSkillCounts({});
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  // Update skill counts based on candidates
  const updateSkillCounts = useCallback((candidatesList) => {
    if (Object.keys(skillCounts).length > 0) {
      return;
    }

    const counts = {};
    const skillMap = new Map();

    skills.forEach(skill => {
      counts[skill.name] = 0;
      skillMap.set(skill.name.toLowerCase(), skill.name);
    });

    candidatesList.forEach(candidate => {
      if (candidate.keySkills && Array.isArray(candidate.keySkills)) {
        candidate.keySkills.forEach(skill => {
          if (skill && typeof skill === 'string') {
            const trimmedSkill = skill.trim();
            if (trimmedSkill) {
              const lowerSkill = trimmedSkill.toLowerCase();
              const matchingSkillName = skillMap.get(lowerSkill);

              if (matchingSkillName) {
                counts[matchingSkillName] = (counts[matchingSkillName] || 0) + 1;
              } else {
                counts[trimmedSkill] = (counts[trimmedSkill] || 0) + 1;
              }
            }
          }
        });
      }
    });

    setSkillCounts(counts);
  }, [skills, skillCounts]);

  // Handle adding new skill to database (Admin only)
  const handleAddSkillToDatabase = async () => {
    if (!newSkillName.trim()) return;

    try {
      setSkillsLoading(true);
      const response = await axios.post('http://localhost:5000/api/skills', {
        name: newSkillName.trim()
      });

      if (response.data.success) {
        if (setSuccessMessage) {
          setSuccessMessage(`Skill "${newSkillName}" added successfully!`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }
        setShowAddSkillInput(false);
        setNewSkillName("");
        await fetchSkillsData(); // Refresh skills list
      }
    } catch (err) {
      console.error('Error adding skill:', err);
      if (setError) {
        setError(err.response?.data?.message || "Failed to add skill");
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setSkillsLoading(false);
    }
  };

  // Handle deleting a skill from database (Admin only)
  const handleDeleteSkill = async (skillName, e) => {
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete the skill "${skillName}"?`)) {
      return;
    }

    try {
      setSkillsLoading(true);
      const response = await axios.delete(`http://localhost:5000/api/skills/${encodeURIComponent(skillName)}`);

      if (response.data.success) {
        await fetchSkillsData();
        if (setSuccessMessage) {
          setSuccessMessage(`Skill "${skillName}" deleted successfully!`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
      if (setError) {
        setError(err.response?.data?.message || "Failed to delete skill");
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setSkillsLoading(false);
    }
  };

  return {
    skills,
    setSkills, // Exporting just in case it's manually needed
    skillCounts,
    setSkillCounts, // Exporting for manual overrides
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
  };
};
