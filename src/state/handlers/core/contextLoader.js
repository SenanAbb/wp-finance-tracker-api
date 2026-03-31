// ============================================================================
// Context Loader Handler: Cargar contexto y validaciones previas
// ============================================================================
// Responsabilidades ÚNICAS:
// 1. Validar que usuario tiene al menos una cuenta
// 2. Cargar datos necesarios (cuentas, categorías desde BD, etc)
// 3. Actualizar contexto de la máquina de estados
// 4. Transicionar a AI_INTERPRETING (sin interpretar mensaje)
// ============================================================================

async function handleContextLoader({ stateMachine, services, request }) {
  const { user } = stateMachine.context;

  try {
    request.log.info({ userId: user.id }, '📦 CONTEXT_LOADER → Cargando cuentas y categorías');

    // PASO 1: Obtener cuentas del usuario usando service
    const { accounts } = await services.accountService.getAllAccounts(user.id);

    // PASO 2: Validación crítica: Usuario debe tener al menos una cuenta
    if (!accounts || accounts.length === 0) {
      request.log.warn({ userId: user.id }, 'User has no accounts');
      stateMachine.setState('DONE', {
        response: '⚠️ Debes crear al menos una cuenta antes de usar la IA.\n\nUsa: "crear cuenta banco EUR"\n\nTipos disponibles: banco, cash, inversion',
        skipResponse: false,
      });
      return;
    }

    // PASO 3: Cargar categorías desde BD usando CategoryService
    const categoriesForContext = await services.categoryService.getCategoriesForContext();
    
    // Extraer nombres de categorías para contexto de IA
    const categoryNames = [
      ...categoriesForContext.expense.map(c => c.name),
      ...categoriesForContext.income.map(c => c.name),
      ...categoriesForContext.investment.map(c => c.name),
    ];

    // PASO 4: Actualizar contexto con datos cargados
    stateMachine.context.activeAccounts = accounts;
    stateMachine.context.categories = categoryNames;
    stateMachine.context.categoriesWithIds = categoriesForContext;
    stateMachine.context.defaultCurrency = user.defaultCurrency || 'EUR';

    // PASO 5: Loguear carga de contexto
    request.log.info(
      {
        userId: user.id,
        accounts: accounts.map(a => `${a.name} (${a.type})`),
        categoriesCount: categoryNames.length,
      },
      '📦 CONTEXT_LOADER → Contexto cargado → VECTOR_SEARCH',
    );

    // PASO 6: Transicionar a VECTOR_SEARCH
    // VECTOR_SEARCH embebe el mensaje, busca en knowledge_embeddings,
    // y decide si ir por fast path o RAG path → AI_INTERPRETING
    stateMachine.setState('VECTOR_SEARCH', {
      ...stateMachine.context,
    });
  } catch (err) {
    request.log.error({ error: err.message }, 'Context loader error');
    stateMachine.setState('ERROR_RESPONSE', {
      error: 'Error cargando contexto: ' + err.message,
    });
  }
}

module.exports = {
  handleContextLoader,
};
