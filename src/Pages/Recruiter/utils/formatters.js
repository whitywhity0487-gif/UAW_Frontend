export const parseKeySkills = (skills) => {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills.filter(s => s && s.trim());
  }

  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => s && s.trim());
      }
      if (typeof parsed === 'string') {
        return [parsed.trim()];
      }
    } catch (e) {
      // Not JSON, fallback to comma splitting
    }

    if (skills.includes(',')) {
      return skills.split(',').map(s => s.trim()).filter(s => s);
    }

    const trimmed = skills.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const getVisaBorderColor = (visaType) => {
  if (!visaType || visaType === "NA") return "border-gray-200";
  if (visaType.toUpperCase() === "CHINA") {
    return "border-blue-500 border-2";
  }
  return "border-red-500 border-2";
};
