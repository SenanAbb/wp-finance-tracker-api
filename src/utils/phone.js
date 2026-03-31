function normalizeTwilioFromToE164(from) {
  if (!from) return null;
  const trimmed = String(from).trim();
  const noPrefix = trimmed.replace(/^whatsapp:\s*/i, "");
  const noSpaces = noPrefix.replace(/\s+/g, "");

  // Keep leading '+' if present, then keep digits only.
  const hasPlus = noSpaces.startsWith("+");
  const digitsOnly = noSpaces.replace(/[^0-9]/g, "");
  if (!digitsOnly) return null;
  return hasPlus ? `+${digitsOnly}` : `+${digitsOnly}`;
}

function isE164(phone) {
  if (!phone) return false;
  return /^\+[1-9]\d{1,14}$/.test(String(phone));
}

module.exports = {
  normalizeTwilioFromToE164,
  isE164,
};
