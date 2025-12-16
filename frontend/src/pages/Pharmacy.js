import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Phone, 
  Star, 
  ShoppingCart,
  Package,
  Truck,
  Plus,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';

const Pharmacy = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('pharmacies');
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('address'); // 'address', 'payment', 'review'
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'card', 'upi'
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    fetchPharmacies();
    fetchMedicines();
  }, []);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API calls
      const mockPharmacies = [
        {
          id: 'p1',
          name: 'City Pharmacy',
          address: '123 Main Street, Andheri West, Mumbai',
          city: 'Mumbai',
          phone: '+91 98765 43210',
          rating: 4.5,
          deliveryAvailable: true,
          deliveryFee: 50,
          minOrderAmount: 200,
          workingHours: '8:00 AM - 10:00 PM',
          distance: '2.5 km'
        },
        {
          id: 'p2',
          name: 'Health First Pharmacy',
          address: '456 Park Road, Bandra East, Mumbai',
          city: 'Mumbai',
          phone: '+91 98765 43211',
          rating: 4.8,
          deliveryAvailable: true,
          deliveryFee: 40,
          minOrderAmount: 150,
          workingHours: '9:00 AM - 11:00 PM',
          distance: '1.8 km'
        },
        {
          id: 'p3',
          name: 'MedPlus Store',
          address: '789 Lake View, Juhu, Mumbai',
          city: 'Mumbai',
          phone: '+91 98765 43212',
          rating: 4.3,
          deliveryAvailable: false,
          deliveryFee: 0,
          minOrderAmount: 100,
          workingHours: '7:00 AM - 9:00 PM',
          distance: '3.2 km'
        }
      ];

      setPharmacies(mockPharmacies);
    } catch (error) {
      toast.error('Failed to fetch pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockMedicines = [
        {
          id: 'm1',
          name: 'Paracetamol 500mg',
          genericName: 'Acetaminophen',
          brand: 'Crocin',
          category: 'Pain Relief',
          dosage: 'Tablet',
          strength: '500mg',
          prescriptionRequired: false,
          price: 15,
          stock: 50,
          description: 'Relieves fever and pain'
        },
        {
          id: 'm2',
          name: 'Amoxicillin 250mg',
          genericName: 'Amoxicillin',
          brand: 'Novamox',
          category: 'Antibiotic',
          dosage: 'Capsule',
          strength: '250mg',
          prescriptionRequired: true,
          price: 45,
          stock: 30,
          description: 'Broad-spectrum antibiotic'
        },
        {
          id: 'm3',
          name: 'Omeprazole 20mg',
          genericName: 'Omeprazole',
          brand: 'Omez',
          category: 'Gastric',
          dosage: 'Capsule',
          strength: '20mg',
          prescriptionRequired: false,
          price: 35,
          stock: 25,
          description: 'Reduces stomach acid production'
        },
        {
          id: 'm4',
          name: 'Cetirizine 10mg',
          genericName: 'Cetirizine',
          brand: 'Alerid',
          category: 'Antiallergic',
          dosage: 'Tablet',
          strength: '10mg',
          prescriptionRequired: false,
          price: 25,
          stock: 40,
          description: 'Relieves allergy symptoms'
        },
        {
          id: 'm5',
          name: 'Metformin 500mg',
          genericName: 'Metformin',
          brand: 'Glycomet',
          category: 'Diabetes',
          dosage: 'Tablet',
          strength: '500mg',
          prescriptionRequired: true,
          price: 55,
          stock: 20,
          description: 'Oral diabetes medication'
        },
        {
          id: 'm6',
          name: 'Ibuprofen 400mg',
          genericName: 'Ibuprofen',
          brand: 'Brufen',
          category: 'Pain Relief',
          dosage: 'Tablet',
          strength: '400mg',
          prescriptionRequired: false,
          price: 20,
          stock: 35,
          description: 'Anti-inflammatory pain reliever'
        },
        {
          id: 'm7',
          name: 'Azithromycin 500mg',
          genericName: 'Azithromycin',
          brand: 'Zithromax',
          category: 'Antibiotic',
          dosage: 'Tablet',
          strength: '500mg',
          prescriptionRequired: true,
          price: 65,
          stock: 15,
          description: 'Macrolide antibiotic'
        },
        {
          id: 'm8',
          name: 'Pantoprazole 40mg',
          genericName: 'Pantoprazole',
          brand: 'Pan-40',
          category: 'Gastric',
          dosage: 'Tablet',
          strength: '40mg',
          prescriptionRequired: false,
          price: 40,
          stock: 30,
          description: 'Proton pump inhibitor'
        }
      ];

      setMedicines(mockMedicines);
    } catch (error) {
      toast.error('Failed to fetch medicines');
    }
  };

  const addToCart = (medicine) => {
    const existingItem = cart.find(item => item.id === medicine.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
    toast.success(`${medicine.name} added to cart`);
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.id !== medicineId));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (medicineId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCart(cart.map(item =>
      item.id === medicineId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowCheckoutModal(true);
    setCheckoutStep('address');
  };

  const handleAddressSubmit = () => {
    if (!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.address || 
        !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCheckoutStep('payment');
  };

  const handlePaymentSubmit = () => {
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiry || !cardDetails.cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        toast.error('Please enter UPI ID');
        return;
      }
    }
    setCheckoutStep('review');
  };

  const handlePlaceOrder = () => {
    // Here you would typically send the order to your backend
    const orderData = {
      items: cart,
      deliveryAddress,
      paymentMethod,
      paymentDetails: paymentMethod === 'card' ? cardDetails : paymentMethod === 'upi' ? { upiId } : {},
      total: getCartTotal(),
      deliveryFee: 50, // You can make this dynamic based on pharmacy
      grandTotal: getCartTotal() + 50
    };
    
    console.log('Order placed:', orderData);
    toast.success('Order placed successfully!');
    setCart([]);
    setShowCheckoutModal(false);
    setCheckoutStep('address');
    setDeliveryAddress({
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    });
    setPaymentMethod('cod');
    setCardDetails({
      cardNumber: '',
      cardHolder: '',
      expiry: '',
      cvv: ''
    });
    setUpiId('');
  };

  const resetCheckout = () => {
    setShowCheckoutModal(false);
    setCheckoutStep('address');
    setDeliveryAddress({
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    });
    setPaymentMethod('cod');
    setCardDetails({
      cardNumber: '',
      cardHolder: '',
      expiry: '',
      cvv: ''
    });
    setUpiId('');
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const getCities = () => {
    return [...new Set(pharmacies.map(pharmacy => pharmacy.city))];
  };

  const handleViewMedicines = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setShowMedicineModal(true);
  };

  const closeMedicineModal = () => {
    setShowMedicineModal(false);
    setSelectedPharmacy(null);
    setMedicineSearchTerm('');
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
    medicine.genericName.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
    medicine.brand.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
    medicine.category.toLowerCase().includes(medicineSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pharmacies...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Pharmacy & Medicines</h1>
              <p className="text-gray-600">Find pharmacies and order medicines</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pharmacies')}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-l-lg transition-colors ${
                activeTab === 'pharmacies'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Find Pharmacies
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-r-lg transition-colors ${
                activeTab === 'medicines'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Browse Medicines
            </button>
          </div>
        </div>

        {/* Pharmacies Tab */}
        {activeTab === 'pharmacies' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search pharmacies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </div>
              )}
            </div>

            {/* Pharmacy List */}
            <div className="space-y-4">
              {pharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{pharmacy.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-current" />
                            <span className="font-medium">{pharmacy.rating}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          pharmacy.deliveryAvailable ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {pharmacy.deliveryAvailable ? 'Delivery Available' : 'Pickup Only'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{pharmacy.address}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{pharmacy.phone}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{pharmacy.workingHours}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="h-4 w-4 mr-2" />
                          <span>{pharmacy.distance}</span>
                        </div>
                      </div>

                      {pharmacy.deliveryAvailable && (
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">
                            Delivery fee: ₹{pharmacy.deliveryFee}
                          </span>
                          <span className="text-gray-600">
                            Min order: ₹{pharmacy.minOrderAmount}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <button 
                          onClick={() => handleViewMedicines(pharmacy)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-2"
                        >
                          View Medicines
                        </button>
                        <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Contact
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

                            {/* Medicine List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMedicines.map((medicine) => (
                <div key={medicine.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{medicine.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{medicine.genericName}</p>
                    <p className="text-sm text-blue-600 font-medium">{medicine.brand}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{medicine.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dosage:</span>
                      <span className="font-medium">{medicine.dosage} {medicine.strength}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium">{medicine.stock} available</span>
                    </div>
                    {medicine.prescriptionRequired && (
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Prescription Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-gray-900">₹{medicine.price}</div>
                    <button
                      onClick={() => addToCart(medicine)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shopping Cart Sidebar */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Cart ({cart.length} items)</span>
                <span className="font-bold">₹{getCartTotal()}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        )}

        {/* Desktop Shopping Cart */}
        <div className="hidden lg:block fixed right-8 top-32 w-80 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
            <p className="text-sm text-gray-600">{cart.length} items</p>
          </div>
          
          {cart.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-600">₹{item.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex justify-between mb-3">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-lg">₹{getCartTotal()}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>

        {/* Medicine Modal */}
        {showMedicineModal && selectedPharmacy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPharmacy.name} - Medicines</h2>
                  <p className="text-gray-600">{selectedPharmacy.address}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <button
                  onClick={closeMedicineModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search medicines in this pharmacy..."
                      value={medicineSearchTerm}
                      onChange={(e) => setMedicineSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Pharmacy Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">{selectedPharmacy.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">{selectedPharmacy.workingHours}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">{selectedPharmacy.distance}</span>
                    </div>
                  </div>
                  {selectedPharmacy.deliveryAvailable && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Delivery Fee: ₹{selectedPharmacy.deliveryFee}</span>
                        <span className="text-gray-700">Min Order: ₹{selectedPharmacy.minOrderAmount}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Medicine List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {medicines.map((medicine) => (
                    <div key={medicine.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{medicine.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">{medicine.genericName}</p>
                        <p className="text-sm text-blue-600 font-medium">{medicine.brand}</p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">{medicine.category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Dosage:</span>
                          <span className="font-medium">{medicine.dosage} {medicine.strength}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Stock:</span>
                          <span className="font-medium">{medicine.stock} available</span>
                        </div>
                        {medicine.prescriptionRequired && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Prescription Required
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="text-xl font-bold text-gray-900">₹{medicine.price}</div>
                        <button
                          onClick={() => {
                            addToCart(medicine);
                            toast.success(`${medicine.name} added to cart from ${selectedPharmacy.name}`);
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {filteredMedicines.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {medicineSearchTerm ? 'No medicines found' : 'No medicines available'}
                    </h3>
                    <p className="text-gray-600">
                      {medicineSearchTerm 
                        ? `No medicines match "${medicineSearchTerm}" in this pharmacy.`
                        : 'This pharmacy currently has no medicines in stock.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className={`flex items-center space-x-2 ${checkoutStep === 'address' ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        checkoutStep === 'address' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        1
                      </div>
                      <span className="text-sm font-medium">Address</span>
                    </div>
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                    <div className={`flex items-center space-x-2 ${checkoutStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        checkoutStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        2
                      </div>
                      <span className="text-sm font-medium">Payment</span>
                    </div>
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                    <div className={`flex items-center space-x-2 ${checkoutStep === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        checkoutStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        3
                      </div>
                      <span className="text-sm font-medium">Review</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={resetCheckout}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Address Step */}
                {checkoutStep === 'address' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={deliveryAddress.fullName}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, fullName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          value={deliveryAddress.phone}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value.replace(/\D/g, '')})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your phone number"
                          maxLength="10"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                        <textarea
                          value={deliveryAddress.address}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your complete address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                        <input
                          type="text"
                          value={deliveryAddress.state}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your state"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                        <input
                          type="text"
                          value={deliveryAddress.pincode}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value.replace(/\D/g, '')})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter pincode"
                          maxLength="6"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                        <input
                          type="text"
                          value={deliveryAddress.landmark}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, landmark: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Near hospital, mall, etc."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddressSubmit}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* Payment Step */}
                {checkoutStep === 'payment' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                           onClick={() => setPaymentMethod('cod')}>
                        <input
                          type="radio"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Cash on Delivery</div>
                          <div className="text-sm text-gray-600">Pay when you receive your order</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                           onClick={() => setPaymentMethod('card')}>
                        <input
                          type="radio"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Credit/Debit Card</div>
                          <div className="text-sm text-gray-600">Secure payment with your card</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                           onClick={() => setPaymentMethod('upi')}>
                        <input
                          type="radio"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">UPI Payment</div>
                          <div className="text-sm text-gray-600">Pay using UPI apps like Google Pay, PhonePe</div>
                        </div>
                      </div>
                    </div>

                    {/* Card Details */}
                    {paymentMethod === 'card' && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900">Card Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                            <input
                              type="text"
                              value={cardDetails.cardNumber}
                              onChange={(e) => setCardDetails({...cardDetails, cardNumber: formatCardNumber(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="1234 5678 9012 3456"
                              maxLength="19"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Card Holder Name</label>
                            <input
                              type="text"
                              value={cardDetails.cardHolder}
                              onChange={(e) => setCardDetails({...cardDetails, cardHolder: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                            <input
                              type="text"
                              value={cardDetails.expiry}
                              onChange={(e) => setCardDetails({...cardDetails, expiry: formatExpiry(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="MM/YY"
                              maxLength="5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                            <input
                              type="text"
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="123"
                              maxLength="4"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI Details */}
                    {paymentMethod === 'upi' && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900">UPI Details</h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="username@upi"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        onClick={() => setCheckoutStep('address')}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePaymentSubmit}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Continue to Review
                      </button>
                    </div>
                  </div>
                )}

                {/* Review Step */}
                {checkoutStep === 'review' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Order Review</h3>
                    
                    {/* Delivery Address */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Delivery Address</h4>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{deliveryAddress.fullName}</p>
                        <p>{deliveryAddress.address}</p>
                        <p>{deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}</p>
                        {deliveryAddress.landmark && <p>Landmark: {deliveryAddress.landmark}</p>}
                        <p>Phone: {deliveryAddress.phone}</p>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} × {item.quantity}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>₹{getCartTotal()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Delivery Fee:</span>
                            <span>₹50</span>
                          </div>
                          <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
                            <span>Total:</span>
                            <span>₹{getCartTotal() + 50}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
                      <div className="text-sm text-gray-600">
                        {paymentMethod === 'cod' && 'Cash on Delivery'}
                        {paymentMethod === 'card' && 'Credit/Debit Card'}
                        {paymentMethod === 'upi' && `UPI Payment (${upiId})`}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button
                        onClick={() => setCheckoutStep('payment')}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pharmacy;
