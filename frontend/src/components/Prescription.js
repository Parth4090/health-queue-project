import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  FileText, 
  Pill, 
  Calendar,
  User,
  Stethoscope,
  AlertCircle
} from 'lucide-react';

const Prescription = ({ 
  mode = 'view', // 'view' for patients, 'write' for doctors
  prescription = null,
  onSave = null,
  patientName = '',
  doctorName = ''
}) => {
  const [medicines, setMedicines] = useState(
    prescription?.medicines || [
      { name: '', dosage: '', frequency: '', duration: '' }
    ]
  );
  const [diagnosis, setDiagnosis] = useState(prescription?.diagnosis || '');
  const [additionalNotes, setAdditionalNotes] = useState(prescription?.additionalNotes || '');
  const [date, setDate] = useState(prescription?.date || new Date().toISOString().split('T')[0]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index, field, value) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index][field] = value;
    setMedicines(updatedMedicines);
  };

  const handleSave = () => {
    if (onSave) {
      const prescriptionData = {
        date,
        diagnosis,
        medicines: medicines.filter(med => med.name && med.dosage && med.frequency && med.duration),
        notes: additionalNotes
      };
      onSave(prescriptionData);
    }
  };

  if (mode === 'view' && prescription) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Medical Prescription
          </h2>
          <div className="flex items-center justify-center space-x-8 text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(prescription.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>{patientName}</span>
            </div>
            <div className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-2" />
              <span>{doctorName}</span>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
            Diagnosis
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-gray-800 text-lg">{prescription.diagnosis}</p>
          </div>
        </div>

        {/* Medications */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Pill className="h-5 w-5 text-green-600 mr-2" />
            Medications
          </h3>
          <div className="space-y-4">
            {prescription.medicines.map((medicine, index) => (
              <div key={index} className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                    <p className="text-gray-900 font-medium">{medicine.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                    <p className="text-gray-900">{medicine.dosage}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <p className="text-gray-900">{medicine.frequency}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <p className="text-gray-900">{medicine.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        {prescription.additionalNotes && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-purple-600 mr-2" />
              Additional Notes
            </h3>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-gray-800">{prescription.additionalNotes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            This prescription is valid for 30 days from the date of issue
          </p>
        </div>
      </div>
    );
  }

  // Write mode for doctors
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Write Prescription
        </h2>
        <p className="text-gray-600">Create a detailed prescription for your patient</p>
      </div>

      {/* Date */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Diagnosis */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter the diagnosis..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
        />
      </div>

      {/* Medications */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Medications</h3>
          <button
            onClick={addMedicine}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </button>
        </div>
        
        <div className="space-y-4">
          {medicines.map((medicine, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    value={medicine.name}
                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                    placeholder="e.g., Paracetamol"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    value={medicine.dosage}
                    onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                    placeholder="e.g., 500mg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                  <input
                    type="text"
                    value={medicine.frequency}
                    onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                    placeholder="e.g., Twice daily"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  {medicines.length > 1 && (
                    <button
                      onClick={() => removeMedicine(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Enter any additional instructions, dietary restrictions, or follow-up notes..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
        />
      </div>

      {/* Save Button */}
      <div className="text-center">
        <button
          onClick={handleSave}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 active:scale-95"
        >
          Save Prescription
        </button>
      </div>
    </div>
  );
};

export default Prescription;
