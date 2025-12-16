import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, 
  User, 
  Stethoscope, 
  Pill, 
  Truck, 
  Shield, 
  Smartphone, 
  TrendingUp,
  Heart,
  Star,
  Zap,
  CheckCircle,
  MapPin
} from 'lucide-react';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Clock className="w-10 h-10 text-blue-600" />,
      title: 'Real-time Queue Management',
      description: 'Join doctor queues remotely and track your position in real-time with live updates.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <User className="w-10 h-10 text-green-600" />,
      title: 'Smart ETA Calculation',
      description: 'Get accurate wait time estimates based on queue position and doctor consultation patterns.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Stethoscope className="w-10 h-10 text-purple-600" />,
      title: 'Doctor Specializations',
      description: 'Find doctors by specialization, location, and availability with detailed profiles.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Pill className="w-10 h-10 text-pink-600" />,
      title: 'Medicine Delivery',
      description: 'Order medicines from local pharmacies with prescription upload and doorstep delivery.',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: <Truck className="w-10 h-10 text-orange-600" />,
      title: 'Emergency Services',
      description: 'Quick access to ambulance services with real-time tracking and emergency response.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: <Shield className="w-10 h-10 text-indigo-600" />,
      title: 'Secure & Private',
      description: 'Your health information is protected with industry-standard security measures.',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Patients Served', icon: <Heart className="w-6 h-6 text-red-500" /> },
    { number: '500+', label: 'Doctors Registered', icon: <Stethoscope className="w-6 h-6 text-blue-500" /> },
    { number: '50+', label: 'Cities Covered', icon: <MapPin className="w-6 h-6 text-green-500" /> },
    { number: '99%', label: 'Satisfaction Rate', icon: <Star className="w-6 h-6 text-yellow-500" /> }
  ];

  const steps = [
    {
      number: '1',
      title: 'Choose Your Doctor',
      description: 'Select from our network of qualified doctors by specialization, location, and availability.',
      icon: <User className="w-8 h-8 text-blue-600" />
    },
    {
      number: '2',
      title: 'Join the Queue',
      description: 'Get your ticket number and join the virtual queue from anywhere, anytime.',
      icon: <Clock className="w-8 h-8 text-green-600" />
    },
    {
      number: '3',
      title: 'Track & Consult',
      description: 'Monitor your position in real-time and get notified when it\'s your turn.',
      icon: <CheckCircle className="w-8 h-8 text-purple-600" />
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-5xl mx-auto">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
                Skip the Wait,{' '}
                <span className="bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent">
                  Get Better
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-blue-100 leading-relaxed max-w-4xl mx-auto">
                Join doctor queues remotely, track your position in real-time, and get accurate wait time estimates. 
                Your health, your time, your convenience.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/register"
                      className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 active:scale-95 flex items-center gap-2"
                    >
                      <Zap className="w-5 h-5 group-hover:animate-pulse" />
                      Get Started Free
                    </Link>
                    <Link
                      to="/login"
                      className="group border-2 border-white text-white hover:bg-white hover:text-blue-700 px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl active:scale-95 flex items-center gap-2"
                    >
                      <User className="w-5 h-5 group-hover:animate-pulse" />
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    to={user?.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'}
                    className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 active:scale-95 flex items-center gap-2"
                  >
                    <Zap className="w-5 h-5 group-hover:animate-pulse" />
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
        <div className="relative container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`text-center group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${index * 100}ms`}}
              >
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <div className="flex justify-center mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2760%27%20height%3D%2760%27%20viewBox%3D%270%200%2060%2060%27%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%3E%3Cg%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%3E%3Cg%20fill%3D%27%239C92AC%27%20fill-opacity%3D%270.05%27%3E%3Ccircle%20cx%3D%2730%27%20cy%3D%2730%27%20r%3D%272%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-20">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Why Choose{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Health Queue?
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our platform revolutionizes healthcare access by eliminating waiting room stress 
                and providing transparent, real-time information about your appointment.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${index * 150}ms`}}
              >
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 group-hover:shadow-blue-500/10 border border-white/50">
                  <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-10 w-fit group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                How It{' '}
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Works
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Getting started is simple. Follow these easy steps to join a doctor's queue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${index * 200}ms`}}
              >
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-5xl font-bold mb-8">
              Ready to Transform Your{' '}
              <span className="bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent">
                Healthcare Experience?
              </span>
            </h2>
            <p className="text-xl mb-10 text-blue-100 leading-relaxed max-w-3xl mx-auto">
              Join thousands of patients who have already discovered the convenience of remote queue management.
            </p>
            {!isAuthenticated ? (
              <Link
                to="/register"
                className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-5 rounded-2xl text-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 active:scale-95 inline-flex items-center gap-3"
              >
                <Zap className="w-6 h-6 group-hover:animate-pulse" />
                Start Your Journey Today
              </Link>
            ) : (
              <Link
                to={user?.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'}
                className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-5 rounded-2xl text-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 active:scale-95 inline-flex items-center gap-3"
              >
                <Zap className="w-6 h-6 group-hover:animate-pulse" />
                Access Your Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
