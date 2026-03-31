// ============================================================================
// Repositories Index
// ============================================================================
// Exporta todas las interfaces de repositories (ports)
// ============================================================================

const UserRepository = require('./userRepository.js');
const AccountRepository = require('./accountRepository.js');
const TransactionRepository = require('./transactionRepository.js');
const StatisticsRepository = require('./statisticsRepository.js');

module.exports = {
  UserRepository,
  AccountRepository,
  TransactionRepository,
  StatisticsRepository,
};
