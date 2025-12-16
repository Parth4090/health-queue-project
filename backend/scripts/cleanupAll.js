const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorVerification = require('../models/DoctorVerification');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health-queue');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};

// Show current database status
const showDatabaseStatus = async () => {
  try {
    console.log('📊 Current Database Status:\n');
    
    const userCount = await User.countDocuments();
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const patientCount = await User.countDocuments({ role: 'patient' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const doctorProfileCount = await Doctor.countDocuments();
    const verificationCount = await DoctorVerification.countDocuments();

    console.log(`👥 Total Users: ${userCount}`);
    console.log(`   • Doctors: ${doctorCount}`);
    console.log(`   • Patients: ${patientCount}`);
    console.log(`   • Admins: ${adminCount}`);
    console.log(`🏥 Doctor Profiles: ${doctorProfileCount}`);
    console.log(`📋 Doctor Verifications: ${verificationCount}`);
    
  } catch (error) {
    console.error('❌ Error getting database status:', error);
  }
};

// Cleanup only doctors
const cleanupDoctors = async () => {
  try {
    console.log('🧹 Starting doctor cleanup...\n');

    const doctorUsers = await User.find({ role: 'doctor' });
    if (doctorUsers.length === 0) {
      console.log('✅ No doctor users found.');
      return;
    }

    const doctorUserIds = doctorUsers.map(user => user._id);
    
    // Remove in order to avoid foreign key issues
    await DoctorVerification.deleteMany({ userId: { $in: doctorUserIds } });
    await Doctor.deleteMany({ userId: { $in: doctorUserIds } });
    await User.deleteMany({ role: 'doctor' });

    console.log(`✅ Removed ${doctorUsers.length} doctors and related data`);
    
  } catch (error) {
    console.error('❌ Error during doctor cleanup:', error);
  }
};

// Cleanup all data (nuclear option)
const cleanupAll = async () => {
  try {
    console.log('💥 Starting complete database cleanup...\n');

    const userCount = await User.countDocuments();
    const doctorProfileCount = await Doctor.countDocuments();
    const verificationCount = await DoctorVerification.countDocuments();

    // Remove all data
    await DoctorVerification.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});

    console.log(`✅ Removed all data:`);
    console.log(`   • ${userCount} users`);
    console.log(`   • ${doctorProfileCount} doctor profiles`);
    console.log(`   • ${verificationCount} verifications`);
    
  } catch (error) {
    console.error('❌ Error during complete cleanup:', error);
  }
};

// Interactive cleanup
const interactiveCleanup = async () => {
  try {
    console.log('🧹 Database Cleanup Tool\n');
    
    // Show current status
    await showDatabaseStatus();
    
    console.log('\n🔧 Cleanup Options:');
    console.log('1. Remove only doctors (keep patients and admins)');
    console.log('2. Remove all data (nuclear option)');
    console.log('3. Show database status only');
    console.log('4. Exit without changes');
    
    // For now, we'll use command line arguments
    const args = process.argv.slice(2);
    const option = args[0];

    switch (option) {
      case '1':
      case 'doctors':
        console.log('\n🎯 Selected: Remove only doctors');
        await cleanupDoctors();
        break;
        
      case '2':
      case 'all':
        console.log('\n💥 Selected: Remove all data');
        await cleanupAll();
        break;
        
      case '3':
      case 'status':
        console.log('\n📊 Selected: Show status only');
        break;
        
      case '4':
      case 'exit':
        console.log('\n👋 Exiting without changes');
        break;
        
      default:
        console.log('\n⚠️  No valid option selected. Use:');
        console.log('   node cleanupAll.js doctors    (remove doctors only)');
        console.log('   node cleanupAll.js all        (remove all data)');
        console.log('   node cleanupAll.js status     (show status only)');
        console.log('   node cleanupAll.js exit       (exit without changes)');
        break;
    }

    // Show final status
    if (option && option !== 'exit') {
      console.log('\n📊 Final Database Status:');
      await showDatabaseStatus();
    }

  } catch (error) {
    console.error('❌ Error during interactive cleanup:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await interactiveCleanup();
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

// Run the script
main();
