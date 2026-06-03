import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Images/logo.png";
import sideImage from "../assets/Images/head.png";
import ReactCountryFlag from "react-country-flag";
import {
  User,
  FileText,
  Calendar,
  Users,
  Receipt,
  CalendarClock,
  Shield,
  DollarSign,
  Briefcase,
  ClipboardList,
  Plane,
  BookOpen,
  Laptop,
  Award,
  Search,
  Mail,
  UserCircle,
  Globe,
  Bell,
  Clock,
  MapPin,
  MessageCircle,
  NewspaperIcon,
  AlertCircle,
  Clock as ClockIcon,
  CheckCircle,
  XCircle,
  Lock
} from "lucide-react";
import { useUser } from "../context/UserContext";

const Home = () => {
  const navigate = useNavigate();
  const { currentUser, profileStatus, hasModuleAccess, checkProfileAccess, refreshUser } = useUser();
  const [userName, setUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDevelopmentMessage, setShowDevelopmentMessage] = useState(false);
  const [developmentMessage, setDevelopmentMessage] = useState("");
  const [profileCheckDone, setProfileCheckDone] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Check if user is Admin or Recruiter
  const isAdmin = currentUser?.role === 'Admin' || JSON.parse(localStorage.getItem("user") || "{}").role === 'Admin';
  const isRecruiter = currentUser?.role === 'Recruiter' || JSON.parse(localStorage.getItem("user") || "{}").role === 'Recruiter';
  const isAdminOrRecruiter = isAdmin || isRecruiter;

  // Location configuration based on user role
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUserName(storedUser.name || storedUser.username);
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Initialize locations based on user role and nationality
  useEffect(() => {
    const initLocations = async () => {
      if (isAdminOrRecruiter) {
        // Admin/Recruiter: All locations active and selectable
        setLocations([
          { name: "USA", code: "US", active: false, disabled: false },
          { name: "India", code: "IN", active: true, disabled: false },
          { name: "China", code: "CN", active: false, disabled: false }
        ]);
      } else {
        // Employee: Fetch nationality to determine active location
        let nationality = null;
        let username = currentUser?.username;
        if (!username) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              username = parsed?.username;
            } catch (e) { }
          }
        }

        if (username) {
          try {
            const res = await fetch(`https://uaw-backend.vercel.app/api/personal-details?userId=${username}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.data?.nationality) {
                nationality = data.data.nationality;
              }
            }
          } catch (e) {
            console.error("Error fetching nationality", e);
          }
        }

        if (nationality === "USA") {
          setLocations([
            { name: "USA", code: "US", active: true, disabled: false },
            { name: "India", code: "IN", active: false, disabled: true },
            { name: "China", code: "CN", active: false, disabled: true }
          ]);
        } else if (nationality === "CHINA") {
          setLocations([
            { name: "USA", code: "US", active: false, disabled: true },
            { name: "India", code: "IN", active: false, disabled: true },
            { name: "China", code: "CN", active: true, disabled: false }
          ]);
        } else {
          // Default to India if INDIA, no profile, or unknown nationality
          setLocations([
            { name: "USA", code: "US", active: false, disabled: true },
            { name: "India", code: "IN", active: true, disabled: false },
            { name: "China", code: "CN", active: false, disabled: true }
          ]);
        }
      }
    };

    initLocations();
  }, [isAdminOrRecruiter, currentUser]);

  // Check profile status on mount
  useEffect(() => {
    const verifyProfileStatus = async () => {
      await checkProfileAccess();
      setProfileCheckDone(true);
    };
    verifyProfileStatus();
  }, []);

  // Fetch pending approval count for admin badge
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (currentUser?.role !== 'Admin') return;
      try {
        const res = await fetch('https://uaw-backend.vercel.app/api/profile-approval/admin/stats');
        const data = await res.json();
        if (data.success) setPendingCount(data.data.pending || 0);
      } catch (e) {
        // silently ignore
      }
    };
    fetchPendingCount();
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleLocationClick = (clickedIndex) => {
    // Check if the clicked location is disabled
    if (locations[clickedIndex].disabled) {
      const activeLoc = locations.find(loc => !loc.disabled && loc.active)?.name || "your assigned";
      setDevelopmentMessage(`📍 ${locations[clickedIndex].name} location is not available for your profile. Only ${activeLoc} location is accessible.`);
      setShowDevelopmentMessage(true);
      setTimeout(() => {
        setShowDevelopmentMessage(false);
      }, 3000);
      return;
    }

    // Update active location
    const updated = locations.map((loc, index) => ({
      ...loc,
      active: index === clickedIndex
    }));
    setLocations(updated);

    // Optional: Store selected location in localStorage or context
    localStorage.setItem('selectedCountry', locations[clickedIndex].name);
  };

  // Get profile status message
  const getProfileStatusMessage = () => {
    const status = profileStatus;
    switch (status) {
      case 'PENDING':
        return {
          title: 'Profile Pending Approval',
          message: 'Your profile is under review by admin. Please wait for approval.',
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'REJECTED':
        return {
          title: 'Profile Rejected',
          message: 'Your profile was rejected. Please update and resubmit your personal details.',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'APPROVED':
        return null;
      default:
        return {
          title: 'Profile Not Submitted',
          message: 'Please complete your personal details to access all features.',
          icon: AlertCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
    }
  };

  const isEmployee = currentUser?.role === 'Employee';
  const showPolicies = isAdmin || (isEmployee && profileStatus === 'APPROVED');

  const allCards = [
    { icon: <User />, title: "My Personal Details", requiresProfile: false, alwaysAllow: true, badge: isAdmin ? pendingCount : 0 },
    { icon: <ClipboardList />, title: "Code of Conduct", requiresProfile: true },
    { icon: <Users />, title: "Employee Transfer", requiresProfile: true },
    { icon: <Calendar />, title: "Holiday Calendar", requiresProfile: true },
    { icon: <Shield />, title: "Insurance", requiresProfile: true },
    { icon: <CalendarClock />, title: "Leave Application", requiresProfile: true },
    { icon: <Laptop />, title: "My Assets", requiresProfile: true },
    { icon: <Briefcase />, title: "My Client", requiresProfile: true },
    { icon: <Users />, title: "My Team", requiresProfile: true },
    { icon: <NewspaperIcon />, title: "News Feeder", requiresProfile: true },
    { icon: <DollarSign />, title: "Payroll", requiresProfile: true },
    { icon: <FileText />, title: "Policies", requiresProfile: true, isPoliciesCard: true },
    { icon: <Users />, title: "Recruitment", requiresProfile: true },
    { icon: <Receipt />, title: "Reimbursements", requiresProfile: true },
    { icon: <DollarSign />, title: "Salary Advance", requiresProfile: true },
    { icon: <BookOpen />, title: "Training", requiresProfile: true },
    { icon: <Plane />, title: "Travel", requiresProfile: true },
    { icon: <Award />, title: "UANDWE Awards", requiresProfile: true }
  ];

  const filteredCards = allCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (title) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userRole = user?.role;

    // Check if Recruitment is disabled for Employee
    const isRecruitmentDisabled = title === "Recruitment" && userRole === "Employee";
    if (isRecruitmentDisabled) {
      return; // Completely disable interaction
    }

    // Always allow access to "My Personal Details"
    if (title === "My Personal Details") {
      if (userRole === 'Admin') {
        navigate("/admin/profile-management");
      } else {
        navigate("/mypersonaldetails");
      }
      return;
    }

    // For Admin and Recruiter, allow everything
    if (userRole === 'Admin' || userRole === 'Recruiter') {
      navigateToCard(title, userRole);
      return;
    }

    // Check profile access for non-admin users
    if (!hasModuleAccess) {
      const statusMsg = getProfileStatusMessage();
      if (statusMsg) {
        setDevelopmentMessage(`Access Restricted: ${statusMsg.message} Please complete your profile first.`);
        setShowDevelopmentMessage(true);
        setTimeout(() => {
          setShowDevelopmentMessage(false);
        }, 4000);
      } else {
        setDevelopmentMessage(`Please complete your personal details first to access "${title}"`);
        setShowDevelopmentMessage(true);
        setTimeout(() => {
          setShowDevelopmentMessage(false);
        }, 3000);
      }
      return;
    }

    // If profile is approved, proceed with normal navigation
    navigateToCard(title, userRole);
  };

  const navigateToCard = (title, userRole) => {
    // Admin-only cards
    const adminOnlyCards = [];

    if (adminOnlyCards.includes(title) && userRole !== 'Admin') {
      setDevelopmentMessage(`UANDWE Knowledge Base: "${title}" is only available for Admin users`);
      setShowDevelopmentMessage(true);
      setTimeout(() => {
        setShowDevelopmentMessage(false);
      }, 3000);
      return;
    }

    // Handle Recruitment
    if (title === "Recruitment") {
      if (userRole === "Interviewer" || userRole === "Client Interviewer") {
        navigate("/demand");
      } else {
        navigate("/recruitment");
      }
    }
    else if (title === "Holiday Calendar") {
      if (userRole === "Admin") {
        navigate("/admin/holiday");
      } else {
        navigate("/holiday");
      }
    }
    else if (title === "Policies") {
      navigate("/policy");
    }
    else if (title === "UANDWE Awards") {
      navigate("/uaw-award-policy");
    }
    else if (title === "Salary Advance") {
      navigate("/salary-advance");
    }
    else if (title === "Travel") {
      navigate("/travel-policy");
    }
    else if (title === "Insurance") {
      navigate("/insurance-policy");
    }
    // ✅ ADD THIS BELOW - for My Assets
    else if (title === "My Assets") {
      if (userRole === "Admin") {
        navigate("/admin/assets");
      } else {
        navigate("/assets");
      }
    }
    else {
      setDevelopmentMessage(`UANDWE Knowledge Base: "${title}" is under development`);
      setShowDevelopmentMessage(true);
      setTimeout(() => {
        setShowDevelopmentMessage(false);
      }, 3000);
    }
  };

  // Get profile status for banner
  const profileStatusInfo = getProfileStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Development Message Toast */}
      {showDevelopmentMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideInDown">
          <div className={`rounded-lg shadow-2xl flex items-center gap-3 min-w-[400px] p-4 ${developmentMessage.includes('Access Restricted')
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-gray-900 text-white'
            }`}>
            <span className="text-xl">{developmentMessage.includes('Access Restricted') ? '🔒' : '🚧'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{developmentMessage}</p>
            </div>
            <button
              onClick={() => setShowDevelopmentMessage(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* HEADER */}
      <div className="relative w-full bg-gradient-to-r from-gray-900 via-gray-900 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="max-w-10xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-4 p-6 w-1/2 animate-slideInLeft">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <img
                src={logo}
                alt="logo"
                className="relative h-27 w-27 object-contain transform group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            <div className="relative">
              <h1 className="text-5xl font-bold text-orange-400 mb-2">myuandwe</h1>
              <h1 className="text-4xl font-bold text-white mb-2">Knowledge Base</h1>
              <p className="text-blue-200 text-lg relative">
                Self service platform for all HR systems, policies and guidance
                <span className="absolute -bottom-1 left-0 w-20 h-0.5 bg-gradient-to-r from-blue-400 to-transparent"></span>
              </p>
            </div>
          </div>

          <div className="absolute top-6 right-6 z-50">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-semibold 
              bg-white/10 backdrop-blur-md border border-white/20 
              text-white shadow-lg 
              hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 
              transition-all duration-300"
            >
              Logout
            </button>
          </div>

          <div className="w-2/3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-900 z-10"></div>
            <img
              src={sideImage}
              alt="banner"
              className="w-full h-82 object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-10 right-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
            <div className="absolute bottom-10 left-10 w-3 h-3 bg-blue-400 rounded-full animate-ping animation-delay-1000"></div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <section className="relative px-8 py-8 max-w-9xl mx-auto z-10">

        {/* WELCOME + SEARCH + HR CONTACT */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 mb-6 -mt-2 animate-slideInDown">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <UserCircle className="relative h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Welcome,
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold ml-2">
                    {userName || "Employee"}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">{formattedDate} • {formattedTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-72 group">
                <input
                  type="text"
                  placeholder="Search anything..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/50 backdrop-blur-sm group-hover:shadow-lg"
                />
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>

              <div
                onClick={() => {
                  const hrEmail = "swathi@uandwe.com";
                  const outlookComposeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(hrEmail)}`;
                  window.open(outlookComposeUrl, '_blank');
                }}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-xl border border-blue-100 hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="relative">
                  <Mail className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">HR Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Selector - Role based */}
        <div className="mb-8">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 inline-flex">
            {locations.map((location, index) => (
              <button
                key={index}
                onClick={() => handleLocationClick(index)}
                disabled={location.disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border
                  ${location.active
                    ? "bg-blue-600 text-white border-blue-600 shadow-md cursor-pointer"
                    : location.disabled
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                  }
                `}
                title={location.disabled ? `Only India location is accessible for your profile` : ""}
              >
                <ReactCountryFlag
                  countryCode={location.code}
                  svg
                  style={{ width: "18px", height: "18px", opacity: location.disabled ? 0.5 : 1 }}
                />
                {location.name}
                {location.disabled && (
                  <Lock size={12} className="ml-1" />
                )}
              </button>
            ))}
          </div>


        </div>

        {/* ALL WIDGETS */}
        <div className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredCards.map((card, index) => (
              <ProfessionalCard
                key={index}
                icon={card.icon}
                title={card.title}
                index={index}
                onClick={() => handleCardClick(card.title)}
                isLocked={card.requiresProfile && !hasModuleAccess && !isAdmin}
                profileStatus={profileStatus}
                badge={card.badge}
                isAdmin={isAdmin}
                isPolicies={card.isPoliciesCard}
              />
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Use
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Support
              </a>
            </div>
            <p className="text-sm text-gray-400">
              Employee Knowledge Base v2.0
            </p>
          </div>
        </footer>
      </section>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out;
        }
        @keyframes slideInDown {
          from { transform: translateY(-100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideInDown {
          animation: slideInDown 0.6s ease-out;
        }
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes policyFadeIn {
          0% {
            opacity: 0;
            transform: translateY(15px) scale(0.95);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
};

const ProfessionalCard = ({ icon, title, index, onClick, isLocked, profileStatus, badge, isAdmin, isPolicies }) => {
  const isRecruitment = title === "Recruitment";
  const isRecruitmentDisabled = isRecruitment && !isAdmin && (profileStatus === "PENDING" || profileStatus === "APPROVED");

  return (
    <div
      className={`relative group ${isRecruitmentDisabled ? 'cursor-not-allowed' : ''}`}
      onClick={isRecruitmentDisabled ? undefined : onClick}
      style={isPolicies ? {
        animation: 'policyFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      } : {
        animation: `fadeInScale 0.4s ease-out ${index * 0.05}s both`
      }}
    >
      <div className={`
        relative bg-white rounded-xl p-5 border shadow-sm
        transition-all duration-300 cursor-pointer
        ${isRecruitmentDisabled
          ? 'border-gray-200 bg-gray-100/80 grayscale opacity-75 !cursor-not-allowed shadow-none'
          : isLocked
            ? 'border-gray-200 opacity-60 hover:opacity-80'
            : 'border-blue-500 group-hover:border-purple-600'
        }
      `}>
        {/* Notification badge for pending approvals */}
        {badge > 0 && !isRecruitmentDisabled && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-md animate-pulse">
              {badge > 99 ? '99+' : badge}
            </span>
          </div>
        )}

        {/* Lock Overlay for locked cards */}
        {isLocked && !isRecruitmentDisabled && (
          <div className="absolute top-2 right-2">
            <div className="bg-gray-100 rounded-full p-1">
              <AlertCircle size={14} className="text-gray-400" />
            </div>
          </div>
        )}

        {/* Recruitment Disabled Badge */}
        {isRecruitmentDisabled && (
          <div className="absolute top-2 right-2">
            <div className="bg-gray-200/80 rounded-full p-1 animate-pulse">
              <span className="block w-2 h-2 rounded-full bg-gray-400" />
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="mb-3">
          <div className={`
            inline-flex p-2.5 rounded-lg
            transition-all duration-300
            ${isRecruitmentDisabled
              ? 'bg-gray-200 text-gray-400'
              : isLocked
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gray-50 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
            }
          `}>
            {React.cloneElement(icon, {
              className: `h-5 w-5 transition-transform duration-300 ${!isLocked && !isRecruitmentDisabled && 'group-hover:scale-110'}`
            })}
          </div>
        </div>

        {/* Title */}
        <h4 className={`
          text-sm font-medium
          transition-colors duration-300
          ${isRecruitmentDisabled
            ? 'text-gray-400 font-semibold'
            : isLocked ? 'text-gray-400' : 'text-gray-700 group-hover:text-blue-600'
          }
        `}>
          {title}
        </h4>

        {/* Lock text for locked cards */}
        {isLocked && !isRecruitmentDisabled && (
          <p className="text-[10px] text-gray-400 mt-1">
            {profileStatus === 'PENDING' ? 'Pending Approval' : 'Complete Profile First'}
          </p>
        )}

        {/* Disabled label for Recruitment */}
        {isRecruitmentDisabled && (
          <p className="text-[11px] text-gray-500 font-bold mt-1.5 flex items-center gap-1.5">
            {profileStatus === 'PENDING' ? 'Waiting for Approval' : ''}
          </p>
        )}

        {/* Badge text for profile management */}
        {badge > 0 && !isRecruitmentDisabled && (
          <p className="text-[10px] text-red-500 font-medium mt-1">
            {badge} pending review
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;
