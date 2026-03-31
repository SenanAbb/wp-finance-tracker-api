// ============================================================================
// Supabase Session Repository (Adapter)
// ============================================================================
// Implementación de SessionRepository usando Supabase
// ============================================================================

const SessionRepository = require('../../repositories/sessionRepository.js');

class SupabaseSessionRepository extends SessionRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async getSessionById(sessionId) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getActiveSessionsByUserId(userId) {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createSession(sessionData) {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert(sessionData)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async revokeSession(sessionId) {
    const { data, error } = await this.supabase
      .from('sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async revokeAllSessionsByUserId(userId) {
    const { data, error } = await this.supabase
      .from('sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null)
      .select('*');

    if (error) throw error;
    return data || [];
  }
}

module.exports = SupabaseSessionRepository;
