// ============================================================================
// Twilio Client: Enviar mensajes a WhatsApp usando la API de Twilio
// ============================================================================

async function sendWhatsAppMessage({ to, body, env }) {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_WHATSAPP_FROM; // e.g., "whatsapp:+14155238886"

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio credentials not configured", { accountSid: !!accountSid, authToken: !!authToken, fromNumber: !!fromNumber });
    return { ok: false, error: "Twilio not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', fromNumber);
  params.append('Body', body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", data);
      return { ok: false, error: data.message || "Twilio API error" };
    }

    return { ok: true, messageSid: data.sid };
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  sendWhatsAppMessage,
};
