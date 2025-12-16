import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Prescription from '../../components/Prescription';
import { prescriptionService } from '../../services/prescriptionService';
import { 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  FileText,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [currentQueue, setCurrentQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    console.log('🔌 Socket connection status:', socket ? 'Connected' : 'Not connected');
    console.log('👨‍⚕️ Current user:', user);
    
    // Listen for queue updates and new queue events
    if (socket) {
      socket.on('queue-updated', (data) => {
        console.log('🔄 Queue updated event received:', data);
        if (data.doctorId === user?.id) {
          fetchQueueData();
          toast.success('Queue updated!');
        }
      });

      socket.on('newQueue', (data) => {
        console.log('🆕 New queue event received:', data);
        if (data.data && data.data.doctorId === user?.id) {
          console.log('✅ New patient joined doctor queue, refreshing data...');
          fetchQueueData();
          toast.success('New patient joined your queue!');
        }
      });
    }

    // Listen for custom events to refresh queue
    const handleQueueRefresh = () => {
      console.log('🔄 Custom event refreshDoctorQueue received');
      fetchQueueData();
    };

    window.addEventListener('refreshDoctorQueue', handleQueueRefresh);

    // Fetch initial data
    fetchDashboardData();

    return () => {
      if (socket) {
        socket.off('queue-updated');
        socket.off('newQueue');
      }
      window.removeEventListener('refreshDoctorQueue', handleQueueRefresh);
    };
  }, [socket, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch queue data from API
      const queueResponse = await fetch(`http://localhost:5000/api/queue/doctor/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        console.log('📋 Raw queue data:', queueData);
        
        // Transform the data to match frontend expectations
        const transformedData = queueData.map((queueEntry, index) => ({
          id: queueEntry._id,
          patientId: queueEntry.patientId._id,
          patientName: queueEntry.patientId.name,
          phone: queueEntry.patientId.phone,
          city: queueEntry.patientId.city,
          status: queueEntry.status,
          position: queueEntry.position,
          priority: queueEntry.priority,
          joinTime: queueEntry.createdAt,
          ticketNumber: queueEntry._id.toString().slice(-6).toUpperCase(),
          symptoms: queueEntry.notes || 'No symptoms mentioned',
          estimatedWaitTime: queueEntry.estimatedWaitTime
        }));
        
        console.log('🔄 Transformed queue data:', transformedData);
        setCurrentQueue(transformedData || []);
      } else {
        console.error('Failed to fetch queue data');
        setCurrentQueue([]);
      }

      // Fetch stats from API
      const statsResponse = await fetch(`http://localhost:5000/api/doctor/stats/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        console.error('Failed to fetch stats');
        setStats({
          totalPatients: 0,
          completedToday: 0,
          averageConsultationTime: '0 minutes',
          queueLength: 0,
          weeklyTrend: '0%'
        });
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueData = async () => {
    console.log('🔄 Fetching queue data for doctor:', user?.id);
    // Refresh queue data
    fetchDashboardData();
  };

  const handlePatientAction = async (queueId, action) => {
    try {
      console.log('🔄 handlePatientAction called with:', { queueId, action });
      console.log('👤 Current user ID:', user?.id);
      console.log('📋 Current queue data:', currentQueue);
      
      let endpoint;
      let body = {};
      
      if (action === 'in-consultation') {
        endpoint = '/api/queue/start-consultation';
        body = { queueId };
      } else if (action === 'completed') {
        endpoint = '/api/queue/complete-consultation';
        body = { queueId };
      } else {
        // For skipped/cancelled, we'll update the status directly
        endpoint = `/api/queue/${queueId}/status`;
        body = { status: action };
      }

      console.log('📤 Making request to:', endpoint);
      console.log('📤 Request body:', body);

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Request successful');
        const responseData = await response.json();
        console.log('📥 Response data:', responseData);
        // Refresh queue data to get updated information
        fetchDashboardData();
        
        // Set current patient if starting consultation
        if (action === 'in-consultation') {
          const patient = currentQueue.find(p => p.id === queueId);
          if (patient) {
            setCurrentPatient(patient);
          }
        } else if (action === 'completed' || action === 'skipped') {
          setCurrentPatient(null);
        }
        
        toast.success(`Patient ${action === 'in-consultation' ? 'started consultation' : action}`);
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('patient-status-updated', {
            doctorId: user?.id,
            queueId,
            status: action
          });
        }
      } else {
        const errorData = await response.json();
        console.log('❌ Request failed:', errorData);
        toast.error(errorData.message || 'Failed to update patient status');
      }
    } catch (error) {
      console.error('Error updating patient status:', error);
      toast.error('Failed to update patient status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dr. {user?.name}</h1>
              <p className="text-gray-600">{user?.specialization} • Managing your patient queue</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Current Queue</div>
                <div className="text-2xl font-bold text-blue-600">{stats?.queueLength || 0}</div>
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Start Consultation
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Patient (if any) */}
            {currentPatient && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Currently Consulting</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-100">
                    In Consultation
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{currentPatient?.patientName || 'N/A'}</h3>
                    <p className="text-gray-600 mb-2">Ticket #{currentPatient?.ticketNumber || 'N/A'}</p>
                    <p className="text-gray-600 mb-4">{currentPatient?.symptoms || 'N/A'}</p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedPatient(currentPatient);
                          setShowPrescriptionModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Write Prescription
                      </button>
                      <button 
                        onClick={() => handlePatientAction(currentPatient.id, 'completed')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Complete
                      </button>
                      <button 
                        onClick={() => handlePatientAction(currentPatient.id, 'skipped')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Started at</div>
                    <div className="text-lg font-medium">
                      {currentPatient?.joinTime ? new Date(currentPatient.joinTime).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Queue */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Patient Queue</h2>
                <p className="text-sm text-gray-600">Manage your waiting patients</p>
              </div>
              <div className="divide-y">
                {currentQueue.map((patient) => (
                  <div key={patient.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{patient?.patientName || 'N/A'}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient?.priority || 'normal')}`}>
                            {patient?.priority || 'normal'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient?.status || 'waiting')}`}>
                            {patient?.status || 'waiting'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Ticket #{patient?.ticketNumber || 'N/A'} • Position #{patient?.position || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mb-2">{patient?.symptoms || 'N/A'}</p>
                        <p className="text-xs text-gray-500">
                          Joined {patient?.joinTime ? new Date(patient.joinTime).toLocaleTimeString() : 'N/A'} {patient?.joinTime ? `(${Math.floor((Date.now() - new Date(patient.joinTime).getTime()) / (1000 * 60))} min ago)` : ''}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {patient.status === 'waiting' && (
                          <>
                            <button
                              onClick={() => handlePatientAction(patient.id, 'in-consultation')}
                              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPrescriptionModal(true);
                              }}
                              className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Prescription
                            </button>
                            <button
                              onClick={() => handlePatientAction(patient.id, 'skipped')}
                              className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                            >
                              Skip
                            </button>
                          </>
                        )}
                        {patient.status === 'in-consultation' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPrescriptionModal(true);
                              }}
                              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Prescription
                            </button>
                            <button
                              onClick={() => handlePatientAction(patient.id, 'completed')}
                              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handlePatientAction(patient.id, 'skipped')}
                              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              No Show
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalPatients || 0}</div>
                  <div className="text-sm text-gray-600">Total Patients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats?.completedToday || 0}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats?.queueLength || 0}</div>
                  <div className="text-sm text-gray-600">In Queue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats?.averageConsultationTime || 0}</div>
                  <div className="text-sm text-gray-600">Avg Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor Profile</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">Dr. {user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Specialization:</span>
                  <span className="font-medium">{user?.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium">{user?.experience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium">₹{user?.consultationFee}</span>
                </div>
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trend</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats?.weeklyTrend || 0}</div>
                  <div className="text-sm text-gray-600">vs last week</div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Update Availability
                </button>
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                  View Schedule
                </button>
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                  Consultation History
                </button>
                <button 
                  onClick={() => {
                    setSelectedPatient({ patientName: 'New Patient', ticketNumber: 'N/A' });
                    setShowPrescriptionModal(true);
                  }}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  New Prescription
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">New patient joined</div>
                    <div className="text-gray-600">Patient - Position #4</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Queue updated</div>
                    <div className="text-gray-600">3 patients waiting</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Write Prescription</h2>
                                  <p className="text-gray-600">Patient: {selectedPatient?.patientName || 'N/A'} (Ticket #{selectedPatient?.ticketNumber || 'N/A'})</p>
              </div>
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setSelectedPatient(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <Prescription
                mode="write"
                onSave={async (prescriptionData) => {
                  try {
                    // Add patient ID to prescription data
                    const fullPrescriptionData = {
                      ...prescriptionData,
                      patientId: selectedPatient.patientId
                    };
                    
                    console.log('Saving prescription data:', fullPrescriptionData);
                    
                    // Save prescription to backend
                    await prescriptionService.createPrescription(fullPrescriptionData);
                    
                    toast.success('Prescription saved successfully!');
                    setShowPrescriptionModal(false);
                    setSelectedPatient(null);
                  } catch (error) {
                    console.error('Error saving prescription:', error);
                    toast.error('Failed to save prescription. Please try again.');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
