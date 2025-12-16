const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health-queue', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Username: admin');
      console.log('Email: admin@healthqueue.com');
      console.log('Password: admin123456');
      console.log('Role: super_admin');
      return;
    }

    // Create default admin user
    const adminData = {
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
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Default admin user created successfully!');
    console.log('📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Email: admin@healthqueue.com');
    console.log('   Password: admin123456');
    console.log('   Role: super_admin');
    console.log('   Permissions: All permissions granted');
    console.log('');
    console.log('🔐 Access the admin panel at: http://localhost:3000/admin/login');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDefaultAdmin();
