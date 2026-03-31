// ============================================================================
// User Repository (Port/Interface)
// ============================================================================
// Define el contrato para acceso a datos de usuarios
// Agnóstico de la implementación (Supabase, PostgreSQL, etc)
// ============================================================================

class UserRepository {
  /**
   * Obtiene un usuario por su ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  async getUserById(userId) {
    throw new Error('getUserById() must be implemented');
  }

  /**
   * Obtiene un usuario por su número de teléfono
   * @param {string} phoneE164 - Número de teléfono en formato E.164
   * @returns {Promise<Object>} Datos del usuario
   */
  async getUserByPhone(phoneE164) {
    throw new Error('getUserByPhone() must be implemented');
  }

  /**
   * Crea un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.phone_number - Número de teléfono
   * @param {string} userData.default_currency - Moneda por defecto
   * @returns {Promise<Object>} Usuario creado
   */
  async createUser(userData) {
    throw new Error('createUser() must be implemented');
  }

  /**
   * Actualiza datos de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async updateUser(userId, userData) {
    throw new Error('updateUser() must be implemented');
  }
}

module.exports = UserRepository;
