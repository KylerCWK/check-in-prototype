const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const User = require('../models/User');
const ReadingProfile = require('../models/ReadingProfile');
const Company = require('../models/Company'); // Added Company model
const auth = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (change as needed)
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: 'Too many requests, please try again later.' }
});

// Updated validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// Updated registration schema with optional company fields
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),
  companyId: Joi.string().optional(),
  companyName: Joi.string().optional(),
  companyRole: Joi.string().optional(),
  companyDepartment: Joi.string().optional()
});

// Login route - updated for 2FA
router.post('/login', authLimiter, async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  const { email, password } = req.body;
  
  try {
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
router.post('/register', authLimiter, async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  
  const { email, password, companyId, companyName, companyRole, companyDepartment } = req.body;
  
  try {
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
    
    // Create a reading profile for the new user
    try {
      const readingProfile = new ReadingProfile({ user: user._id });
      await readingProfile.save();
      
      // Link the profile to the user
      user.readingProfile = readingProfile._id;
      await user.save();
      
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
router.post('/verify-email', async (req, res) => {
  await authService.verifyEmail(req, res);
});

// 2FA routes
router.post('/2fa/setup', auth, async (req, res) => {
  await authService.setup2FA(req, res);
});

router.post('/2fa/verify', auth, async (req, res) => {
  await authService.verify2FA(req, res);
});

router.post('/2fa/validate', async (req, res) => {
  await authService.validate2FA(req, res);
});

router.post('/2fa/disable', auth, async (req, res) => {
  await authService.disable2FA(req, res);
});

module.exports = router;
