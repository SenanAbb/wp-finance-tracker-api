const { getOpenAIConfig, openaiResponsesJson } = require('./openai.js');

const SYSTEM_PROMPT = `
Eres un asistente financiero amigable que interpreta mensajes de WhatsApp.
Tu trabajo es entender qué quiere el usuario y devolver SOLO JSON válido.

PERSONALIDAD
- Eres preciso, rápido y confiable con el dinero.
- Nunca inventas datos. Si no estás seguro, confidence baja.
- Nunca escribas texto fuera del JSON.

INTENTS POSIBLES

1. "expense" / "income" — Registrar gasto o ingreso
   Ej: "café 3", "nómina 2500", "uber 8 con tarjeta", "café 3, bus 2"
   → Rellenar transactions[]. Detectar múltiples si hay comas.

2. "balance" — Consultar saldo
   Ej: "saldo", "cuánto tengo", "mi balance"

3. "create_account" — Crear cuenta nueva
   Ej: "crear cuenta banco EUR", "nueva cuenta cash"
   → Extraer account_type, account_name, currency, initial_balance

4. "list_accounts" — Ver cuentas
   Ej: "mis cuentas", "qué cuentas tengo"

5. "list_transactions" — Ver movimientos
   Ej: "mis gastos", "últimas transacciones"

6. "statistics" — Análisis/resumen
   Ej: "estadísticas", "en qué gasto más"

7. "unknown" — No reconocido

CATEGORIZACIÓN
Asigna la categoría que MEJOR encaje de las disponibles:
- comida: café, restaurante, supermercado, desayuno, almuerzo, cena, snacks, bebidas
- transporte: metro, bus, taxi, uber, gasolina, parking, peaje, tren
- hogar: alquiler, hipoteca, luz, agua, gas, internet, wifi, limpieza
- salud: farmacia, médico, dentista, hospital, vitaminas
- educación: libros, cursos, clases, formación
- ropa: ropa, zapatos, accesorios
- ocio: cine, concierto, streaming, juegos, netflix, spotify
- tecnología: móvil, ordenador, apps, gadgets
- otros: si ninguna encaja

CUENTA (account_name)
Si el usuario menciona un método de pago, asigna account_name al nombre de la cuenta que coincida por TIPO:
- "efectivo/cash/en mano" → cuenta tipo cash
- "tarjeta/banco/bizum/revolut/móvil/contactless" → cuenta tipo banco
- Si no menciona cuenta, dejar account_name = null

REGLAS
- transactions[] SOLO para expense/income. Vacío para el resto.
- Detectar múltiples transacciones: "café 3, bus 2" → 2 objetos
- Si hay sugerencias de búsqueda vectorial, ÚSALAS como guía pero valida con el contexto.
- Si la sugerencia vectorial no tiene sentido con el mensaje, ignórala.
`;

// Prompt legacy para referencia — eliminado
const SYSTEM_PROMP = SYSTEM_PROMPT;

const INTERPRET_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    intent: {
      type: 'string',
      enum: [
        'expense',
        'income',
        'balance',
        'create_account',
        'list_accounts',
        'list_transactions',
        'statistics',
        'unknown',
      ],
    },
    transactions: {
      type: 'array',
      description:
        'Lista de transacciones detectadas en el mensaje (puede haber varias)',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          amount: { type: 'number' },
          type: { type: 'string', enum: ['expense', 'income'] },
          currency: { type: ['string', 'null'], default: null },
          description: { type: ['string', 'null'], default: null },
          category: { type: ['string', 'null'], default: null },
          account_name: { type: ['string', 'null'], default: null },
        },
        required: [
          'amount',
          'type',
          'currency',
          'description',
          'category',
          'account_name',
        ],
      },
    },
    // Campos para intent="create_account"
    account_type: {
      type: 'string',
      enum: ['banco', 'cash', 'inversion'],
      description: 'Tipo de cuenta a crear (solo para create_account)',
    },
    account_name: {
      type: 'string',
      description: 'Nombre de la cuenta (solo para create_account)',
    },
    account_currency: {
      type: 'string',
      description: 'Moneda de la cuenta (solo para create_account)',
    },
    initial_balance: {
      type: 'number',
      description: 'Balance inicial de la cuenta (solo para create_account)',
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['intent', 'transactions', 'confidence', 'account_type', 'account_name', 'account_currency', 'initial_balance'],
};

async function interpretFinanceText({ env, text, context, requestLog }) {
  const cfg = getOpenAIConfig(env);
  if (!cfg.enabled) {
    return {
      ok: true,
      data: {
        intent: 'unknown',
        transactions: [],
        confidence: 0,
      },
      usage: null,
      latencyMs: 0,
      mode: 'disabled',
    };
  }

  const system = SYSTEM_PROMPT;

  const categories = context?.categories?.length
    ? context.categories.join(', ')
    : '';
  // Formatear cuentas con nombre y tipo para que GPT pueda mapear account_type
  const accounts = context?.accounts?.length
    ? context.accounts.map(a =>
        typeof a === 'string' ? a : `${a.name} (tipo: ${a.type})`
      ).join(', ')
    : '';

  // Construir contexto RAG si hay sugerencias vectoriales
  const ragContext = context?.ragContext;
  let ragHints = '';
  if (ragContext) {
    const hints = [];
    if (ragContext.suggestedIntent) {
      hints.push(`Intent sugerido: "${ragContext.suggestedIntent}" (confianza: ${ragContext.intentScore.toFixed(2)})`);
    }
    if (ragContext.suggestedCategory) {
      hints.push(`Categoría sugerida: "${ragContext.suggestedCategory}" (confianza: ${ragContext.categoryScore.toFixed(2)})`);
    }
    if (ragContext.suggestedAccountType) {
      hints.push(`Tipo de cuenta sugerido: "${ragContext.suggestedAccountType}" (confianza: ${ragContext.accountScore.toFixed(2)})`);
    }
    if (hints.length > 0) {
      ragHints = `\n\nSugerencias de búsqueda vectorial (úsalas como guía, valida con el mensaje):\n${hints.join('\n')}`;
    }
  }

  const messages = [
    {
      role: 'system',
      content: system,
    },
    {
      role: 'user',
      content:
        `Mensaje: ${text}\n\n` +
        `Categorías válidas: ${categories || '(no disponibles)'}\n` +
        `Cuentas disponibles: ${accounts || '(no disponibles)'}\n` +
        `Moneda por defecto: ${context?.defaultCurrency || 'EUR'}` +
        ragHints,
    },
  ];

  const { parsed, usage, latencyMs } = await openaiResponsesJson({
    apiKey: cfg.apiKey,
    model: cfg.model,
    schemaName: 'interpret_finance_text',
    schema: INTERPRET_SCHEMA,
    messages,
    requestLog,
  });

  return {
    ok: true,
    data: parsed,
    usage,
    latencyMs,
    mode: 'openai',
  };
}

module.exports = {
  interpretFinanceText,
};
