// ============================================================================
// TRANSACTION_FLOW Handler: Procesar transacciones
// ============================================================================
// Responsabilidades:
// 1. Validar que hay transacciones
// 2. Procesar cada transacción (seleccionar cuenta, crear, actualizar balance)
// 3. Transicionar a DONE con resumen
// ============================================================================

async function createTransactionFromInterpretation({
  services,
  userId,
  interpretation,
  accountId,
  requestLog,
}) {
  if (!interpretation.amount || interpretation.amount <= 0) {
    return { ok: false, error: "No se detectó un monto válido" };
  }

  const txType = interpretation.type || "expense";
  const currency = interpretation.currency || "EUR";
  const description = interpretation.description || "";
  const categoryName = interpretation.category || "otros";
  const startedAt = Date.now();

  try {
    const accountBefore = await services.accountService.getAccountById(accountId);
    if (!accountBefore) {
      return { ok: false, error: "Cuenta no encontrada" };
    }

    // PASO 1: Crear transacción sin category_id por ahora
    // La categoría se puede asociar después si es necesario
    const tx = await services.transactionService.createTransaction(userId, {
      account_id: accountId,
      type: txType,
      amount: interpretation.amount,
      currency,
      description,
      category_id: null,
    });

    const latencyMs = Date.now() - startedAt;
    const accountAfter = await services.accountService.getAccountById(accountId);
    const initialBalance = accountBefore.getBalance() || 0;
    const finalBalance = accountAfter?.getBalance() || 0;

    requestLog?.info(
      {
        txId: tx.id,
        type: txType,
        amount: interpretation.amount,
        currency,
        category: categoryName,
        accountId,
        accountName: accountBefore.name,
        initialBalance,
        finalBalance,
        latencyMs,
      },
      "Transaction created",
    );

    return {
      ok: true,
      transaction: {
        id: tx.id,
        type: txType,
        amount: interpretation.amount,
        currency,
        description,
        category: categoryName,
        createdAt: tx.createdAt,
      },
      account: {
        id: accountId,
        name: accountBefore.name,
        currency: accountBefore.currency || currency,
        initialBalance,
        finalBalance,
      },
      latencyMs,
    };
  } catch (err) {
    requestLog?.error({ error: err.message }, "Failed to create transaction");
    return { ok: false, error: err.message };
  }
}

async function handleTransactionFlow({ stateMachine, repositories, services, request }) {
  const { user, interpretation, activeAccounts } = stateMachine.context;

  if (!interpretation.transactions || interpretation.transactions.length === 0) {
    stateMachine.setState('DONE', {
      response: "No se pudo interpretar el mensaje.\nIntenta: \"12 café\" o \"he gastado 10€ en metro\"",
      skipResponse: false,
    });
    return;
  }

  const txResults = [];
  for (const tx of interpretation.transactions) {
    let selectedAccountId;

    if (activeAccounts.length === 1) {
      selectedAccountId = activeAccounts[0].id;
    } else {
      if (tx.account_name) {
        const matched = activeAccounts.find(
          (a) => a.name.toLowerCase() === tx.account_name.toLowerCase(),
        );
        if (matched) {
          selectedAccountId = matched.id;
        } else {
          const accountList = activeAccounts.map((a) => a.name).join(", ");
          stateMachine.setState('DONE', {
            response: `Cuenta "${tx.account_name}" no encontrada.\nCuentas disponibles: ${accountList}`,
            skipResponse: false,
          });
          return;
        }
      } else {
        const accountList = activeAccounts.map((a) => a.name).join(", ");
        stateMachine.setState('DONE', {
          response: `Tienes varias cuentas: ${accountList}\n\nEspecifica la cuenta en el mensaje.`,
          skipResponse: false,
        });
        return;
      }
    }

    const txResult = await createTransactionFromInterpretation({
      services,
      userId: user.id,
      interpretation: tx,
      accountId: selectedAccountId,
      requestLog: request.log,
    });

    if (txResult.ok) {
      txResults.push(txResult);
    }
  }

  if (txResults.length === 0) {
    stateMachine.setState('DONE', {
      response: "No se pudo crear ninguna transacción",
      skipResponse: false,
    });
    return;
  }

  const summaryLines = txResults
    .map(
      (r) =>
        `✓ ${r.transaction.type === "expense" ? "💸" : "💰"} ${r.transaction.amount} ${r.transaction.currency} - ${r.transaction.description || "(sin desc)"}\n   🏦 Cuenta: ${r.account.name}\n   💰 Balance inicial: ${r.account.initialBalance} ${r.account.currency}\n   💵 Balance final: ${r.account.finalBalance} ${r.account.currency}`,
    )
    .join("\n");

  const lastAccount = txResults[txResults.length - 1].account;
  const response =
    `${txResults.length > 1 ? "📝 Transacciones registradas:" : "✓ Transacción registrada:"}\n\n${summaryLines}\n\n💼 Última cuenta afectada: ${lastAccount.name}\n💰 Balance actual: ${lastAccount.finalBalance} ${lastAccount.currency}`;

  stateMachine.setState('DONE', {
    response,
    skipResponse: false,
  });
}

module.exports = {
  handleTransactionFlow,
};
