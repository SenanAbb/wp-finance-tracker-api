// ============================================================================
// Supabase Account Repository (Adapter)
// ============================================================================
// Implementación de AccountRepository usando Supabase
// ============================================================================

const AccountRepository = require('../../repositories/accountRepository.js');

class SupabaseAccountRepository extends AccountRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async getAccountsByUserId(userId) {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAccountById(accountId) {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) throw error;
    return data;
  }

  async createAccount(userId, accountData) {
    const { data, error } = await this.supabase
      .from('accounts')
      .insert([
        {
          user_id: userId,
          ...accountData,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async updateAccount(accountId, accountData) {
    const { data, error } = await this.supabase
      .from('accounts')
      .update(accountData)
      .eq('id', accountId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAccount(accountId) {
    const { error } = await this.supabase
      .from('accounts')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', accountId);

    if (error) throw error;
  }
}

module.exports = SupabaseAccountRepository;
