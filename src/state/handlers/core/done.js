// ============================================================================
// DONE Handler: Estado final - Enviar respuesta al usuario
// ============================================================================
// Responsabilidades:
// 1. Obtener respuesta del contexto
// 2. Enviar mensaje usando el canal apropiado (Kapso o Twilio legacy)
// 3. Loguear historial de transiciones
// ============================================================================

const { twimlMessage } = require("../../../utils/twiml.js");
const { sendWhatsAppMessage } = require("../../../utils/twilioClient.js");

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
    // Canal Kapso: usar sendMessage inyectado en el contexto
    if (channel === "kapso" && sendMessage) {
      request.log.info({ response, to: phoneE164 }, "Sending response via Kapso");
      await sendMessage(phoneE164, response);
    } else {
      // Canal Twilio (legacy): usar Twilio API
      request.log.info({ response, to: phoneE164 }, "Sending response via Twilio (legacy)");
      const result = await sendWhatsAppMessage({
        to: `whatsapp:${phoneE164}`,
        body: response,
        env: process.env,
      });

      if (!result.ok) {
        request.log.error({ error: result.error }, "Failed to send WhatsApp message");
      } else {
        request.log.info({ messageSid: result.messageSid }, "WhatsApp message sent successfully");
      }
    }
  } else if (skipResponse) {
    request.log.info("Response skipped (already sent by handler)");
  } else {
    request.log.warn("No response to send");
  }

  // Responder al webhook (solo para Twilio que necesita TwiML)
  if (reply && !reply.sent) {
    reply.code(200).type("text/xml").send(twimlMessage(""));
  }
}

module.exports = {
  handleDone,
};
