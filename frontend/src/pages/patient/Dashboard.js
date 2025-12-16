import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Prescription from '../../components/Prescription';
import { prescriptionService } from '../../services/prescriptionService';
import DoctorSearch from '../../components/DoctorSearch';
import QueueStatus from '../../components/QueueStatus';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Plus,
  Search,
  FileText,
  X,
  Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [currentQueue, setCurrentQueue] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [showQueueStatus, setShowQueueStatus] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);

  useEffect(() => {
    // Listen for queue updates
    if (socket) {
      socket.on('queue-updated', (data) => {
        if (data.patientId === user?.id) {
          // Refresh queue data when there's an update
          fetchDashboardData();
          toast.success('Queue position updated!');
        }
      });

      socket.on('new-queue', (data) => {
        if (data.patientId === user?.id) {
          // Refresh queue data when patient joins a new queue
          fetchDashboardData();
          toast.success('Successfully joined queue!');
        }
      });
    }

    // Fetch initial data
    fetchDashboardData();

    return () => {
      if (socket) {
        socket.off('queue-updated');
        socket.off('new-queue');
      }
    };
  }, [socket, user]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch current queue status from API
      try {
        const response = await fetch('/api/queue/patient/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.queueEntry) {
            // Transform the API response to match our component's expected format
            const queueData = {
              id: data.queueEntry._id,
              doctorName: data.queueEntry.doctorId.name,
              specialization: data.queueEntry.doctorId.specialization,
              ticketNumber: data.queueEntry.position,
              position: data.queueEntry.position,
              estimatedTime: `${data.queueEntry.estimatedWaitTime || 0} minutes`,
              status: data.queueEntry.status,
              city: data.queueEntry.doctorId.city
            };
            setCurrentQueue(queueData);
          } else {
            setCurrentQueue(null);
          }
        } else {
          console.error('Failed to fetch queue status');
          setCurrentQueue(null);
        }
      } catch (error) {
        console.error('Error fetching queue status:', error);
        setCurrentQueue(null);
      }

      // Mock activity data for now - can be replaced with real API later
      const mockActivity = [
        {
          id: 1,
          type: 'queue_joined',
          message: currentQueue ? `Joined ${currentQueue.doctorName}'s queue` : 'No active queue',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'completed'
        }
      ];

      setRecentActivity(mockActivity);
      
      // Fetch prescriptions from API
      try {
        const prescriptionsData = await prescriptionService.getPatientPrescriptions(user.id);
        setPrescriptions(prescriptionsData);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        // Set empty array if API fails
        setPrescriptions([]);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'text-yellow-600 bg-yellow-100';
      case 'in-consultation':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'skipped':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'in-consultation':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'skipped':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10 animate-fade-in-up">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Loading your dashboard...
          </h2>
          <p className="text-gray-600 font-medium">Preparing your healthcare information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-xl text-gray-600 font-medium">Here's what's happening with your health today</p>
            </div>
            <div className="flex space-x-3 animate-fade-in-right">
              <button 
                onClick={() => setShowDoctorSearch(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Join Queue
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Queue Status */}
            {currentQueue ? (
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-8 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Current Queue Status</h2>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={fetchDashboardData}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Refresh queue status"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentQueue.status)}`}>
                      {currentQueue.status === 'waiting' ? 'Waiting' : 
                       currentQueue.status === 'in-consultation' ? 'In Consultation' : 
                       currentQueue.status === 'completed' ? 'Completed' : 'Skipped'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{currentQueue.doctorName}</h3>
                    <p className="text-gray-600 mb-1">{currentQueue.specialization}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{currentQueue.city || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-1" />
                      <span>+91 98765 43210</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{currentQueue.ticketNumber}</div>
                      <div className="text-sm text-gray-600">Ticket Number</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{currentQueue.position}</div>
                      <div className="text-sm text-gray-600">Position in Queue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">{currentQueue.estimatedTime}</div>
                      <div className="text-sm text-gray-600">Estimated Wait Time</div>
                    </div>
                  </div>
                </div>

                {currentQueue.status === 'waiting' && currentQueue.position <= 3 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 font-medium">
                        You're next! Please be ready for your consultation.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <Clock className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Queue</h3>
                <p className="text-gray-600 mb-4">You're not currently in any doctor's queue</p>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Find a Doctor
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowDoctorSearch(true)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                >
                  <div className="text-blue-600 mb-2">
                    <Search className="h-8 w-8 mx-auto" />
                  </div>
                  <div className="font-medium text-gray-900">Find Doctor</div>
                  <div className="text-sm text-gray-600">Search by specialization</div>
                </button>

                <button 
                  onClick={() => setShowAppointmentBooking(true)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-center"
                >
                  <div className="text-green-600 mb-2">
                    <Calendar className="h-8 w-8 mx-auto" />
                  </div>
                  <div className="font-medium text-gray-900">Book Appointment</div>
                  <div className="text-sm text-gray-600">Schedule future visits</div>
                </button>

                <button 
                  onClick={() => setShowPrescription(true)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-center"
                >
                  <div className="text-orange-600 mb-2">
                    <FileText className="h-8 w-8 mx-auto" />
                  </div>
                  <div className="font-medium text-gray-900">View Prescriptions</div>
                  <div className="text-sm text-gray-600">Check your medications</div>
                </button>

                <button 
                  onClick={() => setShowQueueStatus(true)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-center"
                >
                  <div className="text-purple-600 mb-2">
                    <Stethoscope className="h-8 w-8 mx-auto" />
                  </div>
                  <div className="font-medium text-gray-900">Queue Status</div>
                  <div className="text-sm text-gray-600">Check your position</div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full mr-3 ${getStatusColor(activity.status)}`}>
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{user?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">City:</span>
                  <span className="font-medium">{user?.city}</span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month</h2>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">5</div>
                  <div className="text-sm text-gray-600">Queue Joins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-gray-600">Consultations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">2</div>
                  <div className="text-sm text-gray-600">Medicine Orders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Prescriptions</h2>
              <button
                onClick={() => setShowPrescription(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {prescriptions.length > 0 ? (
                <div className="space-y-6">
                  {prescriptions.map((prescription, index) => (
                    <Prescription
                      key={prescription._id || prescription.id}
                      mode="view"
                      prescription={prescription}
                      patientName={user?.name}
                      doctorName={prescription.doctorId?.userId?.name || prescription.doctorId?.name || 'Unknown Doctor'}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Yet</h3>
                  <p className="text-gray-600">You don't have any prescriptions yet. They will appear here after your consultations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Search Modal */}
      {showDoctorSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Find Doctors</h2>
              <button
                onClick={() => setShowDoctorSearch(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <DoctorSearch 
                onSelectDoctor={(doctor) => {
                  console.log('Selected doctor:', doctor);
                  setShowDoctorSearch(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Queue Status Modal */}
      {showQueueStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Queue Status</h2>
              <button
                onClick={() => setShowQueueStatus(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <QueueStatus patientId={user?.id} />
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {showAppointmentBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
              <button
                onClick={() => setShowAppointmentBooking(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor
                  </label>
                  <button
                    onClick={() => {
                      setShowAppointmentBooking(false);
                      setShowDoctorSearch(true);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-left hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  >
                    <span className="text-gray-500">Click to select a doctor...</span>
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors">
                    <option value="">Select time...</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    placeholder="Describe your symptoms or reason for the appointment..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAppointmentBooking(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Appointment request submitted! We will contact you soon.');
                      setShowAppointmentBooking(false);
                    }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
