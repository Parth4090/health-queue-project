import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    role: 'patient'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);

      if (result.success) {
        toast.success('Registration successful!');
        navigate('/patient/login');
      }
    } catch (error) {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input name="name" placeholder="Full Name" required onChange={handleChange} className="w-full p-3 border rounded" />

          <input name="email" type="email" placeholder="Email" required onChange={handleChange} className="w-full p-3 border rounded" />

          <input name="phone" placeholder="Phone Number" required onChange={handleChange} className="w-full p-3 border rounded" />

          <input name="city" placeholder="City" required onChange={handleChange} className="w-full p-3 border rounded" />

          <input name="state" placeholder="State" required onChange={handleChange} className="w-full p-3 border rounded" />

          <input name="address" placeholder="Address" required onChange={handleChange} className="w-full p-3 border rounded" />

          <input name="dateOfBirth" type="date" onChange={handleChange} className="w-full p-3 border rounded" />

          <select name="gender" onChange={handleChange} className="w-full p-3 border rounded">
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input name="password" type="password" placeholder="Password" required onChange={handleChange} className="w-full p-3 border rounded" />

          <input name="confirmPassword" type="password" placeholder="Confirm Password" required onChange={handleChange} className="w-full p-3 border rounded" />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

        </form>

        <p className="mt-4 text-center">
          Already have an account?{' '}
          <Link to="/patient/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
