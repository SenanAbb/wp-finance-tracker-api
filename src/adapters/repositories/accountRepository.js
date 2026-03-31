// ============================================================================
// Account Repository (Port/Interface)
// ============================================================================
// Define el contrato para acceso a datos de cuentas
// Agnóstico de la implementación (Supabase, PostgreSQL, etc)
// ============================================================================

class AccountRepository {
  /**
   * Obtiene todas las cuentas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Array de cuentas
   */
  async getAccountsByUserId(userId) {
    throw new Error('getAccountsByUserId() must be implemented');
  }

  /**
   * Obtiene una cuenta por su ID
   * @param {string} accountId - ID de la cuenta
   * @returns {Promise<Object>} Datos de la cuenta
   */
  async getAccountById(accountId) {
    throw new Error('getAccountById() must be implemented');
  }

  /**
   * Crea una nueva cuenta
   * @param {string} userId - ID del usuario propietario
   * @param {Object} accountData - Datos de la cuenta
   * @param {string} accountData.name - Nombre de la cuenta
   * @param {string} accountData.type - Tipo (banco, cash, inversion)
   * @param {string} accountData.currency - Moneda (EUR, USD, etc)
   * @param {number} accountData.balance - Balance inicial
   * @returns {Promise<Object>} Cuenta creada
   */
  async createAccount(userId, accountData) {
    throw new Error('createAccount() must be implemented');
  }

  /**
   * Actualiza datos de una cuenta
   * @param {string} accountId - ID de la cuenta
   * @param {Object} accountData - Datos a actualizar
   * @returns {Promise<Object>} Cuenta actualizada
   */
  async updateAccount(accountId, accountData) {
    throw new Error('updateAccount() must be implemented');
  }

  /**
   * Elimina una cuenta (soft delete)
   * @param {string} accountId - ID de la cuenta
   * @returns {Promise<void>}
   */
  async deleteAccount(accountId) {
    throw new Error('deleteAccount() must be implemented');
  }
}

module.exports = AccountRepository;
