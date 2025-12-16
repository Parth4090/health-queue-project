import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'patient'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password, formData.role);
      
      if (result.success) {
        // Redirect to patient dashboard
        navigate('/patient/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Patient-specific Healthcare Illustration Background */}
      <div className="absolute inset-0">
        {/* Patient-focused Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        
        {/* Abstract Patient Illustration */}
        <div className="absolute inset-0 flex items-center justify-center opacity-35">
          <svg 
            width="800" 
            height="600" 
            viewBox="0 0 800 600" 
            className="w-full h-full"
            fill="none"
          >
            {/* Patient Figure - Center */}
            <g>
              {/* Patient's Head */}
              <circle cx="400" cy="250" r="40" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="2" opacity="0.4"/>
              {/* Patient's Body */}
              <rect x="380" y="290" width="40" height="80" rx="20" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="2" opacity="0.4"/>
              {/* Patient's Arms */}
              <rect x="420" y="300" width="60" height="8" rx="4" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="2" opacity="0.4"/>
              <rect x="320" y="300" width="60" height="8" rx="4" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="2" opacity="0.4"/>
            </g>
            
            {/* Medical Symbols */}
            <g>
              {/* Plus Symbol */}
              <rect x="500" y="200" width="8" height="40" fill="#3B82F6" opacity="0.3"/>
              <rect x="480" y="220" width="40" height="8" fill="#3B82F6" opacity="0.3"/>
              {/* Heart Symbol */}
              <path d="M300 200 Q280 180 260 200 Q280 220 300 200" fill="#EF4444" opacity="0.3"/>
            </g>
          </svg>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, Patient!</h2>
            <p className="text-gray-600">Sign in to access your health services</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing In...' : 'Sign In as Patient'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have a patient account?{' '}
              <Link
                to="/patient/register"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;
