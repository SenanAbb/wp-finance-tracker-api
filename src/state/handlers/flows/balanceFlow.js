// ============================================================================
// BALANCE_FLOW Handler: Mostrar balance con consejos personalizados
// ============================================================================
// Responsabilidades:
// 1. Obtener cuentas del usuario (usando service)
// 2. Calcular balance total
// 3. Analizar transacciones recientes para consejos
// 4. Transicionar a DONE con respuesta
// ============================================================================

async function handleBalanceFlow({ stateMachine, repositories, services, request }) {
  const { user } = stateMachine.context;

  // PASO 1: Obtener cuentas usando service
  const { accounts, totalBalance } = await services.accountService.getAllAccounts(user.id);

  if (!accounts || accounts.length === 0) {
    stateMachine.setState('DONE', {
      response: "No tienes cuentas registradas",
      skipResponse: false,
    });
    return;
  }

  // PASO 2: Obtener últimas transacciones para consejos
  const recentTx = await services.transactionService.getRecentTransactions(user.id, 10);

  // PASO 3: Formatear cuentas
  const accountLines = accounts
    .map((account) => `  💳 ${account.name}: ${account.getBalance()} ${account.currency}`)
    .join("\n");

  // PASO 4: Generar consejo personalizado
  let advice = "";
  if (recentTx && recentTx.length > 0) {
    const expenses = recentTx.filter((tx) => tx.isExpense());
    const avgExpense = expenses.length > 0 ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0;

    if (avgExpense > 50) {
      advice = "\n\n💡 Consejo: Tus gastos promedio son altos. Considera reducir gastos innecesarios.";
    } else if (avgExpense > 20) {
      advice = "\n\n💡 Consejo: Mantén el ritmo, vas bien con tus gastos.";
    } else {
      advice = "\n\n💡 Consejo: Excelente control de gastos. ¡Sigue así!";
    }
  }

  const response = `💰 Tu balance:\n\n${accountLines}\n\n📊 Total: ${totalBalance} EUR${advice}`;

  // PASO 5: Transicionar a DONE
  stateMachine.setState('DONE', {
    response,
    skipResponse: false,
  });
}

module.exports = {
  handleBalanceFlow,
};
