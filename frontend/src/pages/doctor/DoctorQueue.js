import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  TrendingUp,
  User,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorQueue = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [queueData, setQueueData] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queueStats, setQueueStats] = useState({
    total: 0,
    waiting: 0,
    inConsultation: 0,
    completed: 0,
    averageWaitTime: 0
  });

  useEffect(() => {
    fetchQueueData();
    
    // Set up real-time updates
    if (socket) {
      socket.on('queue-updated', handleQueueUpdate);
      socket.on('newQueue', handleNewQueue);
      
      return () => {
        socket.off('queue-updated');
        socket.off('newQueue');
      };
    }
  }, [socket]);

  const fetchQueueData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/queue/doctor/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Raw queue data:', data);
        
        // Transform the data to match frontend expectations
        const transformedData = data.map((queueEntry, index) => ({
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
        setQueueData(transformedData);
        updateQueueStats(transformedData);
      } else {
        console.error('Failed to fetch queue data');
        setQueueData([]);
      }
    } catch (error) {
      console.error('Error fetching queue data:', error);
      toast.error('Failed to fetch queue data');
    } finally {
      setLoading(false);
    }
  };

  const handleQueueUpdate = (data) => {
    console.log('🔄 Queue update received:', data);
    if (data.doctorId === user?.id) {
      fetchQueueData();
      toast.success('Queue updated!');
    }
  };

  const handleNewQueue = (data) => {
    console.log('🆕 New queue received:', data);
    if (data.doctorId === user?.id) {
      fetchQueueData();
      toast.success('New patient joined your queue!');
    }
  };

  const updateQueueStats = (queue) => {
    const stats = {
      total: queue.length,
      waiting: queue.filter(p => p.status === 'waiting').length,
      inConsultation: queue.filter(p => p.status === 'in-consultation').length,
      completed: queue.filter(p => p.status === 'completed').length,
      averageWaitTime: calculateAverageWaitTime(queue)
    };
    setQueueStats(stats);
  };

  const calculateAverageWaitTime = (queue) => {
    const waitingPatients = queue.filter(p => p.status === 'waiting' && p.joinTime);
    if (waitingPatients.length === 0) return 0;
    
    const totalWaitTime = waitingPatients.reduce((total, patient) => {
      const joinTime = new Date(patient.joinTime);
      const now = new Date();
      return total + (now - joinTime);
    }, 0);
    
    return Math.round(totalWaitTime / waitingPatients.length / (1000 * 60)); // in minutes
  };

  const handlePatientAction = async (queueId, action) => {
    try {
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

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        // Refresh queue data to get updated information
        fetchQueueData();
        
        // Set current patient if starting consultation
        if (action === 'in-consultation') {
          const patient = queueData.find(p => p.id === queueId);
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
        toast.error(errorData.message || 'Failed to update patient status');
      }
    } catch (error) {
      console.error('Error updating patient status:', error);
      toast.error('Failed to update patient status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-consultation':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'skipped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatWaitTime = (joinTime) => {
    if (!joinTime) return 'N/A';
    const join = new Date(joinTime);
    const now = new Date();
    const diffMs = now - join;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading queue data...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Queue Management</h1>
              <p className="text-gray-600">Manage your patient queue efficiently</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchQueueData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Queue Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{queueStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-gray-900">{queueStats.waiting}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Consultation</p>
                <p className="text-2xl font-bold text-gray-900">{queueStats.inConsultation}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{queueStats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
                <p className="text-2xl font-bold text-gray-900">{queueStats.averageWaitTime}m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Patient Section */}
        {currentPatient && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Currently Consulting</h2>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
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
          
          {queueData.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients in queue</h3>
              <p className="text-gray-600">Patients will appear here when they join your queue</p>
            </div>
          ) : (
            <div className="divide-y">
              {queueData.map((patient, index) => (
                <div key={patient.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {patient?.patientName || 'N/A'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient?.priority || 'normal')}`}>
                          {patient?.priority || 'normal'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient?.status || 'waiting')}`}>
                          {patient?.status || 'waiting'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          Ticket #{patient?.ticketNumber || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          Position #{patient?.position || index + 1}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {formatWaitTime(patient?.joinTime)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Symptoms:</strong> {patient?.symptoms || 'N/A'}
                      </p>
                      
                      {patient?.phone && (
                        <p className="text-sm text-gray-600">
                          <Phone className="w-4 h-4 inline mr-2" />
                          {patient.phone}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      {patient?.status === 'waiting' && (
                        <>
                          <button
                            onClick={() => handlePatientAction(patient.id, 'in-consultation')}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </button>
                          <button
                            onClick={() => {
                              // Open prescription modal for waiting patient
                              const prescriptionModal = document.createElement('div');
                              prescriptionModal.innerHTML = `
                                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                  <div class="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                                    <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                      <div>
                                        <h2 class="text-2xl font-bold text-gray-900">Write Prescription</h2>
                                        <p class="text-gray-600">Patient: ${patient.patientName} (Ticket #${patient.ticketNumber})</p>
                                      </div>
                                      <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 transition-colors">
                                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                      </button>
                                    </div>
                                    <div class="p-6">
                                      <p class="text-gray-600">Prescription functionality will be implemented here.</p>
                                    </div>
                                  </div>
                                </div>
                              `;
                              document.body.appendChild(prescriptionModal.firstElementChild);
                            }}
                            className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Prescription
                          </button>
                          <button
                            onClick={() => handlePatientAction(patient.id, 'skipped')}
                            className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm flex items-center"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Skip
                          </button>
                        </>
                      )}
                      
                      {patient?.status === 'in-consultation' && (
                        <>
                          <button
                            onClick={() => {
                              // Open prescription modal for in-consultation patient
                              const prescriptionModal = document.createElement('div');
                              prescriptionModal.innerHTML = `
                                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                  <div class="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                                    <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                      <div>
                                        <h2 class="text-2xl font-bold text-gray-900">Write Prescription</h2>
                                        <p class="text-gray-600">Patient: ${patient.patientName} (Ticket #${patient.ticketNumber})</p>
                                      </div>
                                      <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 transition-colors">
                                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                      </button>
                                    </div>
                                    <div class="p-6">
                                      <p class="text-gray-600">Prescription functionality will be implemented here.</p>
                                    </div>
                                  </div>
                                </div>
                              `;
                              document.body.appendChild(prescriptionModal.firstElementChild);
                            }}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Prescription
                          </button>
                          <button
                            onClick={() => handlePatientAction(patient.id, 'completed')}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </button>
                          <button
                            onClick={() => handlePatientAction(patient.id, 'skipped')}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            No Show
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorQueue;
