// src/context/UserContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

const API_BASE_URL = "http://localhost:5000";

// Fields to EXCLUDE from localStorage (keep as is - don't store sensitive/assignment data)
const EXCLUDE_FROM_STORAGE = [
  'assignedClient',
  'assignedCompany',
  'pid'
];

const cleanForStorage = (user) => {
  if (!user) return null;
  const clean = { ...user };
  EXCLUDE_FROM_STORAGE.forEach(field => {
    delete clean[field];
  });
  return clean;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);
  const [hasModuleAccess, setHasModuleAccess] = useState(false);

  const fetchUserFromBackend = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const user = data.users.find(u => u.username === username);
        if (user) {
          // Also fetch personal details to get document links and skills
          const personalDetailsResponse = await fetch(`${API_BASE_URL}/api/personal-details?userId=${username}`);
          let personalDetails = null;

          if (personalDetailsResponse.ok) {
            const personalData = await personalDetailsResponse.json();
            if (personalData.profileCompleted && personalData.data) {
              personalDetails = personalData.data;

              // Merge personal details into user object
              Object.assign(user, {
                aadharDocumentLink: personalDetails.aadharDocumentLink,
                panDocumentLink: personalDetails.panDocumentLink,
                tenthCertificateLink: personalDetails.tenthCertificateLink,
                twelfthCertificateLink: personalDetails.twelfthCertificateLink,
                resumeDocumentLink: personalDetails.resumeDocumentLink,
                visaDocumentLink: personalDetails.visaDocumentLink,
                profilePhotoLink: personalDetails.profilePhotoLink,
                ssnNumber: personalDetails.ssnNumber,
                nationalId: personalDetails.nationalId,
                skills: personalDetails.skills || [],
                profileStatus: personalDetails.profileStatus,
                profileRejectionReason: personalDetails.profileRejectionReason
              });
            }
          }

          setCurrentUser(user);

          // Store ONLY essential fields in localStorage
          const cleanUser = cleanForStorage(user);
          localStorage.setItem('user', JSON.stringify(cleanUser));

          return user;
        } else {
          throw new Error('User not found');
        }
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error("❌ Error fetching user:", err);
      setError(err.message);
      return null;
    }
  };

const refreshUser = async () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const username = currentUser?.username || storedUser?.username;

  if (username) {
    const freshUser = await fetchUserFromBackend(username);

    await checkProfileAccess(username);

    return freshUser;
  }

  return null;
};

  const checkProfileAccess = async (userIdParam = null) => {
    const username =
      userIdParam ||
      currentUser?.username ||
      JSON.parse(localStorage.getItem("user"))?.username;

    if (!username) {
      return false;
    }

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/profile-approval/check-access?userId=${username}`
      );

      const data = await response.json();


      setProfileStatus(data.status || null);
      setHasModuleAccess(Boolean(data.hasAccess));

      return Boolean(data.hasAccess);
    } catch (error) {
      console.error("Error checking access:", error);
      return false;
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.user);

        // Store ONLY essential fields in localStorage
        const cleanUser = cleanForStorage(data.user);
        localStorage.setItem('user', JSON.stringify(cleanUser));
        localStorage.setItem('isAuthenticated', 'true');


        // Check profile access after login
        await checkProfileAccess(data.user.username);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setProfileStatus(null);
    setHasModuleAccess(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  };

  useEffect(() => {
    const initUser = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated');

      if (storedUser && isAuthenticated === 'true') {
        const parsedUser = JSON.parse(storedUser);

        // Set a temporary user from localStorage
        setCurrentUser(parsedUser);

        // Then fetch fresh data from backend (includes all fields)
        if (parsedUser.username) {
          await fetchUserFromBackend(parsedUser.username);

          // Pass username directly
          await checkProfileAccess(parsedUser.username);
        }
      }

      setLoading(false);
      setIsHydrated(true);
    };

    initUser();
  }, []);

  // Return statement - this is the only return in the component
  return (
    <UserContext.Provider value={{
      currentUser,
      loading,
      error,
      isHydrated,
      profileStatus,
      hasModuleAccess,
      checkProfileAccess,
      login,
      logout,
      refreshUser,
      fetchUserFromBackend
    }}>
      {children}
    </UserContext.Provider>
  );
};