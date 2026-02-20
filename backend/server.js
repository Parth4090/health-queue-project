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
app.use(express.json());

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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, io };
