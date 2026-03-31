// ============================================================================
// CREATE_ACCOUNT_FLOW Handler: Crear cuenta nueva
// ============================================================================
// Responsabilidades:
// 1. Obtener datos de la cuenta desde interpretation (IA ya interpretó)
// 2. Validar tipos: "banco", "inversion", "cash"
// 3. Validar moneda
// 4. Crear cuenta usando service
// 5. Confirmar creación
// ============================================================================

async function handleCreateAccountFlow({ stateMachine, services, request }) {
  const { user, interpretation } = stateMachine.context;

  try {
    // PASO 1: Extraer datos de la interpretación de IA
    // La IA ya interpretó el mensaje natural del usuario
    const accountType = interpretation?.account_type?.toLowerCase() || "banco";
    const currency = (interpretation?.account_currency || "EUR").toUpperCase();
    const accountName = interpretation?.account_name || `Mi ${accountType.charAt(0).toUpperCase() + accountType.slice(1)}`;
    const initialBalance = interpretation?.initial_balance || 0;

    // PASO 2: Validar tipo de cuenta
    const allowedTypes = ["banco", "inversion", "cash"];
    if (!allowedTypes.includes(accountType)) {
      stateMachine.setState('DONE', {
        response: `Tipo de cuenta inválido: "${accountType}"\n\nTipos permitidos: ${allowedTypes.join(", ")}\n\nEjemplos:\n• "Crea una cuenta de banco"\n• "Nueva cuenta de inversión"\n• "Quiero una cuenta cash"`,
        skipResponse: false,
      });
      return;
    }

    // PASO 3: Validar moneda
    if (!/^[A-Z]{1,3}$/.test(currency)) {
      stateMachine.setState('DONE', {
        response: `Moneda inválida: "${currency}"\n\nUsa: EUR, USD, GBP, etc.`,
        skipResponse: false,
      });
      return;
    }

    // PASO 4: Validar balance inicial
    if (typeof initialBalance !== 'number' || initialBalance < 0) {
      stateMachine.setState('DONE', {
        response: "Balance inicial debe ser un número no negativo.",
        skipResponse: false,
      });
      return;
    }

    // PASO 5: Crear cuenta
    const account = await services.accountService.createNewAccount(user.id, {
      name: accountName,
      type: accountType,
      currency,
      balance: initialBalance,
    });

    request.log.info(
      {
        userId: user.id,
        accountId: account.id,
        type: accountType,
        currency,
        balance: initialBalance,
      },
      "Account created"
    );

    // PASO 6: Confirmar creación
    const response = `✓ Cuenta creada exitosamente:\n\n💳 ${account.name}\n📊 Tipo: ${accountType}\n💱 Moneda: ${account.currency}\n💰 Balance inicial: ${account.getBalance()} ${account.currency}`;

    stateMachine.setState('DONE', {
      response,
      skipResponse: false,
    });
  } catch (err) {
    request.log?.error({ error: err.message }, "Failed to create account");
    stateMachine.setState('DONE', {
      response: "No se pudo crear la cuenta. Intenta de nuevo.",
      skipResponse: false,
    });
  }
}

module.exports = {
  handleCreateAccountFlow,
};
