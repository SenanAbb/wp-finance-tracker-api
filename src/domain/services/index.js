// ============================================================================
// Domain Services Index
// ============================================================================
// Exporta todos los servicios de dominio
// ============================================================================

const UserService = require('./userService.js');
const SessionService = require('./sessionService.js');
const AccountService = require('./accountService.js');
const TransactionService = require('./transactionService.js');
const StatisticsService = require('./statisticsService.js');
const CategoryService = require('./categoryService.js');
const AuthService = require('./authService.js');
const VectorSearchService = require('./vectorSearchService.js');

module.exports = {
  UserService,
  SessionService,
  AccountService,
  TransactionService,
  StatisticsService,
  CategoryService,
  AuthService,
  VectorSearchService,
};
