import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Stethoscope, 
  Pill, 
  Truck,
  ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLoginOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLoginOptionClick = (role) => {
    setShowLoginOptions(false);
    if (role === 'admin') {
      navigate('/admin/login');
    } else if (role === 'patient') {
      navigate('/patient/login');
    } else if (role === 'doctor') {
      navigate('/doctor/login');
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group" onClick={closeMenu}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">HealthQueue</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isAuthenticated ? (
              <>
                {/* Login Options Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowLoginOptions(!showLoginOptions)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:scale-105 px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <span>Login Options</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showLoginOptions ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showLoginOptions && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => handleLoginOptionClick('patient')}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 flex items-center justify-between"
                      >
                        <span>Patient</span>
                        <User className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleLoginOptionClick('doctor')}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 flex items-center justify-between"
                      >
                        <span>Doctor</span>
                        <Stethoscope className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleLoginOptionClick('admin')}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 flex items-center justify-between"
                      >
                        <span>Admin (Demo)</span>
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <Link
                  to="/patient/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {/* Patient Navigation */}
                {user?.role === 'patient' && (
                  <>
                    <Link
                      to="/patient/dashboard"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/patient/join-queue"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Join Queue
                    </Link>
                    <Link
                      to="/pharmacy"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Pharmacy
                    </Link>
                    <Link
                      to="/ambulance"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Emergency
                    </Link>
                  </>
                )}

                {/* Doctor Navigation */}
                {user?.role === 'doctor' && (
                  <>
                    <Link
                      to="/doctor/dashboard"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/doctor/queue"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Manage Queue
                    </Link>
                  </>
                )}

                {/* Common Navigation */}
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  Profile
                </Link>

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="hidden lg:block">{user?.name}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-200"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {!isAuthenticated ? (
              <div className="flex flex-col space-y-4">
                {/* Mobile Login Options */}
                <div className="px-4 py-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Login Options:</div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleLoginOptionClick('patient');
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 rounded-lg flex items-center justify-between"
                    >
                      <span>Patient</span>
                      <User className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        handleLoginOptionClick('doctor');
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 rounded-lg flex items-center justify-between"
                    >
                      <span>Doctor</span>
                      <Stethoscope className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        handleLoginOptionClick('admin');
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 rounded-lg flex items-center justify-between"
                    >
                      <span>Admin (Demo)</span>
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <Link
                  to="/patient/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-center"
                  onClick={closeMenu}
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {/* Patient Mobile Navigation */}
                {user?.role === 'patient' && (
                  <>
                    <Link
                      to="/patient/dashboard"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 px-4 py-2"
                      onClick={closeMenu}
                    >
                      <User className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/patient/join-queue"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 px-4 py-2"
                      onClick={closeMenu}
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Join Queue</span>
                    </Link>
                    <Link
                      to="/pharmacy"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 px-4 py-2"
                      onClick={closeMenu}
                    >
                      <Pill className="w-4 h-4" />
                      <span>Pharmacy</span>
                    </Link>
                    <Link
                      to="/ambulance"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 px-4 py-2"
                      onClick={closeMenu}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Emergency</span>
                    </Link>
                  </>
                )}

                {/* Doctor Mobile Navigation */}
                {user?.role === 'doctor' && (
                  <>
                    <Link
                      to="/doctor/dashboard"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 px-4 py-2"
                      onClick={closeMenu}
                    >
                      <User className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/doctor/queue"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 px-4 py-2"
                      onClick={closeMenu}
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Manage Queue</span>
                    </Link>
                  </>
                )}

                {/* Common Mobile Navigation */}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 px-4 py-2"
                  onClick={closeMenu}
                >
                  <Settings className="w-4 h-4" />
                  <span>Profile</span>
                </Link>

                <hr className="border-gray-200" />
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 px-4 py-2 text-left transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


