// ============================================================================
// JWT Utilities
// ============================================================================
// Funciones para generar, verificar y hashear JWT tokens
// ============================================================================

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION || '3600', 10);
const REFRESH_TOKEN_EXPIRATION = parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '604800', 10);

/**
 * Genera un Access Token JWT
 * @param {string} userId
 * @param {string} sessionId
 * @returns {string}
 */
function generateAccessToken(userId, sessionId) {
  const payload = {
    sub: userId,
    session_id: sessionId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION,
    iss: 'whatsapp-finance-tracker',
    aud: 'api.whatsapp-finance-tracker',
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

/**
 * Genera un Refresh Token (string aleatorio)
 * @returns {string}
 */
function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifica y decodifica un JWT
 * @param {string} token
 * @returns {Object} - payload del token
 * @throws {Error} si el token es inválido
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    throw new Error(`Invalid token: ${err.message}`);
  }
}

/**
 * Hashea un token (para almacenamiento en BD)
 * @param {string} token
 * @returns {string}
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Obtiene la fecha de expiración de un Refresh Token
 * @returns {Date}
 */
function getRefreshTokenExpiresAt() {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRATION * 1000);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
  getRefreshTokenExpiresAt,
  JWT_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
};
