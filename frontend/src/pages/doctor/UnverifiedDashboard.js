import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, AlertCircle, FileText, Shield, UserCheck, 
  CheckCircle, ArrowRight, LogOut, Home
} from 'lucide-react';
import toast from 'react-hot-toast';

const UnverifiedDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.verificationId) {
      checkVerificationStatus();
      
      // Listen for real-time refresh events
      const handleRefresh = () => {
        console.log('🔄 Refreshing doctor dashboard...');
        checkVerificationStatus();
      };

      window.addEventListener('refreshDoctorDashboard', handleRefresh);

      // Set up periodic check every 30 seconds
      const interval = setInterval(checkVerificationStatus, 30000);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshDoctorDashboard', handleRefresh);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkVerificationStatus = async () => {
    try {
      // Check user verification status through auth profile
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // If user is verified, redirect to main dashboard
        if (data.user.isVerified) {
          toast.success('Verification approved! Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = '/doctor/dashboard';
          }, 2000);
          return;
        }
        
        // If not verified, get verification details
        if (user.verificationId) {
          const verificationResponse = await fetch(`/api/doctor-verification/status/${user.verificationId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json();
            setVerificationData(verificationData);
          }
        }
      } else {
        toast.error('Failed to fetch verification status');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const goToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h2>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_documents':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case 'documents_uploaded':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'automated_verification':
        return <Shield className="h-8 w-8 text-purple-500" />;
      case 'manual_review':
        return <UserCheck className="h-8 w-8 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending_documents':
        return 'Documents pending upload';
      case 'documents_uploaded':
        return 'Documents uploaded successfully!';
      case 'automated_verification':
        return 'Running automated verification checks';
      case 'manual_review':
        return 'Under admin review';
      case 'approved':
        return 'Verification approved!';
      case 'rejected':
        return 'Verification rejected';
      default:
        return 'Processing verification';
    }
  };

  const getNextSteps = (status) => {
    switch (status) {
      case 'documents_uploaded':
        return [
          'Automated verification in progress',
          'Admin review will be scheduled',
          'You will receive notifications on status changes'
        ];
      case 'automated_verification':
        return [
          'AI-powered document analysis',
          'Face matching and liveness detection',
          'Risk assessment and fraud detection'
        ];
      case 'manual_review':
        return [
          'Admin reviewing your documents',
          'This may take 24-48 hours',
          'You will be notified of the decision'
        ];
      case 'approved':
        return [
          'Your account is now active!',
          'You can access all doctor features',
          'Patients can now see your profile'
        ];
      case 'rejected':
        return [
          'Review the rejection reason',
          'Upload additional documents if needed',
          'Submit an appeal if appropriate'
        ];
      default:
        return ['Processing your verification...'];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Doctor Dashboard
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Account Verification Required
            </p>
          </div>
        </div>

        {/* Verification Status Alert */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Account Verification Pending
              </h3>
              <p className="text-yellow-700">
                Your account is currently under verification. You cannot access doctor features until your account is approved by an administrator.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg py-10 px-8 shadow-2xl rounded-3xl border border-white/50 animate-fade-in-up" style={{animationDelay: '200ms'}}>
          {/* Current Status */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg mb-4">
              {getStatusIcon(verificationData?.status || 'pending_documents')}
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {getStatusMessage(verificationData?.status || 'pending_documents')}
            </h3>
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-600">
              <span className="text-sm font-medium capitalize">
                {verificationData?.status?.replace('_', ' ') || 'pending documents'}
              </span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Verification Progress</h4>
            <div className="space-y-4">
              {[
                { status: 'pending_documents', label: 'Documents Uploaded', icon: FileText },
                { status: 'automated_verification', label: 'AI Verification', icon: Shield },
                { status: 'manual_review', label: 'Admin Review', icon: UserCheck },
                { status: 'approved', label: 'Verification Complete', icon: CheckCircle }
              ].map((step, index) => {
                const Icon = step.icon;
                const isCompleted = verificationData?.status === step.status || 
                  ['approved', 'rejected'].includes(verificationData?.status);
                const isCurrent = verificationData?.status === step.status;
                
                return (
                  <div key={step.status} className={`flex items-center p-4 rounded-lg border ${
                    isCompleted ? 'bg-green-50 border-green-200' :
                    isCurrent ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500' :
                      isCurrent ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-white" />
                      ) : (
                        <Icon className={`h-6 w-6 ${isCurrent ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className={`font-medium ${
                        isCompleted ? 'text-green-800' :
                        isCurrent ? 'text-blue-800' :
                        'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                      <p className={`text-sm ${
                        isCompleted ? 'text-green-600' :
                        isCurrent ? 'text-blue-600' :
                        'text-gray-400'
                      }`}>
                        {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Next Steps</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2">
                {getNextSteps(verificationData?.status || 'pending_documents').map((step, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRight className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={checkVerificationStatus}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              <Clock className="h-5 w-5 mr-2" />
              Check Status
            </button>
            
            <button
              onClick={goToHome}
              className="flex items-center justify-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              <Home className="h-5 w-5 mr-2" />
              Go to Home
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Verification ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user?.verificationId || 'N/A'}</span>
            </p>
            <p className="mt-2">
              Need help? Contact support at support@healthqueue.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnverifiedDashboard;
