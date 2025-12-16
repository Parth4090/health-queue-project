import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientLogin from './pages/auth/PatientLogin';
import PatientRegister from './pages/auth/PatientRegister';
import DoctorLogin from './pages/auth/DoctorLogin';
import DoctorRegister from './pages/auth/DoctorRegister';
import DoctorVerification from './pages/auth/DoctorVerification';
import DocumentUpload from './pages/auth/DocumentUpload';
import VerificationStatus from './pages/auth/VerificationStatus';
import PatientDashboard from './pages/patient/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorQueue from './pages/doctor/DoctorQueue';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import QueueJoin from './pages/patient/QueueJoin';
import Pharmacy from './pages/Pharmacy';
import Ambulance from './pages/Ambulance';
import Profile from './pages/Profile';
import UnverifiedDashboard from './pages/doctor/UnverifiedDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [], render }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="text-center relative z-10 animate-fade-in-up">
          <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Health Queue
          </h2>
          <p className="text-gray-600 font-medium text-lg">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If render function is provided, use it
  if (render) {
    return render(user);
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col relative overflow-hidden">
        {/* Global Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        
        <Navbar />
        <main className="flex-grow relative z-10">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
              user ? <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace /> : <Login />
            } />
            <Route path="/register" element={
              user ? <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace /> : <Register />
            } />
            
            {/* Patient-specific Routes */}
            <Route path="/patient/login" element={
              user ? <Navigate to="/patient/dashboard" replace /> : <PatientLogin />
            } />
            <Route path="/patient/register" element={
              user ? <Navigate to="/patient/dashboard" replace /> : <PatientRegister />
            } />
            
            {/* Doctor-specific Routes */}
            <Route path="/doctor/login" element={
              user ? <Navigate to="/doctor/dashboard" replace /> : <DoctorLogin />
            } />
            <Route path="/doctor/register" element={
              user ? <Navigate to="/doctor/dashboard" replace /> : <DoctorRegister />
            } />
            <Route path="/doctor-verification" element={<DoctorVerification />} />
            <Route path="/doctor-verification/documents" element={<DocumentUpload />} />
            <Route path="/verification-status" element={<VerificationStatus />} />

            {/* Patient Routes */}
            <Route path="/patient/dashboard" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/patient/join-queue" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <QueueJoin />
              </ProtectedRoute>
            } />


            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute allowedRoles={['doctor']} render={(user) => {
                // Check if doctor is verified
                if (!user.isVerified) {
                  return <Navigate to="/doctor/unverified" replace />;
                }
                return <DoctorDashboard />;
              }} />
            } />
            
            <Route path="/doctor/unverified" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <UnverifiedDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/queue" element={
              <ProtectedRoute allowedRoles={['doctor']} render={(user) => {
                // Check if doctor is verified
                if (!user.isVerified) {
                  return <Navigate to="/doctor/unverified" replace />;
                }
                return <DoctorQueue />;
              }} />
            } />


            {/* Common Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/pharmacy" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Pharmacy />
              </ProtectedRoute>
            } />
            <Route path="/ambulance" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Ambulance />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#1f2937',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
            style: {
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#166534',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#991b1b',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            },
          },
        }}
      />
    </Router>
  );
};

// Root App Component with Providers
const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
