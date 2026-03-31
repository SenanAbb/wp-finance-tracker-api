// ============================================================================
// Transaction Service (Domain Service)
// ============================================================================
// Lógica de negocio relacionada con transacciones
// Usa repositories para acceso a datos (agnóstico de BD)
// ============================================================================

const { Transaction, Account } = require('../entities/index.js');

class TransactionService {
  constructor(transactionRepository, accountRepository) {
    this.transactionRepository = transactionRepository;
    this.accountRepository = accountRepository;
  }

  /**
   * Crea una nueva transacción con validaciones
   * @param {string} userId - ID del usuario
   * @param {Object} transactionData - Datos de la transacción
   * @returns {Promise<Transaction>} Transacción creada
   */
  async createTransaction(userId, transactionData) {
    // Validar tipo
    const allowedTypes = ['expense', 'income'];
    if (!allowedTypes.includes(transactionData.type)) {
      throw new Error(`Tipo inválido. Tipos permitidos: ${allowedTypes.join(', ')}`);
    }

    // Validar monto
    if (typeof transactionData.amount !== 'number' || transactionData.amount <= 0) {
      throw new Error('Monto debe ser un número positivo');
    }

    // Validar cuenta
    const accountData = await this.accountRepository.getAccountById(transactionData.account_id);
    if (!accountData) {
      throw new Error('Cuenta no encontrada');
    }

    const account = this._mapAccountToEntity(accountData);

    // Crear transacción
    const createdData = await this.transactionRepository.createTransaction(userId, transactionData);

    // Actualizar balance de la cuenta
    const balanceChange = transactionData.type === 'expense' 
      ? -transactionData.amount 
      : transactionData.amount;

    await this.accountRepository.updateAccount(transactionData.account_id, {
      balance: (account.balance || 0) + balanceChange,
    });

    return this._mapTransactionToEntity(createdData);
  }

  /**
   * Obtiene una transacción por su ID
   * @param {string} transactionId
   * @returns {Promise<Transaction>}
   */
  async getTransactionById(transactionId) {
    const transactionData = await this.transactionRepository.getTransactionById(transactionId);
    if (!transactionData) return null;
    return this._mapTransactionToEntity(transactionData);
  }

  /**
   * Obtiene las últimas N transacciones del usuario
   * @param {string} userId - ID del usuario
   * @param {number} limit - Número de transacciones
   * @returns {Promise<Array<Transaction>>} Array de transacciones
   */
  async getRecentTransactions(userId, limit = 10) {
    const transactionsData = await this.transactionRepository.getTransactionsByUserId(userId, limit, 0);
    return transactionsData.map(t => this._mapTransactionToEntity(t));
  }

  /**
   * Calcula totales de gastos e ingresos
   * @param {Array<Transaction>} transactions - Array de transacciones
   * @returns {Object} { totalExpenses: number, totalIncome: number }
   */
  calculateTotals(transactions) {
    const totals = {
      totalExpenses: 0,
      totalIncome: 0,
    };

    (transactions || []).forEach((tx) => {
      if (tx.isExpense()) {
        totals.totalExpenses += tx.amount || 0;
      } else if (tx.isIncome()) {
        totals.totalIncome += tx.amount || 0;
      }
    });

    return totals;
  }

  /**
   * Agrupa transacciones por categoría
   * @param {Array<Transaction>} transactions - Array de transacciones
   * @returns {Object} Transacciones agrupadas por categoría
   */
  categorizeTransactions(transactions) {
    const categorized = {};

    (transactions || []).forEach((tx) => {
      const category = tx.category || 'Sin categoría';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(tx);
    });

    return categorized;
  }

  /**
   * Mapea datos de BD a entidad Transaction
   * @private
   * @param {Object} transactionData
   * @returns {Transaction}
   */
  _mapTransactionToEntity(transactionData) {
    return new Transaction(
      transactionData.id,
      transactionData.user_id,
      transactionData.account_id,
      transactionData.type,
      transactionData.amount,
      transactionData.currency,
      transactionData.description,
      transactionData.category,
      transactionData.created_at,
      transactionData.updated_at,
    );
  }

  /**
   * Mapea datos de BD a entidad Account
   * @private
   * @param {Object} accountData
   * @returns {Account}
   */
  _mapAccountToEntity(accountData) {
    return new Account(
      accountData.id,
      accountData.user_id,
      accountData.name,
      accountData.type,
      accountData.currency,
      accountData.balance,
      accountData.created_at,
      accountData.updated_at,
    );
  }
}

module.exports = TransactionService;
