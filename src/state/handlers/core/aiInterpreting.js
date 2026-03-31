// ============================================================================
// AI_INTERPRETING Handler: Interpretar mensaje y decidir flujo
// ============================================================================
// Responsabilidades ÚNICAS:
// 1. Interpretar mensaje del usuario con OpenAI
// 2. Decidir siguiente estado según intent
// 3. Transicionar al flujo correspondiente o PERMISSION_DENIED
// 4. Loguear tokens, latencia y decisión
//
// FLUJO DE OPERACIÓN:
// 1. Recibe contexto YA CARGADO de CONTEXT_LOADER (cuentas, categorías, etc)
// 2. Llama a OpenAI con el mensaje y contexto
// 3. Recibe interpretación con intent y parámetros
// 4. Decide flujo según intent y transiciona
// ============================================================================

const { interpretFinanceText } = require("../../../ai/interpret.js");

async function handleAIInterpreting({ stateMachine, request }) {
  const { user, rawMessage, activeAccounts, categories, defaultCurrency, ragContext } = stateMachine.context;

  try {
    request.log.info(
      {
        userId: user.id,
        message: rawMessage,
        hasRagContext: Boolean(ragContext),
        ragSuggestions: ragContext
          ? { intent: ragContext.suggestedIntent, category: ragContext.suggestedCategory, account: ragContext.suggestedAccountType }
          : null,
      },
      '🤖 AI_INTERPRETING → Enviando a GPT' + (ragContext ? ' (con sugerencias RAG)' : ' (sin sugerencias)'),
    );

    // PASO 1: Llamar a OpenAI con contexto YA CARGADO
    const interpretResult = await interpretFinanceText({
      env: process.env,
      text: String(rawMessage || ""),
      context: {
        categories: categories || [],
        accounts: activeAccounts || [],
        defaultCurrency: defaultCurrency || "EUR",
        ragContext: ragContext || null,
      },
      requestLog: request.log,
    });

    // PASO 2: Loguear interpretación de IA
    request.log.info(
      {
        userId: user.id,
        latencyMs: interpretResult.latencyMs,
        tokens: interpretResult.usage?.total_tokens,
        intent: interpretResult.data.intent,
        confidence: interpretResult.data.confidence,
        transactionsCount: interpretResult.data.transactions?.length || 0,
      },
      `🤖 AI_INTERPRETING → GPT respondió: intent="${interpretResult.data.intent}" (${interpretResult.latencyMs}ms)`,
    );

    // PASO 3: Decidir siguiente estado según intent
    const { intent } = interpretResult.data;
    let nextState;

    // Intents válidos y permitidos
    const validIntents = ['balance', 'expense', 'income', 'create_account', 'list_accounts', 'list_transactions', 'statistics'];

    if (validIntents.includes(intent)) {
      // Intent válido → Transicionar al flujo correspondiente
      nextState = _getFlowForIntent(intent);
    } else if (intent === 'unknown') {
      // Intent desconocido → PERMISSION_DENIED con mensaje de no entendimiento
      nextState = 'PERMISSION_DENIED';
    } else {
      // Intent no permitido o no reconocido → PERMISSION_DENIED
      nextState = 'PERMISSION_DENIED';
    }

    // PASO 4: Loguear decisión de flujo
    request.log.info(
      { userId: user.id, intent, nextState },
      `🤖 AI_INTERPRETING → Decisión: "${intent}" → ${nextState}`,
    );

    // PASO 5: Transicionar al siguiente estado con interpretación
    stateMachine.setState(nextState, {
      ...stateMachine.context,
      interpretation: interpretResult.data,
      aiUsage: interpretResult.usage,
      aiLatencyMs: interpretResult.latencyMs,
    });
  } catch (err) {
    request.log.error({ error: err.message }, '❌ AI_INTERPRETING → Error en GPT → ERROR_RESPONSE');
    stateMachine.setState('ERROR_RESPONSE', {
      error: 'Error interpretando mensaje: ' + err.message,
    });
  }
}

/**
 * Mapea intent a flujo correspondiente
 * @private
 * @param {string} intent
 * @returns {string} nextState
 */
function _getFlowForIntent(intent) {
  const intentToFlow = {
    'balance': 'BALANCE_FLOW',
    'expense': 'TRANSACTION_FLOW',
    'income': 'TRANSACTION_FLOW',
    'create_account': 'CREATE_ACCOUNT_FLOW',
    'list_accounts': 'LIST_ACCOUNTS_FLOW',
    'list_transactions': 'LIST_TRANSACTIONS_FLOW',
    'statistics': 'STATISTICS_FLOW',
  };
  return intentToFlow[intent] || 'ERROR_RESPONSE';
}

module.exports = {
  handleAIInterpreting,
};
