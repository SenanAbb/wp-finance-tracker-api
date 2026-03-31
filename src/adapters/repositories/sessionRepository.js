// ============================================================================
// Session Repository (Port/Interface)
// ============================================================================
// Define el contrato para acceso a datos de sesiones
// Agnóstico de la implementación (Supabase, PostgreSQL, etc)
// ============================================================================

class SessionRepository {
  /**
   * Obtiene una sesión por su ID
   * @param {string} sessionId - ID de la sesión
   * @returns {Promise<Object>} Datos de la sesión
   */
  async getSessionById(sessionId) {
    throw new Error('getSessionById() must be implemented');
  }

  /**
   * Obtiene sesiones activas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Array de sesiones activas
   */
  async getActiveSessionsByUserId(userId) {
    throw new Error('getActiveSessionsByUserId() must be implemented');
  }

  /**
   * Crea una nueva sesión
   * @param {Object} sessionData - Datos de la sesión
   * @param {string} sessionData.user_id - ID del usuario
   * @param {Date} sessionData.expires_at - Fecha de expiración
   * @returns {Promise<Object>} Sesión creada
   */
  async createSession(sessionData) {
    throw new Error('createSession() must be implemented');
  }

  /**
   * Revoca una sesión
   * @param {string} sessionId - ID de la sesión
   * @returns {Promise<Object>} Sesión revocada
   */
  async revokeSession(sessionId) {
    throw new Error('revokeSession() must be implemented');
  }

  /**
   * Revoca todas las sesiones de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Sesiones revocadas
   */
  async revokeAllSessionsByUserId(userId) {
    throw new Error('revokeAllSessionsByUserId() must be implemented');
  }
}

module.exports = SessionRepository;
