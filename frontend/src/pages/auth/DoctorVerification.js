import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, EyeOff, User, Lock, Mail, Phone, MapPin, Building, 
  FileText, Camera, Upload, CheckCircle, AlertCircle, 
  Calendar, GraduationCap, Stethoscope, DollarSign,
  Shield, FileCheck, Video, DocumentText, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user ID, temp token, and basic info from location state
  const { userId, tempToken, basicInfo } = location.state || {};
  
  // Debug: Log what we received
  console.log('🔍 Received state:', { userId, tempToken, basicInfo });
  
  const [formData, setFormData] = useState({
    // Professional Information (verification-specific)
    nmcNumber: '',
    specialization: '',
    qualification: '',
    experience: '',
    consultationFee: '',
    
    // Clinic Information
    clinicName: '',
    clinicAddress: '',
    workingHours: {
      start: '',
      end: ''
    },
    workingDays: [],
    
    // Compliance
    compliance: {
      termsAccepted: false,
      privacyPolicyAccepted: false,
      codeOfConductAccepted: false,
      dataProcessingConsent: false,
      aadhaarConsent: false
    }
  });

  const [loading, setLoading] = useState(false);

  // Redirect if missing required data (after hooks)
  if (!userId || !tempToken || !basicInfo) {
    console.error('Missing required data for verification');
    navigate('/register');
    return null;
  }
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'workingHours.start' || name === 'workingHours.end') {
      setFormData(prev => ({
        ...prev,
        workingHours: {
          ...prev.workingHours,
          [name.split('.')[1]]: value
        }
      }));
    } else if (name.startsWith('compliance.')) {
      const complianceField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        compliance: {
          ...prev.compliance,
          [complianceField]: checked
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleWorkingDaysChange = (day) => {
    const lowercaseDay = day.toLowerCase();
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(lowercaseDay)
        ? prev.workingDays.filter(d => d !== lowercaseDay)
        : [...prev.workingDays, lowercaseDay]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.nmcNumber || !formData.specialization || !formData.qualification || 
        !formData.experience || !formData.consultationFee || !formData.clinicName || 
        !formData.clinicAddress || formData.workingDays.length === 0 ||
        !formData.compliance.termsAccepted || !formData.compliance.privacyPolicyAccepted ||
        !formData.compliance.codeOfConductAccepted || !formData.compliance.dataProcessingConsent || 
        !formData.compliance.aadhaarConsent) {
      toast.error('Please fill in all required fields and accept all terms');
      setLoading(false);
      return;
    }

    // Validate clinic address length
    if (formData.clinicAddress.trim().length < 3) {
      toast.error('Clinic address must be at least 3 characters long');
      setLoading(false);
      return;
    }

    try {
      // Combine basic info from signup with verification info
      const completeData = {
        ...basicInfo,
        ...formData,
        experience: parseInt(formData.experience),
        consultationFee: parseFloat(formData.consultationFee)
      };

      // Debug: Log what we're sending
      console.log('🔍 Sending data to backend:', JSON.stringify(completeData, null, 2));

      const response = await fetch('/api/doctor-verification/register/step1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          ...completeData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Doctor verification submitted successfully!');
        // Store verification ID and temp token for next steps
        localStorage.setItem('verificationId', data.verificationId);
        localStorage.setItem('tempToken', data.tempToken);
        // Navigate to document upload step
        navigate('/doctor-verification/documents', { 
          state: { 
            verificationId: data.verificationId,
            tempToken: data.tempToken 
          } 
        });
      } else {
        toast.error(data.message || 'Verification submission failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/register');
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
          <button
            onClick={goBack}
            className="absolute left-0 top-0 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Registration
          </button>
          
          <div className="animate-fade-in-up">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Doctor Verification
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Complete your professional verification
            </p>
          </div>
        </div>

        {/* Basic Info Summary */}
        {Object.keys(basicInfo).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Basic Information (from signup)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="font-medium">Name:</span> {basicInfo.name}</div>
              <div><span className="font-medium">Email:</span> {basicInfo.email}</div>
              <div><span className="font-medium">Phone:</span> {basicInfo.phone}</div>
              <div><span className="font-medium">Location:</span> {basicInfo.city}, {basicInfo.state}</div>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-lg py-10 px-8 shadow-2xl rounded-3xl border border-white/50 animate-fade-in-up" style={{animationDelay: '200ms'}}>
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Professional Information */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Stethoscope className="h-6 w-6 mr-3 text-blue-600" />
                Professional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nmcNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Council Registration Number *
                  </label>
                  <input
                    id="nmcNumber"
                    name="nmcNumber"
                    type="text"
                    required
                    value={formData.nmcNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="e.g., NMC1234567890, MAH12345678, 12345"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your NMC, MCI, or State Medical Council registration number
                  </p>
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <select
                    id="specialization"
                    name="specialization"
                    required
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select specialization</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Urology">Urology</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Qualification *
                  </label>
                  <input
                    id="qualification"
                    name="qualification"
                    type="text"
                    required
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="e.g., MBBS, MD, MS, DM"
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Years of practice"
                  />
                </div>

                <div>
                  <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    id="consultationFee"
                    name="consultationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.consultationFee}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="e.g., 500.00"
                  />
                </div>
              </div>
            </div>

            {/* Clinic Information */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Building className="h-6 w-6 mr-3 text-blue-600" />
                Clinic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic/Hospital Name *
                  </label>
                  <input
                    id="clinicName"
                    name="clinicName"
                    type="text"
                    required
                    value={formData.clinicName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter clinic or hospital name"
                  />
                </div>

                <div>
                  <label htmlFor="clinicAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Address *
                  </label>
                  <textarea
                    id="clinicAddress"
                    name="clinicAddress"
                    rows="3"
                    required
                    value={formData.clinicAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter complete clinic address (e.g., Street, City, State, PIN Code)"
                    minLength="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please provide a detailed address including street, city, state, and PIN code
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours *
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="time"
                        name="workingHours.start"
                        required
                        value={formData.workingHours.start}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                      <p className="text-xs text-gray-500 mt-1">Start Time</p>
                    </div>
                    <div className="flex-1">
                      <input
                        type="time"
                        name="workingHours.end"
                        required
                        value={formData.workingHours.end}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                      <p className="text-xs text-gray-500 mt-1">End Time</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.workingDays.includes(day)}
                          onChange={() => handleWorkingDaysChange(day)}
                          className="mr-2 text-blue-600"
                        />
                        <span className="text-sm">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Shield className="h-6 w-6 mr-3 text-blue-600" />
                Compliance & Consent
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="compliance.termsAccepted"
                    required
                    checked={formData.compliance.termsAccepted}
                    onChange={handleChange}
                    className="mr-3 mt-1 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the Terms and Conditions of the HealthQueue platform *
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="compliance.privacyPolicyAccepted"
                    required
                    checked={formData.compliance.privacyPolicyAccepted}
                    onChange={handleChange}
                    className="mr-3 mt-1 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the Privacy Policy and data handling practices *
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="compliance.codeOfConductAccepted"
                    required
                    checked={formData.compliance.codeOfConductAccepted}
                    onChange={handleChange}
                    className="mr-3 mt-1 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the Medical Code of Conduct and agree to maintain professional standards *
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="compliance.dataProcessingConsent"
                    required
                    checked={formData.compliance.dataProcessingConsent}
                    onChange={handleChange}
                    className="mr-3 mt-1 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to the processing of my personal and professional data for verification purposes *
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="compliance.aadhaarConsent"
                    required
                    checked={formData.compliance.aadhaarConsent}
                    onChange={handleChange}
                    className="mr-3 mt-1 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to the use of my Aadhaar number for identity verification as per Indian guidelines *
                  </span>
                </label>
              </div>
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
                  Submitting Verification...
                </div>
              ) : (
                'Submit Verification & Continue to Document Upload'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Next step: Upload required documents (ID proof, medical degree, license)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorVerification;

