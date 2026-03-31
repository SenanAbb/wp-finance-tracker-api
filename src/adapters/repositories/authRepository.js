// ============================================================================
// Auth Repository (Port/Interface)
// ============================================================================
// Define la interfaz para operaciones de autenticación
// Implementación agnóstica de la BD
// ============================================================================

class AuthRepository {
  /**
   * Crea un nuevo desafío de autenticación (OTP)
   * @param {Object} data - { phoneNumber, codeHash, expiresAt, ip, userAgent }
   * @returns {Promise<Object>}
   */
  async createAuthChallenge(data) {
    throw new Error('createAuthChallenge not implemented');
  }

  /**
   * Obtiene un desafío activo para un número de teléfono
   * @param {string} phoneNumber
   * @returns {Promise<Object|null>}
   */
  async getActiveAuthChallenge(phoneNumber) {
    throw new Error('getActiveAuthChallenge not implemented');
  }

  /**
   * Marca un desafío como consumido
   * @param {string} challengeId
   * @returns {Promise<Object>}
   */
  async consumeAuthChallenge(challengeId) {
    throw new Error('consumeAuthChallenge not implemented');
  }

  /**
   * Incrementa el contador de intentos fallidos
   * @param {string} challengeId
   * @returns {Promise<Object>}
   */
  async incrementFailedAttempts(challengeId) {
    throw new Error('incrementFailedAttempts not implemented');
  }

  /**
   * Registra un intento de autenticación en rate limits
   * @param {Object} data - { ipAddress, phoneNumber, requestType, success }
   * @returns {Promise<Object>}
   */
  async createRateLimit(data) {
    throw new Error('createRateLimit not implemented');
  }

  /**
   * Verifica si se ha excedido el rate limit
   * @param {string} ipAddress
   * @param {string} requestType
   * @param {number} windowSeconds
   * @param {number} maxRequests
   * @returns {Promise<boolean>} - true si se ha excedido el límite
   */
  async checkRateLimit(ipAddress, requestType, windowSeconds, maxRequests) {
    throw new Error('checkRateLimit not implemented');
  }

  /**
   * Crea un refresh token para una sesión
   * @param {Object} data - { sessionId, tokenHash, expiresAt }
   * @returns {Promise<Object>}
   */
  async createRefreshToken(data) {
    throw new Error('createRefreshToken not implemented');
  }

  /**
   * Obtiene un refresh token por su hash
   * @param {string} tokenHash
   * @returns {Promise<Object|null>}
   */
  async getRefreshToken(tokenHash) {
    throw new Error('getRefreshToken not implemented');
  }

  /**
   * Revoca un refresh token
   * @param {string} tokenHash
   * @returns {Promise<Object>}
   */
  async revokeRefreshToken(tokenHash) {
    throw new Error('revokeRefreshToken not implemented');
  }
}

module.exports = AuthRepository;
