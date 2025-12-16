
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

// Cleanup function
const cleanupDoctors = async () => {
  try {
    console.log('🧹 Starting doctor database cleanup...\n');

    // Step 1: Find all users with doctor role
    const doctorUsers = await User.find({ role: 'doctor' });
    console.log(`📊 Found ${doctorUsers.length} users with doctor role`);

    if (doctorUsers.length === 0) {
      console.log('✅ No doctor users found. Database is already clean!');
      return;
    }

    // Step 2: Get all doctor user IDs
    const doctorUserIds = doctorUsers.map(user => user._id);
    console.log(`🆔 Doctor user IDs: ${doctorUserIds.join(', ')}`);

    // Step 3: Remove doctor verification records
    const verificationResult = await DoctorVerification.deleteMany({
      userId: { $in: doctorUserIds }
    });
    console.log(`🗑️  Removed ${verificationResult.deletedCount} doctor verification records`);

    // Step 4: Remove doctor profiles
    const doctorResult = await Doctor.deleteMany({
      userId: { $in: doctorUserIds }
    });
    console.log(`🗑️  Removed ${doctorResult.deletedCount} doctor profiles`);

    // Step 5: Remove doctor users
    const userResult = await User.deleteMany({ role: 'doctor' });
    console.log(`🗑️  Removed ${userResult.deletedCount} doctor users`);

    // Step 6: Verify cleanup
    const remainingDoctors = await User.find({ role: 'doctor' });
    const remainingDoctorProfiles = await Doctor.find({});
    const remainingVerifications = await DoctorVerification.find({});

    console.log('\n📋 Cleanup Summary:');
    console.log(`   • Users with doctor role: ${remainingDoctors.length}`);
    console.log(`   • Doctor profiles: ${remainingDoctorProfiles.length}`);
    console.log(`   • Doctor verifications: ${remainingVerifications.length}`);

    if (remainingDoctors.length === 0 && remainingDoctorProfiles.length === 0 && remainingVerifications.length === 0) {
      console.log('\n🎉 Database cleanup completed successfully!');
      console.log('✅ All doctor-related data has been removed.');
    } else {
      console.log('\n⚠️  Some doctor data may still exist. Manual cleanup may be required.');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await cleanupDoctors();
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

// Run the script
main();
