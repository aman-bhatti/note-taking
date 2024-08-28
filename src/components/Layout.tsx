import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faNoteSticky,
  faCheck,
  faCalendar,
  faHome,
} from "@fortawesome/free-solid-svg-icons"; // Import faHome

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Define paths where the header should not be shown
  const noHeaderPaths = ["/login", "/signup"];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Conditionally render the header */}
      {!noHeaderPaths.includes(location.pathname) && (
        <header className="bg-white shadow-lg rounded-lg p-4 container mx-auto mt-8">
          <div className="flex flex-wrap justify-between items-center">
            <Link
              to="/dashboard"
              className="text-xl font-semibold text-gray-800 hover:text-blue-600 flex items-center"
            >
              <FontAwesomeIcon icon={faHome} className="mr-2" />
              <span className="hidden sm:inline">Welcome, </span>
              <span>{userName ? userName : currentUser?.email}</span>
            </Link>
            <nav className="flex flex-wrap items-center space-x-4 mt-2 sm:mt-0">
              <Link
                to="/dashboard"
                className="flex items-center text-md font-medium text-gray-700 hover:text-blue-500"
              >
                <FontAwesomeIcon icon={faNoteSticky} className="mr-2" />
                <span className="hidden sm:inline">Notes</span>
              </Link>
              <Link
                to="/todos"
                className="flex items-center text-md font-medium text-gray-700 hover:text-blue-500"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                <span className="hidden sm:inline">Todos</span>
              </Link>
              <Link
                to="/calendar"
                className="flex items-center text-md font-medium text-gray-700 hover:text-blue-500"
              >
                <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                <span className="hidden sm:inline">Calendar</span>
              </Link>
              {/* Profile Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <FontAwesomeIcon icon={faUserCircle} size="xl" />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                    >
                      <div className="px-4 py-2 text-gray-800 border-b border-gray-200">
                        {currentUser?.email}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-b-lg"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default Layout;
