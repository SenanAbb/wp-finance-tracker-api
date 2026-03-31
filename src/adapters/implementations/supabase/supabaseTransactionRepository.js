// ============================================================================
// Supabase Transaction Repository (Adapter)
// ============================================================================
// Implementación de TransactionRepository usando Supabase
// ============================================================================

const TransactionRepository = require('../../repositories/transactionRepository.js');

class SupabaseTransactionRepository extends TransactionRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async getTransactionsByUserId(userId, limit = 10, offset = 0) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async getTransactionsByAccountId(accountId, limit = 10, offset = 0) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async createTransaction(userId, transactionData) {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          ...transactionData,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async updateTransaction(transactionId, transactionData) {
    const { data, error } = await this.supabase
      .from('transactions')
      .update(transactionData)
      .eq('id', transactionId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTransaction(transactionId) {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
  }

  async getTransactionsByDateRange(userId, startDate, endDate) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

module.exports = SupabaseTransactionRepository;
