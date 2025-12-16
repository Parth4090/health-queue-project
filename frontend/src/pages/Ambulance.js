import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Star, 
  AlertTriangle,
  Navigation,
  Shield,
  Zap,
  Cross,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Ambulance = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  useEffect(() => {
    fetchAmbulances();
    getCurrentLocation();
  }, []);

  const fetchAmbulances = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API calls
      const mockAmbulances = [
        {
          id: 'a1',
          providerName: 'City Emergency Services',
          city: 'Mumbai',
          phone: '+91 98765 43210',
          address: '123 Emergency Lane, Andheri West',
          rating: 4.8,
          responseTime: '5-8 minutes',
          serviceArea: '10 km radius',
          type: 'Basic Life Support',
          equipment: ['Oxygen', 'Defibrillator', 'First Aid Kit'],
          staff: ['Driver', 'EMT', 'Nurse'],
          fare: {
            base: 500,
            perKm: 25,
            waiting: 100
          },
          availability: 'Available 24/7',
          currentStatus: 'Available'
        },
        {
          id: 'a2',
          providerName: 'Metro Ambulance Network',
          city: 'Mumbai',
          phone: '+91 98765 43211',
          address: '456 Health Street, Bandra East',
          rating: 4.6,
          responseTime: '8-12 minutes',
          serviceArea: '15 km radius',
          type: 'Advanced Life Support',
          equipment: ['Ventilator', 'ECG Machine', 'ICU Equipment'],
          staff: ['Driver', 'Paramedic', 'Doctor'],
          fare: {
            base: 800,
            perKm: 30,
            waiting: 150
          },
          availability: 'Available 24/7',
          currentStatus: 'Available'
        },
        {
          id: 'a3',
          providerName: 'Rapid Response Ambulance',
          city: 'Mumbai',
          phone: '+91 98765 43212',
          address: '789 Quick Lane, Juhu',
          rating: 4.9,
          responseTime: '3-6 minutes',
          serviceArea: '8 km radius',
          type: 'Critical Care',
          equipment: ['ICU Bed', 'Ventilator', 'Monitoring Systems'],
          staff: ['Driver', 'Critical Care Nurse', 'Emergency Doctor'],
          fare: {
            base: 1200,
            perKm: 40,
            waiting: 200
          },
          availability: 'Available 24/7',
          currentStatus: 'Available'
        }
      ];

      setAmbulances(mockAmbulances);
    } catch (error) {
      toast.error('Failed to fetch ambulance services');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const handleEmergencySOS = () => {
    setEmergencyMode(true);
    toast.success('Emergency mode activated! Finding nearest ambulance...');
    
    // Simulate finding nearest ambulance
    setTimeout(() => {
      const nearest = ambulances[0]; // Mock nearest ambulance
      setSelectedAmbulance(nearest);
      toast.success(`Nearest ambulance: ${nearest.providerName}`);
    }, 2000);
  };

  const handleBookAmbulance = async (ambulanceId) => {
    try {
      const ambulance = ambulances.find(a => a.id === ambulanceId);
      setSelectedAmbulance(ambulance);
      
      // Mock booking process
      setBookingStatus('booking');
      
      setTimeout(() => {
        setBookingStatus('confirmed');
        toast.success(`Ambulance booked! ${ambulance.providerName} is on the way.`);
        
        // Simulate ambulance arrival
        setTimeout(() => {
          setBookingStatus('arrived');
          toast.success('Ambulance has arrived at your location!');
        }, 10000);
      }, 3000);
      
    } catch (error) {
      toast.error('Failed to book ambulance');
    }
  };

  const cancelEmergency = () => {
    setEmergencyMode(false);
    setSelectedAmbulance(null);
    setBookingStatus(null);
    toast.success('Emergency cancelled');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'text-green-600 bg-green-100';
      case 'Busy':
        return 'text-yellow-600 bg-yellow-100';
      case 'Offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Basic Life Support':
        return 'text-blue-600 bg-blue-100';
      case 'Advanced Life Support':
        return 'text-purple-600 bg-purple-100';
      case 'Critical Care':
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
          <p className="mt-4 text-gray-600">Finding ambulance services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Emergency SOS Button */}
      {emergencyMode && (
        <div className="fixed inset-0 bg-red-600 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <AlertTriangle className="h-24 w-24 mx-auto mb-6 animate-pulse" />
            <h1 className="text-4xl font-bold mb-4">EMERGENCY SOS</h1>
            <p className="text-xl mb-6">Ambulance is being dispatched to your location</p>
            
            {selectedAmbulance && (
              <div className="bg-white bg-opacity-20 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-2">{selectedAmbulance.providerName}</h2>
                <p className="text-lg mb-2">Response Time: {selectedAmbulance.responseTime}</p>
                <p className="text-lg mb-4">Phone: {selectedAmbulance.phone}</p>
                
                {bookingStatus === 'confirmed' && (
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg mb-4">
                    <CheckCircle className="h-5 w-5 inline mr-2" />
                    Ambulance Confirmed - On the way!
                  </div>
                )}
                
                {bookingStatus === 'arrived' && (
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-4">
                    <CheckCircle className="h-5 w-5 inline mr-2" />
                    Ambulance has arrived!
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={cancelEmergency}
              className="bg-white text-red-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel Emergency
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Emergency Ambulance Services</h1>
              <p className="text-gray-600">24/7 emergency medical transportation</p>
            </div>
            <button
              onClick={handleEmergencySOS}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center text-lg font-bold"
            >
              <AlertTriangle className="h-6 w-6 mr-2" />
              EMERGENCY SOS
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Location */}
        {currentLocation && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Current Location</h3>
                  <p className="text-gray-600">
                    Latitude: {currentLocation.lat.toFixed(6)}, Longitude: {currentLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
              <button
                onClick={getCurrentLocation}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Location
              </button>
            </div>
          </div>
        )}

        {/* Ambulance Services */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Ambulance Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ambulances.map((ambulance) => (
                <div key={ambulance.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{ambulance.providerName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{ambulance.rating}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ambulance.currentStatus)}`}>
                      {ambulance.currentStatus}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{ambulance.address}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{ambulance.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Response: {ambulance.responseTime}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Navigation className="h-4 w-4 mr-2" />
                      <span>Service Area: {ambulance.serviceArea}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(ambulance.type)}`}>
                      {ambulance.type}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Equipment:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ambulance.equipment.map((item, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Staff:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ambulance.staff.map((member, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm text-gray-600">
                        <div>Base: ₹{ambulance.fare.base}</div>
                        <div>Per km: ₹{ambulance.fare.perKm}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₹{ambulance.fare.base}</div>
                        <div className="text-xs text-gray-500">Starting fare</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleBookAmbulance(ambulance.id)}
                      disabled={ambulance.currentStatus !== 'Available'}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Book Ambulance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Information */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Emergency Information</h3>
                <div className="space-y-2 text-sm text-red-700">
                  <p>• In case of life-threatening emergency, call 108 (National Emergency Number)</p>
                  <p>• Use the SOS button above for immediate ambulance dispatch</p>
                  <p>• Keep your location services enabled for faster response</p>
                  <p>• All ambulances are equipped with basic life support equipment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Safety Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <p className="font-medium mb-1">Before Ambulance Arrives:</p>
                    <ul className="space-y-1">
                      <li>• Keep the patient calm and comfortable</li>
                      <li>• Don't move seriously injured patients</li>
                      <li>• Clear the path for ambulance access</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">During Transport:</p>
                    <ul className="space-y-1">
                      <li>• Follow medical staff instructions</li>
                      <li>• Keep emergency contacts ready</li>
                      <li>• Bring patient's medical history if possible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ambulance;
