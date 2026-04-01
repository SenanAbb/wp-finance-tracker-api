// ============================================================================
// KAPSO WEBHOOK: Recibe mensajes de WhatsApp vía Meta Cloud API
// ============================================================================
// Este archivo define las rutas para el webhook de Kapso/Meta:
//   GET  /kapso/webhook  → Verificación del webhook (Meta challenge)
//   POST /kapso/webhook  → Recibir mensajes entrantes
//
// Usa normalizeWebhook de @kapso/whatsapp-cloud-api/server para parsear
// el payload de Meta y extraer mensajes normalizados.
//
// FLUJO: Igual que Twilio, usa la máquina de estados para procesar mensajes.
// ============================================================================

const crypto = require('crypto');
const { isE164 } = require("../utils/phone.js");
const { AppError } = require("../utils/errors.js");
const StateMachine = require("../state/stateMachine.js");
const handlers = require("../state/handlers/index.js");

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const IS_DEV = String(process.env.NODE_ENV || "development").toLowerCase() !== "production";

function verifyKapsoWebhookSignature(payload, signatureHeader, secret) {
  if (!secret) return true;
  if (!signatureHeader) return false;

  const expectedSignature = crypto
    .createHmac('sha256', String(secret))
    .update(JSON.stringify(payload))
    .digest('hex');

  const provided = String(signatureHeader);
  if (provided.length !== expectedSignature.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

async function kapsoRoutes(app, opts) {
  const { repositories, services, kapsoAdapter } = opts;

  // ========================================================================
  // GET /kapso/webhook — Verificación de Meta (challenge)
  // ========================================================================
  // Meta envía un GET con hub.mode, hub.verify_token y hub.challenge.
  // Si verify_token coincide con nuestro token, devolvemos hub.challenge.
  // ========================================================================
  app.get("/kapso/webhook", async (request, reply) => {
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];

    const verifyToken = process.env.KAPSO_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
      request.log.info("Kapso webhook verified successfully");
      reply.code(200).type("text/plain").send(challenge);
      return;
    }

    request.log.warn({ mode, token }, "Kapso webhook verification failed");
    reply.code(403).send("Forbidden");
  });

  // ========================================================================
  // POST /kapso/webhook — Recibir mensajes de WhatsApp
  // ========================================================================
  // Meta/Kapso envía un POST con el payload del webhook.
  // Usamos normalizeWebhook() para extraer mensajes normalizados.
  // ========================================================================
  app.post("/kapso/webhook", async (request, reply) => {
    const log = request.log;
    const payload = request.body;

    // Verificar autenticidad del webhook (Kapso firma el payload con HMAC-SHA256)
    // Header: X-Webhook-Signature
    const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signatureHeader = request.headers['x-webhook-signature'];
      const ok = verifyKapsoWebhookSignature(payload, signatureHeader, webhookSecret);
      if (!ok) {
        log.warn({ hasSignature: Boolean(signatureHeader) }, 'Kapso webhook: invalid signature');
        return reply.code(401).send('Invalid signature');
      }
    }

    // Validar que repositories y services están inicializados
    if (!repositories || !services || !kapsoAdapter) {
      log.error("Kapso webhook: Backend not configured");
      return reply.code(200).send("EVENT_RECEIVED");
    }

    // Kapso proxy envía: { message: { from, id, text, type, ... }, conversation: { ... } }
    const message = payload?.message;
    if (!message) {
      log.info("Kapso: no message field in payload (status update or unknown event)");
      return reply.code(200).send("EVENT_RECEIVED");
    }

    // Solo procesar mensajes de texto entrantes
    if (message.type !== "text") {
      log.info({ type: message.type }, "Kapso: ignoring non-text message");
      return reply.code(200).send("EVENT_RECEIVED");
    }

    const phoneE164 = `+${message.from}`;
    const body = message.text?.body;
    const messageId = message.id;

    log.info({ from: phoneE164, body, messageId }, "Kapso inbound");

    // Validar número E.164
    if (!isE164(phoneE164)) {
      log.warn({ phone: phoneE164 }, "Kapso: invalid phone number");
      return reply.code(200).send("EVENT_RECEIVED");
    }

    // Marcar mensaje como leído (fire-and-forget)
    kapsoAdapter.markAsRead(messageId).catch((err) => {
      log.warn({ error: err.message }, "Failed to mark message as read");
    });

    // Crear función sendMessage para inyectar en la máquina de estados
    const sendMessage = async (to, text) => {
      const result = await kapsoAdapter.sendText(to, text);
      if (!result.ok) {
        log.error(
          {
            error: result.error,
            to,
            phoneNumberId: result.meta?.phoneNumberId,
            providerError: result.meta?.providerError,
            messageLength: text?.length || 0,
          },
          "Kapso: failed to send message",
        );
      } else {
        log.info(
          {
            messageId: result.messageId,
            to,
            phoneNumberId: result.meta?.phoneNumberId,
          },
          "Kapso: message sent",
        );
      }
      return result;
    };

    // Ejecutar máquina de estados
    try {
      await processMessage({
        request,
        repositories,
        services,
        phoneE164,
        body,
        sendMessage,
        channel: "kapso",
      });
    } catch (err) {
      log.error({ error: err.message, stack: err.stack }, "Kapso processMessage error");
    }

    return reply.code(200).send("EVENT_RECEIVED");
  });
}

// ============================================================================
// processMessage: Ejecuta la máquina de estados para un mensaje
// ============================================================================
// Compartido entre Kapso y potencialmente Twilio.
// Recibe sendMessage como abstracción del canal.
// ============================================================================
async function processMessage({ request, repositories, services, phoneE164, body, sendMessage, channel }) {
  const stateMachine = new StateMachine("IDLE");

  // Inyectar canal y función de envío en el contexto
  stateMachine.context.sendMessage = sendMessage;
  stateMachine.context.channel = channel;
  stateMachine.context.phoneE164 = phoneE164;

  try {
    while (!stateMachine.isDone()) {
      const { state } = stateMachine.getState();
      const handler = handlers[state];

      if (!handler) {
        throw AppError.internal(`No handler for state: ${state}`, "INVALID_STATE");
      }

      if (IS_DEV) {
        request.log.info(
          { state, contextKeys: Object.keys(stateMachine.context) },
          "State transition",
        );
      }

      await handler({
        stateMachine,
        repositories,
        services,
        request,
        phoneE164,
        body,
        ttlMs: SESSION_TTL_MS,
      });
    }

    // Ejecutar DONE
    await handlers.DONE({ stateMachine, request });

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
    request.log.error(
      { error: err.message, code: err.code, state: stateMachine.state },
      "State machine error",
    );

    stateMachine.setState("ERROR_RESPONSE", { error: err.message || "Error desconocido" });
    await handlers.ERROR_RESPONSE({ stateMachine, request });
    await handlers.DONE({ stateMachine, request });
  }
}

module.exports = kapsoRoutes;
