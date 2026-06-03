import { useState, useCallback } from 'react';

export const useCandidateFilters = (candidates, setDisplayedCandidates) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All");

  const [searchFilters, setSearchFilters] = useState({
    primarySkills: [],
    secondarySkills: [],
    experienceMin: "",
    experienceMax: "",
    location: ""
  });

  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  // Search popup skill suggestions
  const [showPrimarySuggestions, setShowPrimarySuggestions] = useState(false);
  const [showSecondarySuggestions, setShowSecondarySuggestions] = useState(false);
  const [filteredPrimarySuggestions, setFilteredPrimarySuggestions] = useState([]);
  const [filteredSecondarySuggestions, setFilteredSecondarySuggestions] = useState([]);
  const [primarySkillInput, setPrimarySkillInput] = useState("");
  const [secondarySkillInput, setSecondarySkillInput] = useState("");
  const [selectedPrimarySuggestionIndex, setSelectedPrimarySuggestionIndex] = useState(0);
  const [selectedSecondarySuggestionIndex, setSelectedSecondarySuggestionIndex] = useState(0);

  const filterCandidatesBySearch = (displayedCandidates) => {
    if (!displayedCandidates) return [];
    if (!searchTerm.trim()) {
      return displayedCandidates;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return displayedCandidates.filter(candidate => {
      return (
        (candidate.name && candidate.name.toLowerCase().includes(searchLower)) ||
        (candidate.email && candidate.email.toLowerCase().includes(searchLower)) ||
        (candidate.currentOrg && candidate.currentOrg.toLowerCase().includes(searchLower)) ||
        (candidate.clientName && candidate.clientName.toLowerCase().includes(searchLower)) ||
        (candidate.mobile && candidate.mobile.includes(searchLower)) ||
        (candidate.keySkills && Array.isArray(candidate.keySkills) &&
          candidate.keySkills.some(skill => skill && skill.toLowerCase().includes(searchLower)))
      );
    });
  };

  const handleClearFilters = useCallback(() => {
    setSearchFilters({
      primarySkills: [],
      secondarySkills: [],
      experienceMin: "",
      experienceMax: "",
      location: ""
    });
    setPrimarySkillInput("");
    setSecondarySkillInput("");
    setDisplayedCandidates(candidates);
    setSelectedSkill("All");
  }, [candidates, setDisplayedCandidates]);

  return {
    searchTerm,
    setSearchTerm,
    selectedSkill,
    setSelectedSkill,
    searchFilters,
    setSearchFilters,
    showSearchFilters,
    setShowSearchFilters,
    filterLoading,
    setFilterLoading,
    showPrimarySuggestions,
    setShowPrimarySuggestions,
    showSecondarySuggestions,
    setShowSecondarySuggestions,
    filteredPrimarySuggestions,
    setFilteredPrimarySuggestions,
    filteredSecondarySuggestions,
    setFilteredSecondarySuggestions,
    primarySkillInput,
    setPrimarySkillInput,
    secondarySkillInput,
    setSecondarySkillInput,
    selectedPrimarySuggestionIndex,
    setSelectedPrimarySuggestionIndex,
    selectedSecondarySuggestionIndex,
    setSelectedSecondarySuggestionIndex,
    filterCandidatesBySearch,
    handleClearFilters
  };
};
