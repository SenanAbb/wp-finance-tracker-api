// ============================================================================
// Supabase Statistics Repository (Adapter)
// ============================================================================
// Implementación de StatisticsRepository usando Supabase
// ============================================================================

const StatisticsRepository = require('../../repositories/statisticsRepository.js');

class SupabaseStatisticsRepository extends StatisticsRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async getExpensesByCategory(userId, dateRange) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;

    // Agrupar por categoría
    const grouped = {};
    (data || []).forEach((tx) => {
      const cat = tx.category_id || 'Sin categoría';
      grouped[cat] = (grouped[cat] || 0) + tx.amount;
    });

    return Object.entries(grouped).map(([category, total]) => ({
      category,
      total,
    }));
  }

  async getIncomeByCategory(userId, dateRange) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;

    // Agrupar por categoría
    const grouped = {};
    (data || []).forEach((tx) => {
      const cat = tx.category_id || 'Sin categoría';
      grouped[cat] = (grouped[cat] || 0) + tx.amount;
    });

    return Object.entries(grouped).map(([category, total]) => ({
      category,
      total,
    }));
  }

  async getTotalExpenses(userId, dateRange) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;

    return (data || []).reduce((sum, tx) => sum + tx.amount, 0);
  }

  async getTotalIncome(userId, dateRange) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;

    return (data || []).reduce((sum, tx) => sum + tx.amount, 0);
  }

  async getAverageExpense(userId, dateRange) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;

    const expenses = data || [];
    if (expenses.length === 0) return 0;

    const total = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    return total / expenses.length;
  }
}

module.exports = SupabaseStatisticsRepository;
