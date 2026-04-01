function isE164(phone) {
  if (!phone) return false;
  return /^\+[1-9]\d{1,14}$/.test(String(phone));
}

module.exports = {
  isE164,
};
