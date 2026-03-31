// ============================================================================
// Transaction Repository (Port/Interface)
// ============================================================================
// Define el contrato para acceso a datos de transacciones
// Agnóstico de la implementación (Supabase, PostgreSQL, etc)
// ============================================================================

class TransactionRepository {
  /**
   * Obtiene transacciones de un usuario con paginación
   * @param {string} userId - ID del usuario
   * @param {number} limit - Número máximo de transacciones
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Array>} Array de transacciones
   */
  async getTransactionsByUserId(userId, limit = 10, offset = 0) {
    throw new Error('getTransactionsByUserId() must be implemented');
  }

  /**
   * Obtiene transacciones de una cuenta específica
   * @param {string} accountId - ID de la cuenta
   * @param {number} limit - Número máximo de transacciones
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Array>} Array de transacciones
   */
  async getTransactionsByAccountId(accountId, limit = 10, offset = 0) {
    throw new Error('getTransactionsByAccountId() must be implemented');
  }

  /**
   * Crea una nueva transacción
   * @param {string} userId - ID del usuario
   * @param {Object} transactionData - Datos de la transacción
   * @param {string} transactionData.account_id - ID de la cuenta
   * @param {number} transactionData.amount - Monto
   * @param {string} transactionData.type - Tipo (expense, income)
   * @param {string} transactionData.description - Descripción
   * @param {string} transactionData.category - Categoría
   * @param {string} transactionData.currency - Moneda
   * @returns {Promise<Object>} Transacción creada
   */
  async createTransaction(userId, transactionData) {
    throw new Error('createTransaction() must be implemented');
  }

  /**
   * Actualiza una transacción
   * @param {string} transactionId - ID de la transacción
   * @param {Object} transactionData - Datos a actualizar
   * @returns {Promise<Object>} Transacción actualizada
   */
  async updateTransaction(transactionId, transactionData) {
    throw new Error('updateTransaction() must be implemented');
  }

  /**
   * Elimina una transacción (soft delete)
   * @param {string} transactionId - ID de la transacción
   * @returns {Promise<void>}
   */
  async deleteTransaction(transactionId) {
    throw new Error('deleteTransaction() must be implemented');
  }

  /**
   * Obtiene transacciones en un rango de fechas
   * @param {string} userId - ID del usuario
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Array>} Array de transacciones
   */
  async getTransactionsByDateRange(userId, startDate, endDate) {
    throw new Error('getTransactionsByDateRange() must be implemented');
  }
}

module.exports = TransactionRepository;
