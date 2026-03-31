// ============================================================================
// Permission Denied Handler: Manejar acciones no permitidas
// ============================================================================
// Responsabilidades:
// 1. Construir mensaje de error amigable
// 2. Listar acciones permitidas
// 3. Transicionar a DONE
// ============================================================================

async function handlePermissionDenied({ stateMachine, request }) {
  // Usar mensaje del contexto si está disponible, sino usar mensaje por defecto
  const contextMessage = stateMachine.context.response;
  
  const message = contextMessage || `No puedo hacer eso. Puedo ayudarte con:

💰 Balance - "dime mi balance"
💸 Gastos - "cafe 12"
💳 Cuentas - "mostrar mis cuentas"
📊 Estadísticas - "dame estadísticas"
📝 Transacciones - "ultimas 5 transacciones"
➕ Nueva Cuenta - "crear cuenta banco EUR"`;

  request.log.info(
    {
      intent: stateMachine.context.interpretation?.intent,
      hasCustomMessage: Boolean(contextMessage),
    },
    'Permission denied'
  );

  stateMachine.setState('DONE', {
    response: message,
    skipResponse: false,
  });
}

module.exports = {
  handlePermissionDenied,
};
