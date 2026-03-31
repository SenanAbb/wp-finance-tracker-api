// ============================================================================
// Statistics Service (Domain Logic)
// ============================================================================
// Lógica de negocio para estadísticas
// Independiente de la implementación de BD
// ============================================================================

class StatisticsService {
  constructor(statisticsRepository) {
    this.statisticsRepository = statisticsRepository;
  }

  /**
   * Obtiene estadísticas para un período
   * @param {string} userId - ID del usuario
   * @param {string} period - Período (today, week, month, year)
   * @returns {Promise<Object>} Estadísticas del período
   */
  async getStatistics(userId, period = 'month') {
    const dateRange = this.getDateRange(period);

    const [
      totalExpenses,
      totalIncome,
      averageExpense,
      expensesByCategory,
      incomeByCategory,
    ] = await Promise.all([
      this.statisticsRepository.getTotalExpenses(userId, dateRange),
      this.statisticsRepository.getTotalIncome(userId, dateRange),
      this.statisticsRepository.getAverageExpense(userId, dateRange),
      this.statisticsRepository.getExpensesByCategory(userId, dateRange),
      this.statisticsRepository.getIncomeByCategory(userId, dateRange),
    ]);

    return {
      period,
      dateRange,
      totalExpenses,
      totalIncome,
      averageExpense,
      expensesByCategory,
      incomeByCategory,
      netBalance: totalIncome - totalExpenses,
    };
  }

  /**
   * Calcula promedios de gastos
   * @param {Array} transactions - Array de transacciones
   * @returns {Object} { averageExpense: number, averageIncome: number }
   */
  calculateAverages(transactions) {
    const expenses = (transactions || []).filter((tx) => tx.type === 'expense');
    const incomes = (transactions || []).filter((tx) => tx.type === 'income');

    const averageExpense = expenses.length > 0
      ? expenses.reduce((sum, tx) => sum + tx.amount, 0) / expenses.length
      : 0;

    const averageIncome = incomes.length > 0
      ? incomes.reduce((sum, tx) => sum + tx.amount, 0) / incomes.length
      : 0;

    return {
      averageExpense,
      averageIncome,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
    };
  }

  /**
   * Obtiene las categorías con más gasto
   * @param {Array} expensesByCategory - Gastos por categoría
   * @param {number} limit - Número de categorías a retornar
   * @returns {Array} Top categorías
   */
  getTopCategories(expensesByCategory, limit = 5) {
    return (expensesByCategory || [])
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  /**
   * Genera recomendaciones basadas en estadísticas
   * @param {Object} statistics - Objeto de estadísticas
   * @returns {Array} Array de recomendaciones
   */
  generateRecommendations(statistics) {
    const recommendations = [];

    const { totalExpenses, totalIncome, averageExpense } = statistics;

    // Recomendación 1: Control de gastos
    if (totalExpenses > totalIncome * 0.8) {
      recommendations.push({
        type: 'warning',
        message: '⚠️ Tus gastos son muy altos. Considera reducir gastos innecesarios.',
      });
    } else if (totalExpenses < totalIncome * 0.3) {
      recommendations.push({
        type: 'positive',
        message: '✅ Excelente control de gastos. ¡Sigue así!',
      });
    } else {
      recommendations.push({
        type: 'neutral',
        message: '💡 Mantén el ritmo, vas bien con tus gastos.',
      });
    }

    // Recomendación 2: Promedio de gastos
    if (averageExpense > 50) {
      recommendations.push({
        type: 'warning',
        message: '💸 Tu gasto promedio es alto. Intenta reducirlo.',
      });
    }

    // Recomendación 3: Ahorro
    const savings = totalIncome - totalExpenses;
    if (savings > 0) {
      const savingsPercentage = (savings / totalIncome * 100).toFixed(1);
      recommendations.push({
        type: 'positive',
        message: `🎯 Estás ahorrando el ${savingsPercentage}% de tus ingresos.`,
      });
    }

    return recommendations;
  }

  /**
   * Obtiene el rango de fechas para un período
   * @param {string} period - Período (today, week, month, year)
   * @returns {Object} { startDate: Date, endDate: Date }
   */
  getDateRange(period) {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    return { startDate, endDate };
  }
}

module.exports = StatisticsService;
