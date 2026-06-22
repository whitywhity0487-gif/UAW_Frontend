import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import logo from "../assets/Images/logo.png";
import { Bell, Check, X } from "lucide-react";

const Header = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "User";
  const role = user?.role || "Recruiter";

  // Check if user is Admin
  const isAdmin = role === "Admin";

  // Check if user is Interviewer
  const isInterviewer = role === "Interviewer";

  // Check if user is Client Interviewer
  const isClientInterviewer = role === "Client Interviewer";

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (username && username !== "User") {
      fetchNotifications();
      // Poll every 1 minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [username]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications/user/${username}`);
      if (res.data.success) {
        const newNotifs = res.data.data;

        setNotifications(prevNotifs => {
          // If we already have notifications loaded, check for new unread ones
          if (prevNotifs.length > 0) {
            const added = newNotifs.filter(n => !prevNotifs.some(p => p.id === n.id) && !n.isRead);
            if (added.length > 0) {
              added.forEach((notif, index) => {
                setTimeout(() => {
                  setToasts(t => [...t, { id: notif.id, message: notif.message, type: notif.type }]);
                  setTimeout(() => {
                    setToasts(t => t.filter(toast => toast.id !== notif.id));
                  }, 5000);
                }, index * 500);
              });
            }
          }
          return newNotifs;
        });
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/read/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItem = (label, path) => {
    const isActive = location.pathname === path;

    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        className={`px-3 py-1 text-sm font-semibold transition-colors
          ${isActive
            ? "text-blue-600"
            : "text-gray-700 hover:text-blue-500"
          }`}
      >
        {label}
      </button>
    );
  };

  return (
    <header className="w-full sticky top-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-20 blur-2xl"></div>

      <div className="relative bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/40">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 bg-white">

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              // Client Interviewer and Interviewer always go to demand
              if (isClientInterviewer || isInterviewer) {
                navigate("/demand");
              }
              // Others (Admin and Recruiter) go to home
              else {
                navigate("/home");
              }
            }}
          >
            <img
              src={logo}
              alt="UAW Technology"
              className="h-10 w-10 rounded-lg shadow-md"
            />
            <h1 className="text-xl font-bold text-orange-400">
              myuandwe
            </h1>
          </div>

          {/* CENTER: Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* For Client Interviewer AND Interviewer - ONLY show Demand */}
            {(isClientInterviewer || isInterviewer) ? (
              // Interviewer and Client Interviewer - ONLY show Demand
              navItem("Demand", "/demand")
            ) : (
              // Other roles (Admin and Recruiter) - show full navigation
              <>
                {/* Show Home for Admin and Recruiter */}
                {navItem("Home", "/home")}

                {/* Show Demand for everyone */}
                {navItem("Demand", "/demand")}

                {/* Show Recruiter for Admin and Recruiter */}
                {navItem("Recruiter", "/recruiter")}


                {navItem("Joined", "/joined ")}

                {/* Show User only for Admin */}
                {isAdmin && navItem("User", "/create-user")}
              </>
            )}
          </div>

          {/* RIGHT: User Profile & Notifications */}
          <div className="flex items-center gap-4 relative">

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setOpen(false); }}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-full flex-shrink-0 self-start"
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setOpen(!open); setShowNotifications(false); }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/60 hover:bg-white shadow-md transition-all"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>

                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">{username}</p>
                  <p className="text-xs text-gray-500 capitalize">{role}</p>
                </div>

                <span className="text-gray-500">▾</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold">{username}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {role} • {username}@uawtech.com
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Toast Notifications moved to Home.jsx */}

      <style>{`
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </header>
  );
};

export default Header;