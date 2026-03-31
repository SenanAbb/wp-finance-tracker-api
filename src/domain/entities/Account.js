// ============================================================================
// Account Entity (Domain Model)
// ============================================================================
// Representa una cuenta bancaria en el dominio de negocio
// Agnóstico de la BD y frameworks
// ============================================================================

class Account {
  constructor(id, userId, name, type, currency, balance = 0, createdAt = null, updatedAt = null) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.type = type;
    this.currency = currency;
    this.balance = balance;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Valida que la cuenta tenga datos válidos
   * @returns {boolean}
   */
  isValid() {
    return this.userId && this.name && this.currency && this.balance !== null;
  }

  /**
   * Verifica si la cuenta tiene saldo suficiente
   * @param {number} amount - Monto a verificar
   * @returns {boolean}
   */
  hasSufficientBalance(amount) {
    return this.balance >= amount;
  }

  /**
   * Actualiza el balance de la cuenta
   * @param {number} newBalance
   */
  setBalance(newBalance) {
    this.balance = newBalance;
  }

  /**
   * Obtiene el balance actual
   * @returns {number}
   */
  getBalance() {
    return this.balance;
  }
}

module.exports = Account;
