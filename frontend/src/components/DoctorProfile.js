import React from 'react';
import { MapPin, Stethoscope, Star, Clock, Phone, Mail, Calendar, Award, Building } from 'lucide-react';

const DoctorProfile = ({ doctor, onClose, onJoinQueue }) => {
  if (!doctor) return null;

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">
              {doctor.userId?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dr. {doctor.userId?.name}
            </h1>
            <div className="flex items-center space-x-4 text-lg text-gray-600">
              <div className="flex items-center">
                <Stethoscope className="h-5 w-5 mr-2 text-blue-600" />
                <span>{doctor.specialization}</span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600" />
                <span>{doctor.qualification}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Rating and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{doctor.rating.toFixed(1)}</div>
          <div className="text-sm text-blue-600">Rating</div>
          <div className="text-xs text-blue-500">({doctor.totalRatings} reviews)</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{doctor.experience}</div>
          <div className="text-sm text-green-600">Years Experience</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">{doctor.avgConsultationTime}</div>
          <div className="text-sm text-purple-600">Avg. Consultation</div>
          <div className="text-xs text-purple-500">minutes</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <Building className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">₹{doctor.consultationFee}</div>
          <div className="text-sm text-orange-600">Consultation Fee</div>
        </div>
      </div>

      {/* Contact and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-blue-600" />
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <Phone className="h-4 w-4 mr-3 text-gray-500" />
              <span>{doctor.userId?.phone}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Mail className="h-4 w-4 mr-3 text-gray-500" />
              <span>{doctor.userId?.email}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin className="h-4 w-4 mr-3 text-gray-500" />
              <span>{doctor.userId?.city}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2 text-green-600" />
            Clinic Information
          </h3>
          <div className="space-y-3">
            {doctor.clinicName && (
              <div className="text-gray-700">
                <span className="font-medium">Clinic:</span> {doctor.clinicName}
              </div>
            )}
            {doctor.clinicAddress && (
              <div className="text-gray-700">
                <span className="font-medium">Address:</span> {doctor.clinicAddress}
              </div>
            )}
            <div className="text-gray-700">
              <span className="font-medium">Working Hours:</span> {doctor.workingHours?.start} - {doctor.workingHours?.end}
            </div>
            <div className="text-gray-700">
              <span className="font-medium">Working Days:</span> {doctor.workingDays?.join(', ') || 'Monday - Friday'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => onJoinQueue(doctor.userId._id)}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
        >
          Join Queue
        </button>
        <button
          onClick={onClose}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DoctorProfile;
