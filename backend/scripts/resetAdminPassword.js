const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const DEFAULT_PASSWORD = 'admin123456';

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/health-queue');
    console.log('Connected to MongoDB');

    const admin = await Admin.findOne({ username: 'admin' }).select('+password');
    if (!admin) {
      console.log('No admin user found. Run: node scripts/createAdmin.js');
      return;
    }

    admin.password = DEFAULT_PASSWORD;
    await admin.save();
    console.log('✅ Admin password reset successfully!');
    console.log('   Username: admin');
    console.log('   Email: admin@healthqueue.com');
    console.log('   Password: ' + DEFAULT_PASSWORD);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

resetAdminPassword();
