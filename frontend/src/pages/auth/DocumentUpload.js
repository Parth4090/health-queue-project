import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Upload, FileText, Camera, Video, ArrowLeft, CheckCircle,
  AlertCircle, Shield, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { verificationId, tempToken } = location.state || {};
  
  const [formData, setFormData] = useState({
    governmentId: null,
    medicalDegree: null,
    medicalLicense: null,
    selfieVideo: null
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${field} file is too large. Maximum size is 10MB.`);
        e.target.value = '';
        setFormData(prev => ({
          ...prev,
          [field]: null
        }));
        return;
      }
      
      toast.success(`${field} file selected: ${file.name}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.governmentId || !formData.medicalDegree || !formData.medicalLicense) {
      toast.error('Please upload all required documents');
      return;
    }

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('verificationId', verificationId);
      formDataToSend.append('governmentId', formData.governmentId);
      formDataToSend.append('medicalDegree', formData.medicalDegree);
      formDataToSend.append('medicalLicense', formData.medicalLicense);
      if (formData.selfieVideo) {
        formDataToSend.append('selfieVideo', formData.selfieVideo);
      }

      // Debug: Log what we're sending
      console.log('🔍 Sending documents:', {
        verificationId,
        governmentId: formData.governmentId?.name,
        medicalDegree: formData.medicalDegree?.name,
        medicalLicense: formData.medicalLicense?.name,
        selfieVideo: formData.selfieVideo?.name
      });

      const response = await fetch('/api/doctor-verification/upload-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempToken}`
        },
        body: formDataToSend
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('🔍 Response data:', data);

      if (response.ok) {
        toast.success('Documents uploaded successfully!');
        // Navigate to verification status page
        navigate('/doctor-verification/status', { 
          state: { 
            verificationId,
            tempToken 
          } 
        });
      } else {
        toast.error(data.message || 'Document upload failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/doctor-verification');
  };

  const goToHome = () => {
    navigate('/');
  };

  if (!verificationId || !tempToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 px-4 sm:px-6 lg:px-8">
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
          <button
            onClick={goBack}
            className="absolute left-0 top-0 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Verification
          </button>
          
          <div className="animate-fade-in-up">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Document Upload
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Upload required documents for verification
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg py-10 px-8 shadow-2xl rounded-3xl border border-white/50 animate-fade-in-up" style={{animationDelay: '200ms'}}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Required Documents */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-blue-600" />
                Required Documents
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Government ID */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="governmentId"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'governmentId')}
                    className="hidden"
                    required
                  />
                  <label htmlFor="governmentId" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Shield className="h-12 w-12 text-gray-400 mb-3" />
                      <h4 className="font-medium text-gray-700 mb-2">Government ID</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        Aadhaar, PAN, or Driving License
                      </p>
                      {formData.governmentId ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm">{formData.governmentId.name}</span>
                        </div>
                      ) : (
                        <div className="text-blue-600 hover:text-blue-700">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">Click to upload</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Medical Degree */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="medicalDegree"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'medicalDegree')}
                    className="hidden"
                    required
                  />
                  <label htmlFor="medicalDegree" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-3" />
                      <h4 className="font-medium text-gray-700 mb-2">Medical Degree</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        MBBS, MD, MS, or other medical qualification
                      </p>
                      {formData.medicalDegree ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm">{formData.medicalDegree.name}</span>
                        </div>
                      ) : (
                        <div className="text-blue-600 hover:text-blue-700">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">Click to upload</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Medical License */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="medicalLicense"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'medicalLicense')}
                    className="hidden"
                    required
                  />
                  <label htmlFor="medicalLicense" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <UserCheck className="h-12 w-12 text-gray-400 mb-3" />
                      <h4 className="font-medium text-gray-700 mb-2">Medical License</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        State Medical Council license
                      </p>
                      {formData.medicalLicense ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm">{formData.medicalLicense.name}</span>
                        </div>
                      ) : (
                        <div className="text-blue-600 hover:text-blue-700">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">Click to upload</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Selfie Video (Optional) */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="selfieVideo"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e, 'selfieVideo')}
                    className="hidden"
                  />
                  <label htmlFor="selfieVideo" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Video className="h-12 w-12 text-gray-400 mb-3" />
                      <h4 className="font-medium text-gray-700 mb-2">Selfie Video (Optional)</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        Short video for liveness detection
                      </p>
                      {formData.selfieVideo ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm">{formData.selfieVideo.name}</span>
                        </div>
                      ) : (
                        <div className="text-blue-600 hover:text-blue-700">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">Click to upload</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* File Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">File Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Maximum file size: 10MB per file</li>
                <li>• Accepted formats: PDF, JPG, JPEG, PNG</li>
                <li>• Video format: MP4, MOV, AVI (for selfie video)</li>
                <li>• Ensure documents are clear and readable</li>
                <li>• All required documents must be uploaded to proceed</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading Documents...
                </div>
              ) : (
                'Upload Documents & Continue'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Next step: Liveness verification and face matching
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
