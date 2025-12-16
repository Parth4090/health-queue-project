import React, { useState, useEffect } from 'react';
import { Clock, Users, MapPin, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';
import { queueService } from '../services/queueService';

const QueueStatus = ({ patientId }) => {
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchQueueStatus();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchQueueStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [patientId]);

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      const result = await queueService.getPatientQueueStatus();
      setQueueStatus(result.queueEntry);
      setError(null);
    } catch (error) {
      if (error.response?.status === 404) {
        setQueueStatus(null);
        setError(null);
      } else {
        setError('Failed to fetch queue status');
        console.error('Error fetching queue status:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    try {
      await queueService.leaveQueue(queueStatus._id);
      setQueueStatus(null);
      // You can add success notification here
    } catch (error) {
      console.error('Error leaving queue:', error);
      setError('Failed to leave queue');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading queue status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchQueueStatus}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!queueStatus) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Not in Queue</h3>
          <p className="text-gray-600">You are not currently in any doctor's queue</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'text-orange-600 bg-orange-100';
      case 'in-consultation':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-5 w-5" />;
      case 'in-consultation':
        return <Stethoscope className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Queue Status</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(queueStatus.status)}`}>
          {getStatusIcon(queueStatus.status)}
          <span className="ml-2 capitalize">{queueStatus.status.replace('-', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Stethoscope className="h-5 w-5 mr-2" />
            Doctor Information
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-blue-800">
              <span className="font-medium">Name:</span> Dr. {queueStatus.doctorId?.name}
            </p>
            <p className="text-blue-800">
              <span className="font-medium">Specialization:</span> {queueStatus.doctorId?.specialization}
            </p>
            <p className="text-blue-800 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="font-medium">Location:</span> {queueStatus.doctorId?.city}
            </p>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-4">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Queue Information
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-green-800">
              <span className="font-medium">Position:</span> #{queueStatus.position}
            </p>
            <p className="text-green-800">
              <span className="font-medium">Estimated Wait:</span> {queueStatus.estimatedWaitTime} minutes
            </p>
            <p className="text-green-800">
              <span className="font-medium">Joined:</span> {new Date(queueStatus.createdAt).toLocaleTimeString()}
            </p>
            {queueStatus.consultationStartTime && (
              <p className="text-green-800">
                <span className="font-medium">Consultation Started:</span> {new Date(queueStatus.consultationStartTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {queueStatus.status === 'waiting' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-orange-800 font-medium">
                You are currently #{queueStatus.position} in the queue
              </span>
            </div>
            <button
              onClick={leaveQueue}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Leave Queue
            </button>
          </div>
          <p className="text-orange-700 text-sm mt-2">
            Estimated wait time: {queueStatus.estimatedWaitTime} minutes
          </p>
        </div>
      )}

      {queueStatus.status === 'in-consultation' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">
              Your consultation is in progress. Please wait for the doctor to complete.
            </span>
          </div>
        </div>
      )}

      {queueStatus.notes && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
          <p className="text-gray-700">{queueStatus.notes}</p>
        </div>
      )}
    </div>
  );
};

export default QueueStatus;
