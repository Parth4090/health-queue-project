const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
require('dotenv').config();
const socketService = require('./services/socketService');

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default-jwt-secret-for-development-only';
  console.warn('⚠️  WARNING: JWT_SECRET not set, using default secret. This is NOT secure for production!');
}

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const queueRoutes = require('./routes/queue');
const pharmacyRoutes = require('./routes/pharmacy');
const ambulanceRoutes = require('./routes/ambulance');
const prescriptionRoutes = require('./routes/prescription');
const doctorSearchRoutes = require('./routes/doctors');
const adminAuthRoutes = require('./routes/adminAuth');
const adminDashboardRoutes = require('./routes/adminDashboard');
const doctorVerificationRoutes = require('./routes/doctorVerification');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO service
const io = socketService.initialize(server);

// Test routes removed - application is now production-ready

// Essential middleware for POST requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Admin routes are now handled by proper authentication middleware
// No hardcoded credentials - all admin access must be properly authenticated

// Other middleware
app.use(helmet());
app.use(cors());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Rate limiting - Skip for registration to avoid X-Forwarded-For issues
// Temporarily disabled to test POST requests
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and registration endpoints
    return req.path === '/health' || 
           req.path === '/api/auth/register/patient' || 
           req.path === '/api/auth/register/doctor' ||
           req.path.startsWith('/api/auth/');
  }
});
app.use(limiter);
*/

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health-queue', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Please make sure MongoDB is running on your system');
  console.log('You can install MongoDB from: https://www.mongodb.com/try/download/community');
});

// Socket.IO connection handling is now managed by socketService

// Make io available to routes
app.set('io', io);

// Admin routes (secured) - Place at top to avoid conflicts
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

// Doctor verification routes (replaces basic doctor registration)
app.use('/api/doctor-verification', doctorVerificationRoutes);

// All admin routes are now properly secured through authentication middleware

// Other Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/doctors', doctorSearchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Health Queue System is running' });
});

// Test routes removed - application is now production-ready

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err.message);
  console.error('Error stack:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };

