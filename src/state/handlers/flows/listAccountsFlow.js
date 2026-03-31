// ============================================================================
// LIST_ACCOUNTS_FLOW Handler: Listar todas las cuentas
// ============================================================================
// Responsabilidades:
// 1. Obtener todas las cuentas del usuario (usando service)
// 2. Calcular balance total
// 3. Formatear respuesta con detalles
// ============================================================================

async function handleListAccountsFlow({ stateMachine, repositories, services, request }) {
  const { user } = stateMachine.context;

  try {
    const { accounts, totalBalance } = await services.accountService.getAllAccounts(user.id);

    if (!accounts || accounts.length === 0) {
      stateMachine.setState('DONE', {
        response: "No tienes cuentas registradas. Crea una con: 'crear cuenta banco EUR'",
        skipResponse: false,
      });
      return;
    }

    const accountLines = accounts
      .map((account, i) => {
        const icon = account.name.includes("banco") ? "🏦" : account.name.includes("inversion") ? "📈" : "💵";
        const date = new Date(account.createdAt).toLocaleDateString("es-ES");
        return `${i + 1}️⃣ ${account.name}\n   ${icon} ${account.getBalance()} ${account.currency}\n   📅 ${date}`;
      })
      .join("\n\n");

    const response = `📋 Tus cuentas:\n\n${accountLines}\n\n📊 Total: ${totalBalance} EUR`;

    stateMachine.setState('DONE', {
      response,
      skipResponse: false,
    });
  } catch (err) {
    request.log?.error({ error: err.message }, "Failed to fetch accounts");
    stateMachine.setState('DONE', {
      response: "No se pudieron cargar las cuentas.",
      skipResponse: false,
    });
  }
}

module.exports = {
  handleListAccountsFlow,
};
