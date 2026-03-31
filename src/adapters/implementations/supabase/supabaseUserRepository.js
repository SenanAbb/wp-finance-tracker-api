// ============================================================================
// Supabase User Repository (Adapter)
// ============================================================================
// Implementación de UserRepository usando Supabase
// ============================================================================

const UserRepository = require('../../repositories/userRepository.js');

class SupabaseUserRepository extends UserRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async getUserById(userId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByPhone(phoneE164) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneE164)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async createUser(userData) {
    const { data, error } = await this.supabase
      .from('users')
      .insert([userData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async updateUser(userId, userData) {
    const { data, error } = await this.supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = SupabaseUserRepository;
