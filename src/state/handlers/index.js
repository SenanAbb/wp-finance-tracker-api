// ============================================================================
// Handlers Index: Registro de todos los handlers por estado
// ============================================================================
// Centraliza la importación de todos los handlers para fácil mantenimiento
// ============================================================================

const { handleIdle } = require("./core/idle.js");
const { handleSessionLoader } = require("./core/sessionLoader.js");
const { handleLoginFlow } = require("./core/loginFlow.js");
const { handleAIInterpreting } = require("./core/aiInterpreting.js");
const { handleVectorSearch } = require("./core/vectorSearch.js");
const { handleContextLoader } = require("./core/contextLoader.js");
const { handlePermissionDenied } = require("./core/permissionDenied.js");
const { handleBalanceFlow } = require("./flows/balanceFlow.js");
const { handleTransactionFlow } = require("./flows/transactionFlow.js");
const { handleCreateAccountFlow } = require("./flows/createAccountFlow.js");
const { handleListAccountsFlow } = require("./flows/listAccountsFlow.js");
const { handleListTransactionsFlow } = require("./flows/listTransactionsFlow.js");
const { handleStatisticsFlow } = require("./flows/statisticsFlow.js");
const { handleErrorResponse } = require("./core/errorResponse.js");
const { handleDone } = require("./core/done.js");

const handlers = {
  IDLE: handleIdle,
  SESSION_LOADER: handleSessionLoader,
  LOGIN_FLOW: handleLoginFlow,
  VECTOR_SEARCH: handleVectorSearch,
  AI_INTERPRETING: handleAIInterpreting,
  CONTEXT_LOADER: handleContextLoader,
  PERMISSION_DENIED: handlePermissionDenied,
  BALANCE_FLOW: handleBalanceFlow,
  TRANSACTION_FLOW: handleTransactionFlow,
  CREATE_ACCOUNT_FLOW: handleCreateAccountFlow,
  LIST_ACCOUNTS_FLOW: handleListAccountsFlow,
  LIST_TRANSACTIONS_FLOW: handleListTransactionsFlow,
  STATISTICS_FLOW: handleStatisticsFlow,
  ERROR_RESPONSE: handleErrorResponse,
  DONE: handleDone,
};

module.exports = handlers;
