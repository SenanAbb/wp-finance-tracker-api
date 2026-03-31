// ============================================================================
// Kapso WhatsApp Client
// ============================================================================
// Cliente para enviar mensajes de WhatsApp usando @kapso/whatsapp-cloud-api
// Usa el proxy de Kapso para acceder a la Meta Cloud API
// ============================================================================

const { WhatsAppClient } = require('@kapso/whatsapp-cloud-api');

class KapsoWhatsAppAdapter {
  /**
   * @param {Object} config
   * @param {string} config.kapsoApiKey - API key de Kapso
   * @param {string} config.phoneNumberId - ID del número de WhatsApp en Meta
   */
  constructor(config) {
    this.phoneNumberId = config.phoneNumberId;
    this.client = new WhatsAppClient({
      baseUrl: 'https://api.kapso.ai/meta/whatsapp',
      kapsoApiKey: config.kapsoApiKey,
    });
  }

  serializeError(err) {
    if (!err) return null;

    return {
      name: err.name,
      message: err.message,
      code: err.code,
      status: err.status || err.statusCode,
      response: err.response && typeof err.response === 'object'
        ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data,
            body: err.response.body,
          }
        : err.response,
      data: err.data,
      details: err.details,
      cause: err.cause && typeof err.cause === 'object'
        ? {
            name: err.cause.name,
            message: err.cause.message,
            code: err.cause.code,
          }
        : err.cause,
    };
  }

  /**
   * Envía un mensaje de texto a un número de WhatsApp
   * @param {string} to - Número de teléfono en formato E.164 (ej: +34643326603)
   * @param {string} body - Contenido del mensaje
   * @returns {Promise<{ok: boolean, messageId?: string, error?: string}>}
   */
  async sendText(to, body) {
    try {
      const response = await this.client.messages.sendText({
        phoneNumberId: this.phoneNumberId,
        to,
        body,
      });

      return {
        ok: true,
        messageId: response.messages?.[0]?.id,
        meta: {
          phoneNumberId: this.phoneNumberId,
          response,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message,
        meta: {
          phoneNumberId: this.phoneNumberId,
          providerError: this.serializeError(err),
        },
      };
    }
  }

  /**
   * Marca un mensaje como leído
   * @param {string} messageId - ID del mensaje (wamid....)
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async markAsRead(messageId) {
    try {
      await this.client.messages.markRead({
        phoneNumberId: this.phoneNumberId,
        messageId,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Envía un mensaje con botones interactivos
   * @param {string} to - Número de teléfono
   * @param {string} bodyText - Texto del cuerpo
   * @param {Array<{id: string, title: string}>} buttons - Botones
   * @returns {Promise<{ok: boolean, messageId?: string, error?: string}>}
   */
  async sendInteractiveButtons(to, bodyText, buttons) {
    try {
      const response = await this.client.messages.sendInteractiveButtons({
        phoneNumberId: this.phoneNumberId,
        to,
        bodyText,
        buttons,
      });

      return {
        ok: true,
        messageId: response.messages?.[0]?.id,
        meta: {
          phoneNumberId: this.phoneNumberId,
          response,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message,
        meta: {
          phoneNumberId: this.phoneNumberId,
          providerError: this.serializeError(err),
        },
      };
    }
  }
}

module.exports = KapsoWhatsAppAdapter;
