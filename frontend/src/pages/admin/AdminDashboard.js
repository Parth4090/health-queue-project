import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Stethoscope, 
  Clock, 
  FileText, 
  LogOut,
  User,
  Settings,
  Bell,
  Search,
  Eye,
  MapPin,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import DoctorVerificationModal from '../../components/admin/DoctorVerificationModal';
import { useSocket } from '../../contexts/SocketContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [adminData, setAdminData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    specialization: '',
    name: ''
  });

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminData');
    
    if (!token || !admin) {
      navigate('/admin/login');
      return;
    }

    setAdminData(JSON.parse(admin));
    fetchDashboardData();

    // Listen for real-time refresh events
    const handleRefresh = () => {
      console.log('🔄 Refreshing admin dashboard...');
      fetchDashboardData();
    };

    window.addEventListener('refreshAdminDashboard', handleRefresh);

    // Socket.IO real-time event listeners
    if (socket && isConnected) {
      // Listen for new verification requests
      socket.on('newDoctorVerification', (data) => {
        console.log('📋 New doctor verification received:', data);
        toast.success(`New verification request from: ${data.data.name}`, {
          duration: 4000,
          icon: '📋'
        });
        fetchDashboardData();
      });

      // Listen for verification status changes
      socket.on('verificationStatusChanged', (data) => {
        console.log('🔄 Verification status changed:', data);
        toast.success(`Verification status updated: ${data.data.status}`, {
          duration: 3000,
          icon: '🔄'
        });
        fetchDashboardData();
      });

      // Listen for dashboard updates
      socket.on('dashboardUpdate', (data) => {
        console.log('📊 Dashboard update received:', data);
        fetchDashboardData();
      });

      // Listen for admin actions
      socket.on('adminAction', (data) => {
        console.log('⚡ Admin action performed:', data);
        fetchDashboardData();
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('refreshAdminDashboard', handleRefresh);
      
      // Cleanup Socket.IO listeners
      if (socket) {
        socket.off('newDoctorVerification');
        socket.off('verificationStatusChanged');
        socket.off('dashboardUpdate');
        socket.off('adminAction');
      }
    };
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch overview data
      const overviewResponse = await fetch('/api/admin/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setOverview(overviewData.overview);
      }

      // Fetch pending verifications
      const verificationsResponse = await fetch('/api/admin/dashboard/verifications/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (verificationsResponse.ok) {
        const verificationsData = await verificationsResponse.json();
        setPendingVerifications(verificationsData.verifications);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const handleViewVerification = (verification) => {
    setSelectedVerification(verification);
    setShowVerificationModal(true);
  };

  const handleVerificationAction = async (action, verificationId, data) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/dashboard/verifications/${verificationId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(`Doctor ${action}d successfully`);
        setShowVerificationModal(false);
        fetchDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${action} doctor`);
      }
    } catch (error) {
      console.error(`Error ${action}ing verification:`, error);
      toast.error(`Failed to ${action} doctor`);
    }
  };

  const filteredVerifications = pendingVerifications.filter(verification => {
    if (filters.city && !verification.personalInfo?.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.specialization && !verification.professionalInfo?.specialization?.toLowerCase().includes(filters.specialization.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Admin Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-purple-600 mr-3" />
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {adminData?.profile?.firstName} {adminData?.profile?.lastName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.totalPatients || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Stethoscope className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Doctors</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.totalDoctors || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Queues</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.activeQueues || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.pendingVerifications || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Verifications Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Doctor Verifications</h2>
              <div className="flex items-center space-x-4">
                {/* Search and Filters */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Cities</option>
                    <option value="Rewa">Rewa</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                  <select
                    value={filters.specialization}
                    onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Specializations</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVerifications.map((verification) => (
                  <tr key={verification._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {verification.personalInfo?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {verification.userId?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Stethoscope className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-900">
                          {verification.professionalInfo?.specialization || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-900">
                          {verification.personalInfo?.city || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-orange-500 mr-2" />
                        <span className="text-sm text-gray-900">
                          {verification.professionalInfo?.experience || 0} years
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewVerification(verification)}
                        className="text-purple-600 hover:text-purple-900 mr-3 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVerifications.length === 0 && (
            <div className="text-center py-12">
              <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending verifications</h3>
              <p className="text-gray-600">All doctor verifications have been processed</p>
            </div>
          )}
        </div>
      </div>

             {/* Doctor Verification Modal */}
       {showVerificationModal && selectedVerification && (
         <DoctorVerificationModal
           verification={selectedVerification}
           onClose={() => setShowVerificationModal(false)}
           onApprove={(notes) => handleVerificationAction('approve', selectedVerification._id, { notes })}
           onReject={(reason, notes) => handleVerificationAction('reject', selectedVerification._id, { reason, notes })}
           onHold={(notes) => handleVerificationAction('hold', selectedVerification._id, { notes })}
           onSuspend={(notes) => handleVerificationAction('suspend', selectedVerification._id, { notes })}
         />
       )}
    </div>
  );
};

export default AdminDashboard;
