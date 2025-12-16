import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, Clock, AlertCircle, FileText, Shield, 
  UserCheck, GraduationCap, ArrowRight, Home, LogIn
} from 'lucide-react';
import toast from 'react-hot-toast';

const VerificationStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verificationId, tempToken } = location.state || {};
  
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (verificationId && tempToken) {
      checkVerificationStatus();
    } else {
      setLoading(false);
    }
  }, [verificationId, tempToken]);

  const checkVerificationStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch(`/api/doctor-verification/status/${verificationId}`, {
        headers: {
          'Authorization': `Bearer ${tempToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationData(data);
      } else {
        toast.error('Failed to fetch verification status');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Failed to check verification status');
    } finally {
      setLoading(false);
      setCheckingStatus(false);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToHome = () => {
    navigate('/');
  };

  if (!verificationId || !tempToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-600 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You need to complete the verification form first.
          </p>
          <button
            onClick={goToHome}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_documents':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'documents_uploaded':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'automated_verification':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'manual_review':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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
          'You can log in and access all features',
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
              Verification Status
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Track your doctor verification progress
            </p>
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
            <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getStatusColor(verificationData?.status || 'pending_documents')}`}>
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
                const isUpcoming = !isCompleted && !isCurrent;
                
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
            {verificationData?.status === 'approved' ? (
              <button
                onClick={goToLogin}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Login to Your Account
              </button>
            ) : (
              <button
                onClick={checkVerificationStatus}
                disabled={checkingStatus}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
              >
                <Clock className="h-5 w-5 mr-2" />
                {checkingStatus ? 'Checking...' : 'Check Status'}
              </button>
            )}
            
            <button
              onClick={goToHome}
              className="flex items-center justify-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              <Home className="h-5 w-5 mr-2" />
              Go to Home
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Verification ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{verificationId}</span>
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

export default VerificationStatus;
