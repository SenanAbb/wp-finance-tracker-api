function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twimlMessage(text) {
  const msg = escapeXml(text);
  return `<?xml version="1.0" encoding="UTF-8"?>` + `<Response><Message>${msg}</Message></Response>`;
}

module.exports = {
  twimlMessage,
};
