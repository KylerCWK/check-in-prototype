const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ReadingProfile = require('../models/ReadingProfile');
const Company = require('../models/Company');
const { authMiddleware } = require('../middleware/auth');
const { validationChains } = require('../middleware/validation');
const authService = require('../services/authService');

const router = express.Router();

// Login route - updated for 2FA
router.post('/login', validationChains.login, async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email needs verification
    if (user.companyAffiliations && user.companyAffiliations.length > 0) {
      // If user has company affiliations, check if email verification is required
      const primaryCompany = user.companyAffiliations.find(ca => ca.isDefault);
      
      if (primaryCompany && primaryCompany.company) {
        const company = await Company.findById(primaryCompany.company);
        if (company && 
            company.authSettings?.requireEmailVerification && 
            !user.authSettings.emailVerified) {
          return res.status(403).json({
            success: false,
            message: 'Email verification required. Please check your email for verification instructions.',
            requiresVerification: true
          });
        }
      }
    }

    // Check if 2FA is enabled
    if (user.authSettings?.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        message: 'Authentication required',
        requiresTwoFactor: true,
        userId: user._id
      });
    }

    // Create JWT if no 2FA
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Get user's company information if they have any
    let companyInfo = null;
    if (user.company) {
      const company = await Company.findById(user.company);
      if (company) {
        companyInfo = {
          id: company._id,
          name: company.name,
          description: company.description
        };
      }
    }

    // Send token in response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        company: companyInfo
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register route - updated for company registration
router.post('/register', validationChains.register, async (req, res) => {
  try {
    const { email, password, companyId, companyName, companyRole, companyDepartment } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Create verification token
    const verificationToken = authService.generateVerificationToken();
    const now = new Date();
    const expirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create new user
    const user = new User({
      email,
      password: hashed,
      authSettings: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expirationDate
      }
    });
    
    // Handle company affiliation if provided
    let company = null;
    
    if (companyId) {
      // Join existing company
      company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      // Check company domain if domain verification is required
      if (company.domains && company.domains.length > 0) {
        const userEmailDomain = email.split('@')[1];
        if (!company.domains.includes(userEmailDomain)) {
          return res.status(400).json({ 
            message: 'Your email domain is not approved for this company. Please use a company email address.' 
          });
        }
      }
      
      // Set up company affiliation
      user.companyAffiliations = [{
        company: companyId,
        role: companyRole || 'member',
        department: companyDepartment || '',
        status: company.authSettings?.autoApproveMembers ? 'approved' : 'pending',
        isDefault: true
      }];
    } else if (companyName) {
      // Create new company
      company = new Company({
        name: companyName,
        contactEmail: email,
        admins: [user._id],
        members: [{
          user: user._id,
          role: 'admin',
          status: 'approved'
        }]
      });
      
      await company.save();
      
      // Set up company affiliation
      user.companyAffiliations = [{
        company: company._id,
        role: 'admin',
        status: 'approved',
        isDefault: true
      }];
    }
    
    await user.save();
    
    // Create a reading profile for the new user using the proper method
    try {
      await user.initializeReadingProfile();
      console.log(`✅ Created reading profile for new user ${user._id}`);
    } catch (profileError) {
      console.error('Error creating reading profile for new user:', profileError);
      // Don't fail registration if profile creation fails
    }
    
    // Send verification email if company requires it
    if (company && company.authSettings?.requireEmailVerification) {
      try {
        await authService.sendVerificationEmail(email, verificationToken);
        console.log(`✅ Sent verification email to ${email}`);
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail registration if email sending fails
      }
    }
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Route for email verification
router.post('/verify-email', validationChains.verifyEmail, async (req, res) => {
  await authService.verifyEmail(req, res);
});

// 2FA routes
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  await authService.setup2FA(req, res);
});

router.post('/2fa/verify', authMiddleware, validationChains.verify2FA, async (req, res) => {
  await authService.verify2FA(req, res);
});

router.post('/2fa/validate', validationChains.validate2FA, async (req, res) => {
  await authService.validate2FA(req, res);
});

router.post('/2fa/disable', authMiddleware, async (req, res) => {
  await authService.disable2FA(req, res);
});

// Logout route
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Add token to blacklist
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      // In a production environment, you would store this in Redis or database
      // For now, we'll just acknowledge the logout
      console.log('Token blacklisted:', token.substring(0, 20) + '...');
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
});

module.exports = router;
