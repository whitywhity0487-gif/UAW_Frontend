import { useState, useCallback } from 'react';
import { candidateService } from '../services/candidateService';
import { processCandidate, filterOutRejectedCandidates } from '../utils/candidateHelpers';

export const useCandidates = (setError) => {
  const [candidates, setCandidates] = useState([]);
  const [displayedCandidates, setDisplayedCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [candidateClientStatus, setCandidateClientStatus] = useState({});
  const [candidateInProgress, setCandidateInProgress] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  const fetchAllCandidates = useCallback(async () => {
    try {
      setLoading(true);
      if (setError) setError(null);

      // First fetch joined candidate IDs
      const joinedIds = await candidateService.getJoinedCandidateIds();
      const response = await candidateService.getAllCandidates();

      if (response.success) {
        let processedCandidates = response.data
          .map(processCandidate)
          .filter(c => c !== null);

        // FILTER OUT JOINED CANDIDATES
        const activeCandidates = processedCandidates.filter(
          candidate => !joinedIds.has(candidate.id)
        );

        activeCandidates.sort((a, b) => (b.id || 0) - (a.id || 0));

        setCandidates(activeCandidates);

        // Filter out rejected candidates for initial display
        const filteredCandidates = filterOutRejectedCandidates(activeCandidates);
        setDisplayedCandidates(filteredCandidates);
        setCurrentPage(1);

        // Initialize candidateInProgress state
        const initialProgressMap = {};
        activeCandidates.forEach(candidate => {
          if (candidate.isInProgress === true) {
            initialProgressMap[candidate.id] = true;
          }
        });
        setCandidateInProgress(initialProgressMap);
        
      } else {
        if (setError) setError("Failed to fetch candidates: " + (response.message || "Unknown error"));
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      if (setError) setError(err.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [setError]);

  return {
    candidates,
    setCandidates,
    displayedCandidates,
    setDisplayedCandidates,
    loading,
    setLoading,
    candidateClientStatus,
    setCandidateClientStatus,
    candidateInProgress,
    setCandidateInProgress,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    fetchAllCandidates
  };
};
