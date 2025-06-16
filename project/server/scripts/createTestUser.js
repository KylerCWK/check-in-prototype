const mongoose = require('mongoose');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const bcrypt = require('bcrypt');
require('dotenv').config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'qrlibrary'
    });    // Clear existing test data
    await User.deleteOne({ email: 'testuser@testcompany.com' });
    await Company.deleteOne({ domains: 'testcompany.com' });

    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

    const testCompany = new Company({
      name: 'Test Company',
      description: 'A test company for development purposes',
      contactEmail: 'admin@testcompany.com',
      domains: ['testcompany.com'],
      authSettings: {
        requireEmailVerification: true,
        autoApproveMembers: true
      }
    });

    await testCompany.save();

    const testUser = new User({
      email: 'testuser@testcompany.com',
      password: hashedPassword,
      authSettings: {
        emailVerified: true,
      },
      company: testCompany._id,
    });

    await testUser.save();

    console.log('Test user and company created successfully!');
    console.log('Email: testuser@testcompany.com');
    console.log('Password: TestPassword123!');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestUser();
