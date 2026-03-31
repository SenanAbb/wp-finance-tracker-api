// ============================================================================
// TWILIO WEBHOOK: Recibe mensajes de WhatsApp
// ============================================================================
// Este archivo define la ruta POST /twilio/webhook que Twilio llama cada vez
// que un usuario envía un mensaje por WhatsApp.
//
// FLUJO CON MÁQUINA DE ESTADOS (Fase 1):
// 1. Validar usuario y teléfono (IDLE)
// 2. Interpretar con IA (AI_INTERPRETING)
// 3. Procesar según intent (BALANCE_FLOW, TRANSACTION_FLOW, ERROR_RESPONSE)
// 4. Responder al usuario (DONE)
// ============================================================================

const { normalizeTwilioFromToE164, isE164 } = require("../utils/phone.js");
const { twimlMessage } = require("../utils/twiml.js");
const { AppError } = require("../utils/errors.js");
const StateMachine = require("../state/stateMachine.js");
const handlers = require("../state/handlers/index.js");

// Sesiones válidas por 24 horas (se renuevan con cada actividad)
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const IS_DEV = String(process.env.NODE_ENV || "development").toLowerCase() !== "production";

async function twilioRoutes(app, opts) {
  const { repositories, services } = opts;

  // ========================================================================
  // POST /twilio/webhook
  // ========================================================================
  // Endpoint que Twilio llama cuando un usuario envía un mensaje por WhatsApp.
  // Twilio envía en el body:
  //   - From: número de teléfono del usuario (ej: "whatsapp:+34643326603")
  //   - Body: contenido del mensaje (ej: "café 12")
  //   - MessageSid: ID único del mensaje
  //
  // Procesa el mensaje usando una máquina de estados que transiciona entre:
  // IDLE → SESSION_LOADER → LOGIN_FLOW → CONTEXT_LOADER → AI_INTERPRETING → [FLOWS] → DONE
  // ========================================================================
  app.post("/twilio/webhook", async (request, reply) => {
    // Validar que repositories y services están inicializados
    if (!repositories || !services) {
      reply
        .code(500)
        .type("text/xml")
        .send(twimlMessage("Backend no configurado (Repositories o Services no inicializados)"));
      return;
    }

    // Extraer datos del mensaje de Twilio
    const from = request.body?.From;
    const body = request.body?.Body;
    const messageSid = request.body?.MessageSid || request.body?.SmsMessageSid;

    // En desarrollo, loguear el mensaje entrante
    if (IS_DEV) {
      request.log.info(
        {
          from,
          body,
          messageSid,
        },
        "Twilio inbound",
      );
    }

    // Normalizar número de teléfono a formato E.164 (ej: +34643326603)
    // Twilio envía "whatsapp:+34643326603", nosotros extraemos "+34643326603"
    const phoneE164 = normalizeTwilioFromToE164(from);
    if (!isE164(phoneE164)) {
      throw AppError.badRequest("Número inválido", "INVALID_PHONE");
    }

    // ====================================================================
    // MÁQUINA DE ESTADOS: Procesar mensaje a través de estados
    // ====================================================================
    const stateMachine = new StateMachine('IDLE');

    // Ejecutar máquina de estados
    try {
      // Ejecutar estados hasta llegar a DONE
      while (!stateMachine.isDone()) {
        const { state } = stateMachine.getState();
        const handler = handlers[state];

        if (!handler) {
          throw AppError.internal(`No handler for state: ${state}`, "INVALID_STATE");
        }

        // Loguear transición de estado
        if (IS_DEV) {
          request.log.info(
            {
              state,
              contextKeys: Object.keys(stateMachine.context),
            },
            "State transition",
          );
        }

        // Ejecutar handler del estado actual
        await handler({
          stateMachine,
          repositories,
          services,
          request,
          reply,
          phoneE164,
          body,
          ttlMs: SESSION_TTL_MS,
        });
      }

      // Ejecutar DONE después del loop (cuando isDone() es true)
      await handlers.DONE({ stateMachine, request, reply });
      
      // Loguear finalización exitosa
      if (IS_DEV) {
        const history = stateMachine.getHistory();
        request.log.info(
          {
            stateHistory: history.map((h) => h.state),
            totalStates: history.length,
          },
          "State machine completed successfully",
        );
      }
    } catch (err) {
      // Loguear error con stack trace completo
      request.log.error(
        {
          error: err.message,
          code: err.code,
          state: stateMachine.state,
          stack: err.stack,
          context: stateMachine.context,
        },
        "State machine error",
      );

      // Si hay error, transicionar a ERROR_RESPONSE
      stateMachine.setState('ERROR_RESPONSE', { error: err.message || "Error desconocido" });
      await handlers.ERROR_RESPONSE({ stateMachine, request });
      await handlers.DONE({ stateMachine, request, reply });
    }
  });
}

module.exports = twilioRoutes;
