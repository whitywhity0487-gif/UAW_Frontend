import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../../config/constants.js';

export const useSelectedCandidates = (setCandidateInProgress, setSuccessMessage, setError) => {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSelectedView, setShowSelectedView] = useState(false);
  const [selectedViewPage, setSelectedViewPage] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleSelectCandidate = async (candidate, e) => {
    e.stopPropagation();

    const demandId = searchParams.get('demandId');

    if (demandId) {
      const isAlreadySelected = selectedCandidates.some(c => c.id === candidate.id);

      if (!isAlreadySelected) {
        try {
          const user = JSON.parse(localStorage.getItem("user")) || {};
          const selectedByName = user.username || user.name || 'Unknown';

          await axios.put(
            `${API_BASE_URL}/api/candidates/${candidate.id}/progress`,
            { isInProgress: true }
          );

          setCandidateInProgress(prev => ({
            ...prev,
            [candidate.id]: true
          }));

          setSelectedCandidates(prev => [...prev, {
            ...candidate,
            status: 'Pending Screening'
          }]);

          const response = await axios.post(
            `${API_BASE_URL}/api/selected-candidates/${demandId}`,
            {
              candidates: [{
                canId: candidate.canId || candidate.actualId || candidate.id,
                status: 'Pending Screening'
              }],
              selectedBy: selectedByName
            }
          );

          if (response.data.success) {
            setSuccessMessage(`✅ ${candidate.name} added to demand and marked as In Progress!`);
            setTimeout(() => setSuccessMessage(""), 2000);
          }

        } catch (err) {
          console.error('Error saving candidate:', err);
          setCandidateInProgress(prev => ({
            ...prev,
            [candidate.id]: false
          }));
          setSelectedCandidates(prev => prev.filter(c => c.id !== candidate.id));
          setError(`Failed to save ${candidate.name}`);
          setTimeout(() => setError(null), 3000);
        }
      }
    } else {
      sessionStorage.setItem('selectedCandidate', JSON.stringify({
        ...candidate,
        selectedAt: new Date().toISOString()
      }));
      navigate('/demand');
    }
  };

  const handleRemoveCandidate = async (candidateId, e) => {
    if (e) e.stopPropagation();
    if (!candidateId) return;

    const candidate = selectedCandidates.find(c => c.id === candidateId);

    try {
      const demandId = searchParams.get('demandId');

      if (!demandId) {
        toast.error("Demand ID not found");
        return;
      }

      await axios.put(
        `${API_BASE_URL}/api/candidates/${candidateId}/progress`,
        { isInProgress: false }
      );

      setCandidateInProgress(prev => ({
        ...prev,
        [candidateId]: false
      }));

      setSelectedCandidates(prev => prev.filter(c => c.id !== candidateId));

      setSuccessMessage(`Removing ${candidate?.name || 'candidate'}...`);

      await axios.delete(`${API_BASE_URL}/api/selected-candidates/${demandId}/${candidateId}`);

      setSuccessMessage(`✅ ${candidate?.name || 'Candidate'} removed from demand`);
      setTimeout(() => setSuccessMessage(""), 2000);

    } catch (err) {
      console.error('Error removing candidate:', err);
      setError("Failed to remove candidate");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSubmitSelectedCandidates = async () => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate");
      return;
    }

    try {
      setSubmitLoading(true);

      const demandId = searchParams.get('demandId');

      if (!demandId) {
        toast.error("Demand ID not found");
        return;
      }

      console.log("Selected candidates with Can_IDs:", selectedCandidates.map(c => ({
        name: c.name,
        canId: c.canId,
        id: c.id
      })));

      const selectedData = {
        candidates: selectedCandidates.map(c => ({
          canId: c.canId || c.actualId || c.id,
          name: c.name,
          email: c.email,
          mobile: c.mobile,
          experience: c.experience,
          currentOrg: c.currentOrg,
          currentCTC: c.currentCTC,
          expectedCTC: c.expectedCTC,
          noticePeriod: c.noticePeriod,
          profileSourcedBy: c.profileSourcedBy,
          clientName: c.clientName,
          profileSubmissionDate: c.profileSubmissionDate,
          visaType: c.visaType,
          resumePath: c.resumePath,
          googleDriveViewLink: c.googleDriveViewLink,
          keySkills: c.keySkills,
          selectedAt: new Date().toISOString(),
          status: 'Selected'
        })),
        selectedBy: JSON.parse(localStorage.getItem("user"))?.name || JSON.parse(localStorage.getItem("user"))?.email || 'Unknown'
      };

      console.log(`Saving ${selectedCandidates.length} candidates for demand ${demandId}`);
      console.log("Selected data being sent:", selectedData);

      const response = await axios.post(
        `${API_BASE_URL}/api/selected-candidates/${demandId}`,
        selectedData
      );

      if (response.data.success) {
        setSuccessMessage(`Successfully saved ${selectedCandidates.length} candidates!`);

        setSelectedCandidates([]);

        setTimeout(() => {
          window.location.href = '/demand';
        }, 2000);
      }

    } catch (err) {
      console.error('Error saving selected candidates:', err);
      setError(err.response?.data?.message || "Failed to save selected candidates");
    } finally {
      setSubmitLoading(false);
    }
  };

  return {
    selectedCandidates,
    setSelectedCandidates,
    submitLoading,
    setSubmitLoading,
    showSelectedView,
    setShowSelectedView,
    selectedViewPage,
    setSelectedViewPage,
    handleSelectCandidate,
    handleRemoveCandidate,
    handleSubmitSelectedCandidates
  };
};
