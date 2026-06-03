export const processCandidate = (candidate) => {
  if (!candidate) return null;

  let actualCanId = candidate.Can_ID || candidate.canId;

  if (actualCanId && typeof actualCanId === 'number') {
    actualCanId = Math.floor(actualCanId);
  } else if (actualCanId && typeof actualCanId === 'string') {
    actualCanId = parseInt(actualCanId);
  }

  const getSkills = () => {
    const skillsSource = candidate['Key Skills'] ||
      candidate.keySkills ||
      candidate.skills ||
      candidate['key_skills'] ||
      [];

    if (Array.isArray(skillsSource)) {
      return skillsSource.filter(s => s && s.trim());
    }

    if (typeof skillsSource === 'string') {
      try {
        const parsed = JSON.parse(skillsSource);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => s && s.trim());
        }
        if (typeof parsed === 'string') {
          return parsed.split(',').map(s => s.trim()).filter(s => s);
        }
      } catch (e) {
        return skillsSource.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    if (typeof skillsSource === 'object' && skillsSource !== null) {
      if (skillsSource.low !== undefined || Array.isArray(skillsSource)) {
        return Object.values(skillsSource).filter(s => s && s.trim && s.trim());
      }
      if (Object.keys(skillsSource).length > 0) {
        if (skillsSource.skills) {
          // Simplification to avoid recursive reference
          return Object.values(skillsSource.skills).filter(s => s && typeof s === 'string');
        }
        return Object.values(skillsSource).filter(s => s && typeof s === 'string');
      }
    }

    return [];
  };

  const keySkills = getSkills();
  const numericId = actualCanId ? Number(actualCanId) : null;

  const processed = {
    canId: numericId,
    actualId: numericId,
    id: numericId,
    name: candidate['Candidate Name'] || candidate.name || '',
    email: candidate.Email || candidate.email || '',
    mobile: candidate['Mobile No'] || candidate.mobile || '',
    experience: candidate.Experience || candidate.experience || '',
    currentOrg: candidate['Current Org'] || candidate.currentOrg || '',
    currentCTC: candidate['Current CTC'] || candidate.currentCTC || '',
    expectedCTC: candidate['Expected CTC'] || candidate.expectedCTC || '',
    noticePeriod: candidate['Notice Period in days'] || candidate.noticePeriod || '',
    profileSourcedBy: candidate['Profiles sourced by'] || candidate.profileSourcedBy || '',
    clientName: candidate['Client Name'] || candidate.clientName || '',
    profileSubmissionDate: candidate['Profile submission date'] || candidate.profileSubmissionDate || '',
    visaType: candidate['Visa type'] || candidate.visaType || 'NA',
    visaValidityDate: candidate['Visa Validity Date'] || candidate.visaValidityDate || '',
    resumePath: candidate.resumePath || '',
    googleDriveFileId: candidate.googleDriveFileId || '',
    googleDriveViewLink: candidate.googleDriveViewLink || '',
    googleDriveDownloadLink: candidate.googleDriveDownloadLink || '',
    keySkills: keySkills,
    isInProgress: candidate.isInProgress === true || candidate.isInProgress === 'true' || false,
    experienceNum: parseFloat(candidate.Experience || candidate.experience) || 0
  };

  return processed;
};

export const filterOutRejectedCandidates = (candidatesList, demandId, selectedCandidates = []) => {
  if (!demandId) return candidatesList;

  const REJECTED_STATUSES = [
    'Offer Decline',
    'Interview Reject',
    'Client Interview Reject',
    'Screening Reject',
    'Client Screening Reject'
  ];

  const filtered = candidatesList.filter(candidate => {
    const selectedCandidate = selectedCandidates.find(
      sc =>
        String(sc.id) === String(candidate.id) &&
        String(sc.demandId) === String(demandId)
    );

    if (selectedCandidate && REJECTED_STATUSES.includes(selectedCandidate.status)) {
      return false;
    }
    return true;
  });

  return filtered;
};
