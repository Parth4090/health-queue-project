import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Phone,
  Calendar,
  Plus,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const QueueJoin = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchTerm, selectedCity, selectedSpecialization, doctors]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      // Fetch doctors from the correct API endpoint
      const response = await fetch('/api/doctors/search', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const doctorsData = await response.json();
        console.log('Doctors fetched:', doctorsData); // Debug log
        setDoctors(doctorsData);
      } else {
        console.error('Failed to fetch doctors');
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(doctor => doctor.userId?.city === selectedCity);
    }

    if (selectedSpecialization) {
      filtered = filtered.filter(doctor => doctor.specialization === selectedSpecialization);
    }

    setFilteredDoctors(filtered);
  };

  const handleJoinQueue = async (doctorId) => {
    try {
      // Find doctor by userId._id
      const doctor = doctors.find(d => d.userId?._id === doctorId);
      
      if (!doctor) {
        toast.error('Doctor not found');
        return;
      }
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('join-queue', {
          doctorId,
          patientId: user?.id,
          patientName: user?.name
        });
      }

      toast.success(`Joined Dr. ${doctor.userId.name}'s queue!`);
      navigate('/patient/dashboard');
    } catch (error) {
      toast.error('Failed to join queue');
    }
  };

  const getCities = () => {
    return [...new Set(doctors.map(doctor => doctor.userId?.city).filter(Boolean))];
  };

  const getSpecializations = () => {
    return [...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))];
  };

  const getWaitTimeColor = (time) => {
    const minutes = parseInt(time);
    if (minutes <= 30) return 'text-green-600';
    if (minutes <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding doctors...</p>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
                <p className="text-gray-600">Join a queue and get consultation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by doctor name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {getCities().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Specializations</option>
                  {getSpecializations().map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div key={doctor._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Doctor Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Dr. {doctor.userId?.name}</h3>
                        <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="font-medium">{doctor.rating || 0}</span>
                        <span className="text-gray-500">({doctor.totalRatings || 0} reviews)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{doctor.qualification}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{doctor.experience} years experience</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{doctor.userId?.city}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>₹{doctor.consultationFee}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doctor.isAvailable ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {doctor.isAvailable ? 'Available' : 'Not Available'}
                      </span>
                      <span className="text-gray-600">
                        Avg. consultation: {doctor.avgConsultationTime} min
                      </span>
                    </div>
                  </div>

                  {/* Queue Status */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-blue-600">{doctor.currentQueueSize || 0}</div>
                        <div className="text-sm text-gray-600">Patients in queue</div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-lg font-semibold text-blue-600">
                          {doctor.avgConsultationTime || 15} min
                        </div>
                        <div className="text-sm text-gray-600">Estimated wait time</div>
                      </div>

                      <button
                        onClick={() => handleJoinQueue(doctor.userId?._id)}
                        disabled={!doctor.isAvailable}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Join Queue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueJoin;
