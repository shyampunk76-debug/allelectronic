const jwt = require('jsonwebtoken');

// Middleware to verify JWT token from Authorization header
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Missing token' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'ae-admin-secret-change-this';
    const decoded = jwt.verify(token, secret);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
};
