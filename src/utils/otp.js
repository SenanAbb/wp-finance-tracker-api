// ============================================================================
// OTP Utilities
// ============================================================================
// Funciones para generar, hashear y verificar OTPs
// ============================================================================

const crypto = require('crypto');

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);

/**
 * Genera un OTP aleatorio
 * @param {number} length - longitud del OTP (default 6)
 * @returns {string}
 */
function generateOTP(length = OTP_LENGTH) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Hashea un OTP (para almacenamiento en BD)
 * @param {string} otp
 * @returns {string}
 */
function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verifica que un OTP coincide con su hash
 * @param {string} otp
 * @param {string} hash
 * @returns {boolean}
 */
function verifyOTP(otp, hash) {
  const otpHash = hashOTP(otp);
  return crypto.timingSafeEqual(Buffer.from(otpHash), Buffer.from(hash));
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  OTP_LENGTH,
};
