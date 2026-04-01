// ============================================================================
// DONE Handler: Estado final - Enviar respuesta al usuario
// ============================================================================
// Responsabilidades:
// 1. Obtener respuesta del contexto
// 2. Enviar mensaje usando el canal apropiado (Kapso o Twilio legacy)
// 3. Loguear historial de transiciones
// ============================================================================

async function handleDone({ stateMachine, request, reply }) {
  const { response, skipResponse, phoneE164, sendMessage, channel } = stateMachine.context;

  const history = stateMachine.getHistory();
  const fastPath = stateMachine.context.fastPath;
  request.log.info(
    {
      stateHistory: history.map((h) => h.state),
      totalStates: history.length,
      fastPath: fastPath || null,
      responseLength: response?.length || 0,
    },
    `✅ DONE → Flujo completado (${history.length} estados${fastPath ? `, fast path: ${fastPath}` : ''})`,
  );

  // Enviar respuesta si no está marcada como skip
  if (!skipResponse && response) {
    if (!sendMessage) {
      request.log.error({ channel, to: phoneE164 }, "No sendMessage available in DONE handler");
      return;
    }

    request.log.info({ response, to: phoneE164 }, "Sending response");
    await sendMessage(phoneE164, response);
  } else if (skipResponse) {
    request.log.info("Response skipped (already sent by handler)");
  } else {
    request.log.warn("No response to send");
  }
}

module.exports = {
  handleDone,
};
