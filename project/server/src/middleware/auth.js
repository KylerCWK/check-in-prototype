const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract bearer token
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next(); // Proceed to the next middleware or route handler
  }catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
module.exports = authMiddleware;


