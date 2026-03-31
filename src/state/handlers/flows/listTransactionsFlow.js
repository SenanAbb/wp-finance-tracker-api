// ============================================================================
// LIST_TRANSACTIONS_FLOW Handler: Listar últimas X transacciones
// ============================================================================
// Responsabilidades:
// 1. Extraer número de transacciones (default 5, max 20)
// 2. Obtener últimas N transacciones (usando service)
// 3. Formatear con detalles (fecha, monto, descripción, categoría)
// 4. Calcular totales (gastos, ingresos)
// ============================================================================

async function handleListTransactionsFlow({ stateMachine, repositories, services, request }) {
  const { user, interpretation } = stateMachine.context;

  let limit = interpretation.limit || 5;
  if (limit > 20) limit = 20;
  if (limit < 1) limit = 1;

  try {
    const transactions = await services.transactionService.getRecentTransactions(user.id, limit);

    if (!transactions || transactions.length === 0) {
      stateMachine.setState('DONE', {
        response: "No tienes transacciones registradas.",
        skipResponse: false,
      });
      return;
    }

    const { totalExpenses, totalIncome } = services.transactionService.calculateTotals(transactions);

    const txLines = transactions
      .map((tx, i) => {
        const icon = tx.isExpense() ? "💸" : "💰";
        const sign = tx.isExpense() ? "-" : "+";
        const date = new Date(tx.createdAt).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const desc = tx.description || "(sin descripción)";
        return `${i + 1}. ${icon} ${sign}${tx.amount} ${tx.currency} - ${desc}\n   📅 ${date}`;
      })
      .join("\n\n");

    const response = `📊 Últimas ${transactions.length} transacciones:\n\n${txLines}\n\n📈 Gastos: ${totalExpenses} EUR\n📈 Ingresos: ${totalIncome} EUR`;

    stateMachine.setState('DONE', {
      response,
      skipResponse: false,
    });
  } catch (err) {
    request.log?.error({ error: err.message }, "Failed to fetch transactions");
    stateMachine.setState('DONE', {
      response: "No se pudieron cargar las transacciones.",
      skipResponse: false,
    });
  }
}

module.exports = {
  handleListTransactionsFlow,
};
