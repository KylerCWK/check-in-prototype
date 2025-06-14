const jwt = require('jsonwebtoken');

// Blacklisted tokens (in production, use Redis or database)
const blacklistedTokens = new Set();

function authMiddleware(req, res, next) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Access denied. No valid token provided.',
      code: 'NO_TOKEN'
    });
  }

  const token = authHeader.split(' ')[1];
  
  // Check if token is blacklisted
  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ 
      error: 'Token has been revoked.',
      code: 'TOKEN_REVOKED'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token expiration (additional check)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return res.status(401).json({ 
        error: 'Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'user',
      companyCode: decoded.companyCode
    };
    
    next();
  } catch (err) {
    let errorMessage = 'Invalid token.';
    let errorCode = 'INVALID_TOKEN';

    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired.';
      errorCode = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token format.';
      errorCode = 'INVALID_TOKEN_FORMAT';
    }

    return res.status(401).json({ 
      error: errorMessage,
      code: errorCode
    });
  }
}

// Optional authentication (for routes that work with or without auth)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'user',
      companyCode: decoded.companyCode
    };
  } catch (err) {
    // Invalid token, but continue without authentication
    req.user = null;
  }
  
  next();
}

// Role-based authorization middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
}

// Token blacklisting (for logout)
function blacklistToken(token) {
  blacklistedTokens.add(token);
  
  // Clean up old tokens periodically (basic implementation)
  if (blacklistedTokens.size > 10000) {
    blacklistedTokens.clear();
  }
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  blacklistToken
};


