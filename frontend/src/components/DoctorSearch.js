import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Stethoscope, Star, Clock, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import { queueService } from '../services/queueService';
import DoctorProfile from './DoctorProfile';
import toast from 'react-hot-toast';

const DoctorSearch = ({ onSelectDoctor, showJoinQueue = true }) => {
  const [doctors, setDoctors] = useState([]);
  const [cities, setCities] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [joiningQueue, setJoiningQueue] = useState({});
  const [filters, setFilters] = useState({
    city: '',
    specialization: ''
  });

  const fetchCities = async () => {
    try {
      const response = await api.get('/doctors/cities/list');
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await api.get('/doctors/specializations/list');
      setSpecializations(response.data);
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.specialization) params.append('specialization', filters.specialization);
      
      const response = await api.get(`/doctors/search?${params.toString()}`);
      console.log('Doctors fetched:', response.data); // Debug log
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.city, filters.specialization]);

  useEffect(() => {
    fetchCities();
    fetchSpecializations();
    fetchDoctors();
  }, [fetchDoctors]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    fetchDoctors();
  };

  const handleJoinQueue = async (doctorId) => {
    try {
      setJoiningQueue(prev => ({ ...prev, [doctorId]: true }));
      
      const result = await queueService.joinQueue(doctorId);
      
      // Show success message
      toast.success('Successfully joined the queue!');
      console.log('Joined queue:', result);
      
      // Close profile if open
      if (showProfile) {
        setShowProfile(false);
        setSelectedDoctor(null);
      }
      
      // Redirect to dashboard after successful join
      setTimeout(() => {
        window.location.href = '/patient/dashboard';
      }, 1500);
      
    } catch (error) {
      console.error('Error joining queue:', error);
      toast.error('Failed to join queue: ' + (error.response?.data?.message || error.message));
    } finally {
      setJoiningQueue(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleViewProfile = (doctor) => {
    setSelectedDoctor(doctor);
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedDoctor(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">


      {/* Search Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Search className="h-6 w-6 mr-3 text-blue-600" />
          Find Doctors
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              City
            </label>
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Stethoscope className="h-4 w-4 inline mr-2" />
              Specialization
            </label>
            <select
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Search Doctors
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Searching for doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          doctors.map((doctor) => (
            <div key={doctor._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {doctor.userId?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Dr. {doctor.userId?.name}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <Stethoscope className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{doctor.specialization}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-green-600" />
                          <span>{doctor.userId?.city}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-orange-600" />
                          <span>{doctor.experience} years experience</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <Star className="h-4 w-4 mr-2 text-yellow-500" />
                          <span>{doctor.rating.toFixed(1)} ({doctor.totalRatings} reviews)</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{doctor.userId?.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{doctor.userId?.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col space-y-3">
                  {showJoinQueue && (
                    <button
                      onClick={() => handleJoinQueue(doctor.userId._id)}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={joiningQueue[doctor.userId._id]}
                    >
                      {joiningQueue[doctor.userId._id] ? 'Joining...' : 'Join Queue'}
                    </button>
                  )}
                  
                                     <button
                     onClick={() => handleViewProfile(doctor)}
                     className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                   >
                     View Profile
                   </button>
                </div>
              </div>
            </div>
          ))
                 )}
       </div>

       {/* Doctor Profile Modal */}
       {showProfile && selectedDoctor && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
             <DoctorProfile
               doctor={selectedDoctor}
               onClose={handleCloseProfile}
               onJoinQueue={handleJoinQueue}
             />
           </div>
         </div>
       )}
     </div>
   );
 };

export default DoctorSearch;
