// ============================================================================
// Session Service (Domain Service)
// ============================================================================
// Lógica de negocio relacionada con sesiones
// Usa repositories para acceso a datos (agnóstico de BD)
// ============================================================================

const crypto = require('crypto');
const { Session } = require('../entities/index.js');

class SessionService {
  constructor(sessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  /**
   * Obtiene una sesión por su ID
   * @param {string} sessionId
   * @returns {Promise<Session>}
   */
  async getSessionById(sessionId) {
    const sessionData = await this.sessionRepository.getSessionById(sessionId);
    if (!sessionData) return null;
    return this._mapToEntity(sessionData);
  }

  /**
   * Obtiene sesiones activas de un usuario
   * @param {string} userId
   * @returns {Promise<Array<Session>>}
   */
  async getActiveSessionsByUserId(userId) {
    const sessionsData = await this.sessionRepository.getActiveSessionsByUserId(userId);
    return sessionsData.map(s => this._mapToEntity(s));
  }

  /**
   * Crea una nueva sesión para un usuario
   * Lógica de negocio: sesión válida por 24 horas
   * Revoca sesiones anteriores si existen (solo una sesión activa por usuario)
   * @param {string} userId
   * @param {Object} options - { ttlMs = 24 * 60 * 60 * 1000 }
   * @returns {Promise<Session>}
   */
  async createSession(userId, options = {}) {
    const { ttlMs = 24 * 60 * 60 * 1000 } = options;

    // PASO 1: Revocar todas las sesiones anteriores del usuario
    // Esto asegura que solo haya una sesión activa por usuario
    try {
      await this.revokeAllSessionsByUserId(userId);
    } catch (err) {
      // Ignorar errores si no hay sesiones previas
    }

    const expiresAt = new Date(Date.now() + ttlMs);
    
    // PASO 2: Generar token de sesión y su hash
    const sessionToken = this._generateSessionToken();
    const sessionTokenHash = this._hashSessionToken(sessionToken);

    // PASO 3: Crear nueva sesión
    const sessionData = await this.sessionRepository.createSession({
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      session_token_hash: sessionTokenHash,
    });

    return this._mapToEntity(sessionData);
  }

  /**
   * Revoca una sesión
   * @param {string} sessionId
   * @returns {Promise<Session>}
   */
  async revokeSession(sessionId) {
    const sessionData = await this.sessionRepository.revokeSession(sessionId);
    return this._mapToEntity(sessionData);
  }

  /**
   * Revoca todas las sesiones de un usuario
   * @param {string} userId
   * @returns {Promise<Array<Session>>}
   */
  async revokeAllSessionsByUserId(userId) {
    const sessionsData = await this.sessionRepository.revokeAllSessionsByUserId(userId);
    return sessionsData.map(s => this._mapToEntity(s));
  }

  /**
   * Obtiene la primera sesión activa de un usuario
   * Lógica de negocio: retorna la sesión más reciente
   * @param {string} userId
   * @returns {Promise<Session>}
   */
  async getActiveSession(userId) {
    const sessions = await this.getActiveSessionsByUserId(userId);
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Mapea datos de BD a entidad de dominio
   * @private
   * @param {Object} sessionData
   * @returns {Session}
   */
  _mapToEntity(sessionData) {
    return new Session(
      sessionData.id,
      sessionData.user_id,
      sessionData.expires_at,
      sessionData.revoked_at,
      sessionData.created_at,
      sessionData.updated_at,
    );
  }

  /**
   * Genera un token de sesión aleatorio
   * @private
   * @returns {string}
   */
  _generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hashea un token de sesión
   * @private
   * @param {string} token
   * @returns {string}
   */
  _hashSessionToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = SessionService;
