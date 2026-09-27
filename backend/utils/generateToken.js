const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'fallback_secret_key_change_in_production_2026',
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;
