// ============================================================================
// IDLE Handler: Estado inicial
// ============================================================================
// Responsabilidades:
// 1. Recibe mensaje de WhatsApp
// 2. Transiciona a SESSION_LOADER para verificar sesión
// ============================================================================

async function handleIdle({ stateMachine, request, phoneE164, body }) {
  request.log.info(
    { phone: phoneE164, message: body },
    '🟢 IDLE → Mensaje recibido, iniciando procesamiento',
  );

  stateMachine.setState('SESSION_LOADER', {
    phoneE164,
    rawMessage: body,
  });
}

module.exports = {
  handleIdle,
};
