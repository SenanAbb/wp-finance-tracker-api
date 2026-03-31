// ============================================================================
// Phone Validator Utilities
// ============================================================================
// Funciones para validar números de teléfono en formato E.164
// ============================================================================

const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

const ALLOWED_COUNTRIES = (process.env.ALLOWED_COUNTRIES || 'ES,PT,FR,IT').split(',');
const BLOCK_VOIP = process.env.BLOCK_VOIP === 'true';

/**
 * Valida que un número de teléfono está en formato E.164
 * @param {string} phoneNumber
 * @returns {boolean}
 */
function validateE164(phoneNumber) {
  if (!phoneNumber) return false;
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Valida un número de teléfono completo
 * @param {string} phoneNumber
 * @returns {boolean}
 */
function isValidPhone(phoneNumber) {
  try {
    return isValidPhoneNumber(phoneNumber);
  } catch (err) {
    return false;
  }
}

/**
 * Detecta si un número es VoIP (si BLOCK_VOIP está habilitado)
 * @param {string} phoneNumber
 * @returns {boolean}
 */
function isVoIPNumber(phoneNumber) {
  if (!BLOCK_VOIP) return false;

  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (!parsed) return false;

    // Detectar números VoIP conocidos (simplificado)
    // En producción, usar una API especializada
    const voipPatterns = [
      /^(\+1)?555/, // Números de prueba en USA
      /^(\+44)?7700/, // Números de prueba en UK
    ];

    return voipPatterns.some(pattern => pattern.test(phoneNumber));
  } catch (err) {
    return false;
  }
}

/**
 * Normaliza un número de teléfono a formato E.164
 * @param {string} phoneNumber
 * @returns {string|null}
 */
function formatPhoneNumber(phoneNumber) {
  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (!parsed) return null;
    return parsed.format('E.164');
  } catch (err) {
    return null;
  }
}

/**
 * Valida que el país del teléfono está permitido
 * @param {string} phoneNumber
 * @returns {boolean}
 */
function isCountryAllowed(phoneNumber) {
  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (!parsed) return false;
    return ALLOWED_COUNTRIES.includes(parsed.country);
  } catch (err) {
    return false;
  }
}

/**
 * Validación completa de un número de teléfono
 * @param {string} phoneNumber
 * @returns {Object} - { valid: boolean, error: string|null, formatted: string|null }
 */
function validatePhoneNumber(phoneNumber) {
  // Validar formato E.164
  if (!validateE164(phoneNumber)) {
    return { valid: false, error: 'Invalid phone number format', formatted: null };
  }

  // Validar que es un número válido
  if (!isValidPhone(phoneNumber)) {
    return { valid: false, error: 'Invalid phone number', formatted: null };
  }

  // Validar que no es VoIP
  if (isVoIPNumber(phoneNumber)) {
    return { valid: false, error: 'VoIP numbers are not allowed', formatted: null };
  }

  // Validar que el país está permitido
  if (!isCountryAllowed(phoneNumber)) {
    return { valid: false, error: 'Phone number country not allowed', formatted: null };
  }

  return { valid: true, error: null, formatted: phoneNumber };
}

module.exports = {
  validateE164,
  isValidPhone,
  isVoIPNumber,
  formatPhoneNumber,
  isCountryAllowed,
  validatePhoneNumber,
};
