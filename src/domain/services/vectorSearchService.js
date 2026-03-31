// ============================================================================
// Vector Search Service: Búsqueda vectorial en knowledge_embeddings
// ============================================================================
// Combina el embedding del mensaje del usuario con la función
// match_embeddings de PostgreSQL (pgvector) vía Supabase RPC.
//
// Ejecuta búsquedas paralelas por tipo (intent, category, account, faq)
// y devuelve los resultados ordenados por similitud.
// ============================================================================

const { embedText } = require('../../ai/embeddings.js');

class VectorSearchService {
  /**
   * @param {Object} supabase - Cliente de Supabase (para RPC)
   */
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Embebe el mensaje del usuario y busca en knowledge_embeddings.
   * @param {Object} params
   * @param {string} params.text - Mensaje del usuario
   * @param {Object} params.env - Variables de entorno
   * @param {Object} [params.requestLog] - Logger
   * @returns {Promise<Object>} Resultados de búsqueda por tipo
   */
  async search({ text, env, requestLog }) {
    // Paso 1: Embeber mensaje del usuario
    const { embedding, latencyMs: embedLatency } = await embedText({
      env,
      text,
      requestLog,
    });

    // Paso 2: Búsquedas paralelas por tipo
    requestLog?.info(
      { embeddingLength: embedding.length, embeddingType: typeof embedding, isArray: Array.isArray(embedding), first3: embedding.slice(0, 3) },
      'Vector search: embedding ready, calling match_embeddings RPC',
    );

    const [intentResults, categoryResults, accountResults, faqResults] =
      await Promise.all([
        this._matchEmbeddings(embedding, 'intent', 0.30, 3, requestLog),
        this._matchEmbeddings(embedding, 'category', 0.30, 3, requestLog),
        this._matchEmbeddings(embedding, 'account', 0.30, 2, requestLog),
        this._matchEmbeddings(embedding, 'faq', 0.40, 3, requestLog),
      ]);

    return {
      intent: intentResults,
      category: categoryResults,
      account: accountResults,
      faq: faqResults,
      embedLatencyMs: embedLatency,
    };
  }

  /**
   * Llama a la función match_embeddings de PostgreSQL vía Supabase RPC.
   * @private
   */
  async _matchEmbeddings(embedding, matchType, threshold, count, requestLog) {
    const { data, error } = await this.supabase.rpc('match_embeddings', {
      query_embedding: embedding,
      match_type: matchType,
      match_threshold: threshold,
      match_count: count,
    });

    if (error) {
      requestLog?.error(
        { matchType, threshold, count, error: error.message, code: error.code, details: error.details },
        `RPC match_embeddings error (${matchType})`,
      );
      throw new Error(`Vector search error (${matchType}): ${error.message}`);
    }

    const results = data || [];
    requestLog?.info(
      {
        matchType,
        threshold,
        resultsCount: results.length,
        matches: results.map(r => ({
          content: r.content,
          similarity: r.similarity?.toFixed(4),
          metadata: r.metadata,
        })),
      },
      `🔎 RPC match_embeddings (${matchType}): ${results.length} results`,
    );

    return data || [];
  }
}

module.exports = VectorSearchService;
