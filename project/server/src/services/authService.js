// Add necessary libraries for 2FA to package.json first
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Setup mail transporter - Configure with your email service
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send verification email
 * @param {String} email - User email
 * @param {String} token - Verification token
 */
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

/**
 * Generate verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  const { token } = req.body;
  
  try {
    const user = await User.findOne({
      'authSettings.emailVerificationToken': token,
      'authSettings.emailVerificationExpires': { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or has expired'
      });
    }
    
    // Update user verification status
    user.authSettings.emailVerified = true;
    user.authSettings.emailVerificationToken = undefined;
    user.authSettings.emailVerificationExpires = undefined;
    
    await user.save();
    
    return res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Set up 2FA for a user
 * @access  Private
 */
const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `BookApp:${user.email}`
    });
    
    // Save secret to user
    user.authSettings.twoFactorSecret = secret.base32;
    await user.save();
    
    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    return res.json({
      success: true,
      message: '2FA setup initiated',
      qrCodeUrl,
      secret: secret.base32
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error setting up 2FA',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify and enable 2FA for a user
 * @access  Private
 */
const verify2FA = async (req, res) => {
  const { token } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.authSettings.twoFactorSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Enable 2FA
    user.authSettings.twoFactorEnabled = true;
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex'));
    }
    user.authSettings.twoFactorBackupCodes = backupCodes;
    
    await user.save();
    
    return res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying 2FA',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/2fa/validate
 * @desc    Validate a 2FA token during login
 * @access  Public
 */
const validate2FA = async (req, res) => {
  const { userId, token, isBackupCode } = req.body;
  
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let verified = false;
    
    if (isBackupCode) {
      // Check backup code
      const codeIndex = user.authSettings.twoFactorBackupCodes.indexOf(token);
      if (codeIndex !== -1) {
        // Remove used backup code
        user.authSettings.twoFactorBackupCodes.splice(codeIndex, 1);
        await user.save();
        verified = true;
      }
    } else {
      // Verify TOTP
      verified = speakeasy.totp.verify({
        secret: user.authSettings.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 1 // Allow a 30-second window
      });
    }
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Create JWT token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    return res.json({
      success: true,
      message: 'Authentication successful',
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error validating 2FA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating 2FA',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA for a user
 * @access  Private
 */
const disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Disable 2FA
    user.authSettings.twoFactorEnabled = false;
    user.authSettings.twoFactorSecret = undefined;
    user.authSettings.twoFactorBackupCodes = [];
    
    await user.save();
    
    return res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error disabling 2FA',
      error: error.message
    });
  }
};

module.exports = {
  sendVerificationEmail,
  generateVerificationToken,
  verifyEmail,
  setup2FA,
  verify2FA,
  validate2FA,
  disable2FA
};
