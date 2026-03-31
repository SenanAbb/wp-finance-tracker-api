// ============================================================================
// Supabase Implementations Index
// ============================================================================
// Crea el cliente de Supabase y todas las instancias de repositories
// Este es el ÚNICO lugar donde se crea el cliente de Supabase
// Si cambias a otra BD (AWS, etc), solo cambias este adaptador
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const SupabaseUserRepository = require('./supabaseUserRepository.js');
const SupabaseSessionRepository = require('./supabaseSessionRepository.js');
const SupabaseAccountRepository = require('./supabaseAccountRepository.js');
const SupabaseTransactionRepository = require('./supabaseTransactionRepository.js');
const SupabaseStatisticsRepository = require('./supabaseStatisticsRepository.js');
const SupabaseCategoryRepository = require('./supabaseCategoryRepository.js');
const SupabaseAuthRepository = require('./supabaseAuthRepository.js');

/**
 * Crea el cliente de Supabase desde variables de entorno
 * @param {Object} env - Variables de entorno
 * @returns {Object} Cliente de Supabase
 */
function createSupabaseClient(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Verifica la conexión a Supabase
 * @param {Object} supabase - Cliente de Supabase
 */
async function checkSupabaseConnection(supabase) {
  const { error } = await supabase.from('users').select('count').limit(1);
  if (error) throw error;
}

/**
 * Factory function para crear todas las instancias de repositories Supabase
 * Crea el cliente internamente - agnóstico de dónde se llame
 * @param {Object} env - Variables de entorno
 * @returns {Object} Objeto con todas las instancias de repositories
 */
async function createSupabaseRepositories(env) {
  const supabase = createSupabaseClient(env);
  await checkSupabaseConnection(supabase);

  return {
    supabase,
    userRepository: new SupabaseUserRepository(supabase),
    sessionRepository: new SupabaseSessionRepository(supabase),
    accountRepository: new SupabaseAccountRepository(supabase),
    transactionRepository: new SupabaseTransactionRepository(supabase),
    statisticsRepository: new SupabaseStatisticsRepository(supabase),
    categoryRepository: new SupabaseCategoryRepository(supabase),
    authRepository: new SupabaseAuthRepository(supabase),
  };
}

module.exports = {
  createSupabaseClient,
  checkSupabaseConnection,
  createSupabaseRepositories,
};
