// ============================================================================
// Account Service (Domain Service)
// ============================================================================
// Lógica de negocio relacionada con cuentas
// Usa repositories para acceso a datos (agnóstico de BD)
// ============================================================================

const { Account } = require('../entities/index.js');

class AccountService {
  constructor(accountRepository) {
    this.accountRepository = accountRepository;
  }

  /**
   * Obtiene todas las cuentas del usuario con balance total
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} { accounts: Array<Account>, totalBalance: number }
   */
  async getAllAccounts(userId) {
    const accountsData = await this.accountRepository.getAccountsByUserId(userId);
    const accounts = accountsData.map(a => this._mapToEntity(a));
    
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return {
      accounts,
      totalBalance,
    };
  }

  /**
   * Obtiene una cuenta por su ID
   * @param {string} accountId
   * @returns {Promise<Account>}
   */
  async getAccountById(accountId) {
    const accountData = await this.accountRepository.getAccountById(accountId);
    if (!accountData) return null;
    return this._mapToEntity(accountData);
  }

  /**
   * Crea una nueva cuenta con validaciones
   * @param {string} userId - ID del usuario
   * @param {Object} accountData - Datos de la cuenta
   * @returns {Promise<Account>} Cuenta creada
   */
  async createNewAccount(userId, accountData) {
    // Validar tipo de cuenta
    const allowedTypes = ['banco', 'cash', 'inversion'];
    if (!allowedTypes.includes(accountData.type?.toLowerCase())) {
      throw new Error(`Tipo de cuenta inválido. Tipos permitidos: ${allowedTypes.join(', ')}`);
    }

    // Validar moneda
    if (!/^[A-Z]{1,3}$/.test(accountData.currency)) {
      throw new Error('Moneda inválida. Usa: EUR, USD, GBP, etc.');
    }

    // Validar balance inicial
    const initialBalance = accountData.balance || 0;
    if (typeof initialBalance !== 'number' || initialBalance < 0) {
      throw new Error('Balance inicial debe ser un número no negativo');
    }

    // Crear cuenta
    const createdData = await this.accountRepository.createAccount(userId, {
      name: accountData.name,
      type: accountData.type.toLowerCase(),
      currency: accountData.currency.toUpperCase(),
      balance: initialBalance,
    });

    return this._mapToEntity(createdData);
  }

  /**
   * Obtiene el balance actual de una cuenta
   * @param {string} accountId - ID de la cuenta
   * @returns {Promise<number>} Balance actual
   */
  async getAccountBalance(accountId) {
    const account = await this.getAccountById(accountId);
    return account?.getBalance() || 0;
  }

  /**
   * Actualiza el balance de una cuenta
   * @param {string} accountId - ID de la cuenta
   * @param {number} amount - Monto a sumar/restar
   * @returns {Promise<Account>} Cuenta actualizada
   */
  async updateAccountBalance(accountId, amount) {
    const account = await this.getAccountById(accountId);
    const newBalance = (account.balance || 0) + amount;

    if (newBalance < 0) {
      throw new Error('Balance insuficiente');
    }

    const updatedData = await this.accountRepository.updateAccount(accountId, {
      balance: newBalance,
    });

    return this._mapToEntity(updatedData);
  }

  /**
   * Mapea datos de BD a entidad de dominio
   * @private
   * @param {Object} accountData
   * @returns {Account}
   */
  _mapToEntity(accountData) {
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

module.exports = AccountService;
