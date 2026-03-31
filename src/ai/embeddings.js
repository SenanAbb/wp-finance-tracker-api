// ============================================================================
// Embedding Service: Genera embeddings de texto con OpenAI
// ============================================================================
// Usa text-embedding-3-small (1536 dimensiones) para embeber mensajes
// del usuario en runtime. El vector resultante se usa para búsqueda
// vectorial en knowledge_embeddings.
// ============================================================================

const { getOpenAIConfig } = require('./openai.js');

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Genera un embedding para un texto dado usando OpenAI.
 * @param {Object} params
 * @param {Object} params.env - Variables de entorno (OPENAI_API_KEY)
 * @param {string} params.text - Texto a embeber
 * @param {Object} [params.requestLog] - Logger de la request
 * @returns {Promise<{embedding: number[], usage: Object, latencyMs: number}>}
 */
async function embedText({ env, text, requestLog }) {
  const cfg = getOpenAIConfig(env);
  if (!cfg.apiKey) {
    const err = new Error('OPENAI_API_KEY is missing');
    err.code = 'OPENAI_API_KEY_MISSING';
    throw err;
  }

  const startedAt = Date.now();

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  const latencyMs = Date.now() - startedAt;
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.error?.message || `Embedding error (status ${res.status})`;
    const err = new Error(message);
    err.code = 'EMBEDDING_ERROR';
    err.status = res.status;
    requestLog?.error({ err, latencyMs }, 'Embedding request failed');
    throw err;
  }

  const embedding = json?.data?.[0]?.embedding;
  if (!embedding) {
    const err = new Error('OpenAI returned no embedding');
    err.code = 'EMBEDDING_EMPTY';
    throw err;
  }

  const usage = json?.usage || null;
  requestLog?.info({ latencyMs, tokens: usage?.total_tokens, model: EMBEDDING_MODEL }, `🔢 Embedding generado (${latencyMs}ms, ${EMBEDDING_DIMENSIONS} dims)`);

  return { embedding, usage, latencyMs };
}

module.exports = { embedText, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
