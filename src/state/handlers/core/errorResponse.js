// ============================================================================
// ERROR_RESPONSE Handler: Manejar errores
// ============================================================================
// Responsabilidades:
// 1. Construir mensaje de error apropiado
// 2. Loguear el error
// 3. Transicionar a DONE con respuesta
// ============================================================================

async function handleErrorResponse({ stateMachine, request }) {
  const { error, interpretation } = stateMachine.context;

  // Construir mensaje de error apropiado
  let response;
  if (error) {
    // Error de excepción: usar mensaje de error
    response = error;
  } else if (interpretation && !interpretation.transactions) {
    // Error de interpretación: IA no pudo entender
    response = "No se pudo interpretar el mensaje.\n\nIntenta:\n• \"12 café\"\n• \"he gastado 10€ en metro\"\n• \"dime mi balance\"";
  } else {
    // Error genérico
    response = "Algo salió mal. Por favor, intenta de nuevo.";
  }

  // Loguear error en desarrollo
  if (String(process.env.NODE_ENV || "development").toLowerCase() !== "production") {
    request.log.error(
      {
        error,
        interpretation,
        response,
      },
      "Error in state machine",
    );
  }

  // Transicionar a DONE con respuesta
  stateMachine.setState('DONE', {
    response,
    skipResponse: false,
  });
}

module.exports = {
  handleErrorResponse,
};
