// ============================================================================
// Supabase Auth Repository (Adapter)
// ============================================================================
// Implementación de AuthRepository usando Supabase
// ============================================================================

const AuthRepository = require('../../repositories/authRepository.js');

class SupabaseAuthRepository extends AuthRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async createAuthChallenge(data) {
    const { phoneNumber, codeHash, expiresAt, ip, userAgent } = data;

    const { data: challenge, error } = await this.supabase
      .from('auth_challenges')
      .insert({
        phone_number: phoneNumber,
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
        ip: ip || null,
        user_agent: userAgent || null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create auth challenge: ${error.message}`);
    return challenge;
  }

  async getActiveAuthChallenge(phoneNumber) {
    const { data: challenge, error } = await this.supabase
      .from('auth_challenges')
      .select('*')
      .eq('phone_number', phoneNumber)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get auth challenge: ${error.message}`);
    }

    return challenge || null;
  }

  async consumeAuthChallenge(challengeId) {
    const { data: challenge, error } = await this.supabase
      .from('auth_challenges')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) throw new Error(`Failed to consume auth challenge: ${error.message}`);
    return challenge;
  }

  async incrementFailedAttempts(challengeId) {
    // Primero obtener el challenge actual
    const { data: currentChallenge, error: getError } = await this.supabase
      .from('auth_challenges')
      .select('failed_attempts')
      .eq('id', challengeId)
      .single();

    if (getError) throw new Error(`Failed to get auth challenge: ${getError.message}`);

    // Incrementar el contador
    const newFailedAttempts = (currentChallenge?.failed_attempts || 0) + 1;

    const { data: challenge, error } = await this.supabase
      .from('auth_challenges')
      .update({
        failed_attempts: newFailedAttempts,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) throw new Error(`Failed to increment failed attempts: ${error.message}`);
    return challenge;
  }

  async createRateLimit(data) {
    const { ipAddress, phoneNumber, requestType, success } = data;

    const { data: rateLimit, error } = await this.supabase
      .from('auth_rate_limits')
      .insert({
        ip_address: ipAddress,
        phone_number: phoneNumber || null,
        request_type: requestType,
        success: success || false,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create rate limit record: ${error.message}`);
    return rateLimit;
  }

  async checkRateLimit(ipAddress, requestType, windowSeconds, maxRequests) {
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

    const { data: attempts, error } = await this.supabase
      .from('auth_rate_limits')
      .select('id', { count: 'exact' })
      .eq('ip_address', ipAddress)
      .eq('request_type', requestType)
      .gte('attempted_at', windowStart);

    if (error) throw new Error(`Failed to check rate limit: ${error.message}`);

    return (attempts?.length || 0) >= maxRequests;
  }

  async createRefreshToken(data) {
    const { sessionId, tokenHash, expiresAt } = data;

    const { data: session, error } = await this.supabase
      .from('sessions')
      .update({
        refresh_token_hash: tokenHash,
        refresh_token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to create refresh token: ${error.message}`);
    return session;
  }

  async getRefreshToken(tokenHash) {
    const { data: session, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('refresh_token_hash', tokenHash)
      .is('revoked_at', null)
      .gt('refresh_token_expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get refresh token: ${error.message}`);
    }

    return session || null;
  }

  async revokeRefreshToken(tokenHash) {
    const { data: session, error } = await this.supabase
      .from('sessions')
      .update({
        refresh_token_hash: null,
        refresh_token_expires_at: null,
      })
      .eq('refresh_token_hash', tokenHash)
      .select()
      .single();

    if (error) throw new Error(`Failed to revoke refresh token: ${error.message}`);
    return session;
  }
}

module.exports = SupabaseAuthRepository;
