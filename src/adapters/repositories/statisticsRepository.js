// ============================================================================
// Statistics Repository (Port/Interface)
// ============================================================================
// Define el contrato para acceso a datos de estadísticas
// Agnóstico de la implementación (Supabase, PostgreSQL, etc)
// ============================================================================

class StatisticsRepository {
  /**
   * Obtiene gastos agrupados por categoría
   * @param {string} userId - ID del usuario
   * @param {Object} dateRange - Rango de fechas
   * @param {Date} dateRange.startDate - Fecha de inicio
   * @param {Date} dateRange.endDate - Fecha de fin
   * @returns {Promise<Array>} Array con gastos por categoría
   */
  async getExpensesByCategory(userId, dateRange) {
    throw new Error('getExpensesByCategory() must be implemented');
  }

  /**
   * Obtiene ingresos agrupados por categoría
   * @param {string} userId - ID del usuario
   * @param {Object} dateRange - Rango de fechas
   * @param {Date} dateRange.startDate - Fecha de inicio
   * @param {Date} dateRange.endDate - Fecha de fin
   * @returns {Promise<Array>} Array con ingresos por categoría
   */
  async getIncomeByCategory(userId, dateRange) {
    throw new Error('getIncomeByCategory() must be implemented');
  }

  /**
   * Obtiene total de gastos en un período
   * @param {string} userId - ID del usuario
   * @param {Object} dateRange - Rango de fechas
   * @param {Date} dateRange.startDate - Fecha de inicio
   * @param {Date} dateRange.endDate - Fecha de fin
   * @returns {Promise<number>} Total de gastos
   */
  async getTotalExpenses(userId, dateRange) {
    throw new Error('getTotalExpenses() must be implemented');
  }

  /**
   * Obtiene total de ingresos en un período
   * @param {string} userId - ID del usuario
   * @param {Object} dateRange - Rango de fechas
   * @param {Date} dateRange.startDate - Fecha de inicio
   * @param {Date} dateRange.endDate - Fecha de fin
   * @returns {Promise<number>} Total de ingresos
   */
  async getTotalIncome(userId, dateRange) {
    throw new Error('getTotalIncome() must be implemented');
  }

  /**
   * Calcula el promedio de gastos
   * @param {string} userId - ID del usuario
   * @param {Object} dateRange - Rango de fechas
   * @param {Date} dateRange.startDate - Fecha de inicio
   * @param {Date} dateRange.endDate - Fecha de fin
   * @returns {Promise<number>} Promedio de gastos
   */
  async getAverageExpense(userId, dateRange) {
    throw new Error('getAverageExpense() must be implemented');
  }
}

module.exports = StatisticsRepository;
