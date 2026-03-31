// ============================================================================
// Domain Entities Index
// ============================================================================
// Exporta todas las entidades de dominio
// ============================================================================

const User = require('./User.js');
const Account = require('./Account.js');
const Transaction = require('./Transaction.js');
const Session = require('./Session.js');

module.exports = {
  User,
  Account,
  Transaction,
  Session,
};
