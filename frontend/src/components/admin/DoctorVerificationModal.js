import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  DollarSign,
  Clock,
  Building,
  FileText,
  Shield,
  User,
  Stethoscope
} from 'lucide-react';


const DoctorVerificationModal = ({ verification, onClose, onApprove, onReject, onHold, onSuspend }) => {
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);


  const handleAction = async () => {
    if (!action) return;
    
    setLoading(true);
    try {
      switch (action) {
        case 'approve':
          await onApprove(notes);
          break;
        case 'reject':
          if (!reason.trim()) {
            alert('Please provide a rejection reason');
            setLoading(false);
            return;
          }
          await onReject(reason, notes);
          break;
        case 'hold':
          if (!notes.trim()) {
            alert('Please provide a hold reason');
            setLoading(false);
            return;
          }
          await onHold(notes);
          break;
        case 'suspend':
          if (!notes.trim()) {
            alert('Please provide suspension notes');
            setLoading(false);
            return;
          }
          await onSuspend(notes);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      case 'on_hold':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4" />;
      case 'on_hold':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Doctor Verification Details</h2>
              <p className="text-sm text-gray-500">Review and manage doctor registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verification.status)}`}>
              {getStatusIcon(verification.status)}
              <span className="ml-2 capitalize">{verification.status}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-24">Name:</span>
                    <span className="text-sm text-gray-900">{verification.personalInfo?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{verification.userId?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{verification.personalInfo?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{verification.personalInfo?.city || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {verification.personalInfo?.dateOfBirth ? 
                        new Date(verification.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-24">Gender:</span>
                    <span className="text-sm text-gray-900">{verification.personalInfo?.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                  Professional Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-24">Specialization:</span>
                    <span className="text-sm text-gray-900">{verification.professionalInfo?.specialization || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{verification.professionalInfo?.qualification || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{verification.professionalInfo?.experience || 0} years experience</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">₹{verification.professionalInfo?.consultationFee || 0} consultation fee</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{verification.professionalInfo?.clinicName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents and Actions */}
            <div className="space-y-6">
              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Verification Documents
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {verification.documents && verification.documents.length > 0 ? (
                    verification.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">{doc.type} • {doc.fileSize} bytes</p>
                          </div>
                        </div>
                                                 <div className="flex items-center space-x-2">
                           <a
                             href={`http://localhost:5000/${doc.fileUrl}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                             title="View Document (Direct Access - High Quality)"
                           >
                             <Eye className="h-4 w-4" />
                           </a>
                           <a
                             href={`http://localhost:5000/api/doctor-verification/documents/${verification._id}/${doc._id}/download`}
                             download
                             className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                           >
                             <Download className="h-4 w-4" />
                           </a>
                         </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                  )}
                </div>
              </div>

                             {/* Action Buttons */}
               {(verification.status === 'pending' || verification.status === 'documents_uploaded' || verification.status === 'automated_verification' || verification.status === 'manual_review' || verification.status === 'on_hold') && (
                 <div>
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Take Action</h3>
                   <div className="space-y-4">
                     {/* Approve Button */}
                     <button
                       onClick={() => setAction('approve')}
                       className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                         action === 'approve'
                           ? 'bg-green-600 text-white'
                           : 'bg-green-50 text-green-700 hover:bg-green-100'
                       }`}
                     >
                       <CheckCircle className="h-5 w-5 mr-2" />
                       Approve Doctor
                     </button>

                     {/* Reject Button */}
                     <button
                       onClick={() => setAction('reject')}
                       className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                         action === 'reject'
                           ? 'bg-red-600 text-white'
                           : 'bg-red-50 text-red-700 hover:bg-red-100'
                       }`}
                     >
                       <XCircle className="h-5 w-5 mr-2" />
                       Reject Application
                     </button>

                     {/* Put on Hold Button */}
                     <button
                       onClick={() => setAction('hold')}
                       className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                         action === 'hold'
                           ? 'bg-yellow-600 text-white'
                           : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                       }`}
                     >
                       <Clock className="h-5 w-5 mr-2" />
                       Put on Hold
                     </button>

                     {/* Suspend Button */}
                     <button
                       onClick={() => setAction('suspend')}
                       className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                         action === 'suspend'
                           ? 'bg-orange-600 text-white'
                           : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                       }`}
                     >
                       <AlertTriangle className="h-5 w-5 mr-2" />
                       Suspend Account
                     </button>
                   </div>

                  {/* Action Form */}
                  {action && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {action === 'reject' && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rejection Reason *
                          </label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Provide a clear reason for rejection..."
                            required
                          />
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {action === 'approve' ? 'Approval Notes' : 
                           action === 'reject' ? 'Additional Notes' : 
                           action === 'hold' ? 'Hold Reason *' : 'Suspension Notes *'}
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={`Enter ${action === 'approve' ? 'approval' : action === 'reject' ? 'additional' : action === 'hold' ? 'hold reason' : 'suspension'} notes...`}
                          required={action === 'suspend' || action === 'hold'}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={handleAction}
                          disabled={loading || (action === 'reject' && !reason.trim()) || ((action === 'suspend' || action === 'hold') && !notes.trim())}
                          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading ? 'Processing...' : `Confirm ${action}`}
                        </button>
                        <button
                          onClick={() => {
                            setAction(null);
                            setNotes('');
                            setReason('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              {verification.timeline && verification.timeline.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Timeline</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {verification.timeline.slice(-5).reverse().map((event, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{event.action}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          {event.notes && (
                            <p className="text-xs text-gray-600 mt-1">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default DoctorVerificationModal;
