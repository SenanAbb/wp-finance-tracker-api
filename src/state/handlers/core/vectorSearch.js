// ============================================================================
// VECTOR_SEARCH Handler: Búsqueda vectorial antes de interpretar con IA
// ============================================================================
// Responsabilidades:
// 1. Embeber el mensaje del usuario con OpenAI
// 2. Buscar en knowledge_embeddings (intent, category, account, faq)
// 3. Fast path: si confianza alta → saltar AI_INTERPRETING, ir directo al flujo
// 4. RAG path: si confianza media → enriquecer contexto para AI_INTERPRETING
// 5. Fallback: si error → pasar a AI_INTERPRETING sin contexto vectorial
//
// UMBRALES:
//   FAQ ≥ 0.65       → respuesta directa (fast path)
//   Intent ≥ 0.60    → fast path solo para intents sin transacciones
//   RAG ≥ 0.40       → pasar sugerencia como contexto a GPT
//   < 0.40           → ignorar resultado vectorial
//
// NOTA: text-embedding-3-small con distancia coseno produce similitudes
// en el rango 0.3-0.7 para coincidencias reales. No esperar >0.9.
// ============================================================================

const FAST_PATH_THRESHOLDS = {
  faq: 0.65,
  intent: 0.60,
};

const RAG_THRESHOLD = 0.40;

// Intents que no necesitan parsing de importes → pueden fast-path sin IA
const FAST_PATH_INTENTS = ['balance', 'list_accounts', 'list_transactions', 'statistics'];

async function handleVectorSearch({ stateMachine, services, request }) {
  const { rawMessage, user } = stateMachine.context;

  try {
    request.log.info(
      { userId: user.id, message: rawMessage },
      '🔍 VECTOR_SEARCH → Embebiendo mensaje y buscando en knowledge_embeddings',
    );

    // PASO 1: Búsqueda vectorial
    const vectorResults = await services.vectorSearchService.search({
      text: String(rawMessage || ''),
      env: process.env,
      requestLog: request.log,
    });

    const topIntent = vectorResults.intent[0];
    const topCategory = vectorResults.category[0];
    const topAccount = vectorResults.account[0];
    const topFaq = vectorResults.faq[0];

    request.log.info(
      {
        userId: user.id,
        embedLatencyMs: vectorResults.embedLatencyMs,
        topIntent: topIntent ? `${topIntent.metadata?.intent} (${topIntent.similarity.toFixed(3)})` : null,
        topCategory: topCategory ? `${topCategory.metadata?.category} (${topCategory.similarity.toFixed(3)})` : null,
        topAccount: topAccount ? `${topAccount.metadata?.account_type} (${topAccount.similarity.toFixed(3)})` : null,
        topFaq: topFaq ? `${topFaq.content} (${topFaq.similarity.toFixed(3)})` : null,
      },
      '🔍 VECTOR_SEARCH → Resultados de búsqueda vectorial',
    );

    // PASO 2: Fast path — FAQ
    if (topFaq && topFaq.similarity >= FAST_PATH_THRESHOLDS.faq) {
      request.log.info(
        { faq: topFaq.content, score: topFaq.similarity },
        '⚡ VECTOR_SEARCH → FAST PATH: FAQ detectado (score ≥ 0.65) → DONE (sin IA)',
      );
      stateMachine.setState('DONE', {
        ...stateMachine.context,
        response: topFaq.metadata.answer,
        vectorResults,
        fastPath: 'faq',
      });
      return;
    }

    // PASO 3: Fast path — Intent (solo intents sin transacciones)
    if (topIntent && topIntent.similarity >= FAST_PATH_THRESHOLDS.intent) {
      const intentName = topIntent.metadata?.intent;

      if (FAST_PATH_INTENTS.includes(intentName)) {
        request.log.info(
          { intent: intentName, score: topIntent.similarity },
          `⚡ VECTOR_SEARCH → FAST PATH: intent "${intentName}" (score ≥ 0.60) → ${_getFlowForIntent(intentName)} (sin IA)`,
        );

        const interpretation = {
          intent: intentName,
          transactions: [],
          confidence: topIntent.similarity,
          account_type: null,
          account_name: null,
          account_currency: null,
          initial_balance: null,
        };

        const nextState = _getFlowForIntent(intentName);
        stateMachine.setState(nextState, {
          ...stateMachine.context,
          interpretation,
          vectorResults,
          fastPath: 'intent',
        });
        return;
      }
    }

    // PASO 4: RAG path — Enriquecer contexto para AI_INTERPRETING
    const ragContext = {
      suggestedIntent:
        topIntent?.similarity >= RAG_THRESHOLD
          ? topIntent.metadata?.intent
          : null,
      suggestedCategory:
        topCategory?.similarity >= RAG_THRESHOLD
          ? topCategory.metadata?.category
          : null,
      suggestedAccountType:
        topAccount?.similarity >= RAG_THRESHOLD
          ? topAccount.metadata?.account_type
          : null,
      intentScore: topIntent?.similarity || 0,
      categoryScore: topCategory?.similarity || 0,
      accountScore: topAccount?.similarity || 0,
    };

    const hasHints = ragContext.suggestedIntent || ragContext.suggestedCategory || ragContext.suggestedAccountType;
    request.log.info(
      { ragContext, hasHints: Boolean(hasHints) },
      hasHints
        ? '🧠 VECTOR_SEARCH → RAG PATH: confianza media, pasando sugerencias a GPT → AI_INTERPRETING'
        : '🧠 VECTOR_SEARCH → SIN SUGERENCIAS: confianza baja en todos los tipos → AI_INTERPRETING (GPT decide solo)',
    );

    stateMachine.setState('AI_INTERPRETING', {
      ...stateMachine.context,
      vectorResults,
      ragContext,
    });
  } catch (err) {
    // Si falla la búsqueda vectorial, seguir con IA sin contexto vectorial
    request.log.error(
      { error: err.message },
      '❌ VECTOR_SEARCH → ERROR en búsqueda vectorial, fallback a AI_INTERPRETING (GPT sin sugerencias)',
    );
    stateMachine.setState('AI_INTERPRETING', {
      ...stateMachine.context,
      vectorResults: null,
      ragContext: null,
    });
  }
}

/**
 * Mapea intent a estado de la máquina de estados.
 * @private
 */
function _getFlowForIntent(intent) {
  const intentToFlow = {
    balance: 'BALANCE_FLOW',
    expense: 'TRANSACTION_FLOW',
    income: 'TRANSACTION_FLOW',
    create_account: 'CREATE_ACCOUNT_FLOW',
    list_accounts: 'LIST_ACCOUNTS_FLOW',
    list_transactions: 'LIST_TRANSACTIONS_FLOW',
    statistics: 'STATISTICS_FLOW',
  };
  return intentToFlow[intent] || 'AI_INTERPRETING';
}

module.exports = { handleVectorSearch };
