// ============================================================================
// Session Entity (Domain Model)
// ============================================================================
// Representa una sesión de usuario en el dominio de negocio
// Agnóstico de la BD y frameworks
// ============================================================================

class Session {
  constructor(id, userId, expiresAt, revokedAt = null, createdAt = null, updatedAt = null) {
    this.id = id;
    this.userId = userId;
    this.expiresAt = expiresAt;
    this.revokedAt = revokedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Valida que la sesión tenga datos válidos
   * @returns {boolean}
   */
  isValid() {
    return this.userId && this.expiresAt;
  }

  /**
   * Verifica si la sesión está activa (no expirada y no revocada)
   * @returns {boolean}
   */
  isActive() {
    const now = new Date();
    const expiresAt = new Date(this.expiresAt);
    return !this.revokedAt && expiresAt > now;
  }

  /**
   * Verifica si la sesión ha expirado
   * @returns {boolean}
   */
  isExpired() {
    const now = new Date();
    const expiresAt = new Date(this.expiresAt);
    return expiresAt <= now;
  }

  /**
   * Verifica si la sesión ha sido revocada
   * @returns {boolean}
   */
  isRevoked() {
    return this.revokedAt !== null;
  }

  /**
   * Obtiene el tiempo restante en milisegundos
   * @returns {number}
   */
  getTimeRemaining() {
    const now = new Date();
    const expiresAt = new Date(this.expiresAt);
    return Math.max(0, expiresAt - now);
  }
}

module.exports = Session;
