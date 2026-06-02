const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
require('dotenv').config();
const socketService = require('./services/socketService');

// ===== SECURITY =====
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'development-secret';
  console.warn('⚠️ JWT_SECRET not set. Using development secret.');
}

const app = express();
const server = http.createServer(app);

// ===== SOCKET =====
const io = socketService.initialize(server);
app.set('io', io);

// ===== MIDDLEWARE =====
app.use(helmet());

// ✅ Proper CORS for Render frontend
app.use(cors({
  origin: [
    "https://health-queue-project-1.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

// ✅ ONLY JSON parser (IMPORTANT)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploads
app.use('/uploads', express.static('uploads'));

// ===== ROUTES =====
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
const Admin = require('./models/Admin');

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/doctor-verification', doctorVerificationRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/doctors', doctorSearchRoutes);

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Health Queue System is running' });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ===== DATABASE =====
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/health-queue';
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    // Create default admin if no admin exists
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const admin = new Admin({
          username: 'admin',
          email: 'admin@healthqueue.com',
          password: 'admin123456',
          role: 'super_admin',
          permissions: [
            'manage_doctors',
            'manage_patients',
            'manage_queues',
            'view_analytics',
            'manage_admins',
            'approve_registrations',
            'suspend_accounts'
          ],
          profile: {
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+91-9876543210'
          },
          isActive: true
        });
        await admin.save();
        console.log('✅ Default admin created. Login with username: admin, password: admin123456');
      }
    } catch (err) {
      console.error('Could not create default admin:', err.message);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB Connection error:', err);
    console.error('⚠️  Server will continue but database operations will fail. Make sure MongoDB is running.');
  });


// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, io };
