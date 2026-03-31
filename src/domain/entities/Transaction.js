// ============================================================================
// Transaction Entity (Domain Model)
// ============================================================================
// Representa una transacción en el dominio de negocio
// Agnóstico de la BD y frameworks
// ============================================================================

class Transaction {
  constructor(id, userId, accountId, type, amount, currency, description = '', category = null, createdAt = null, updatedAt = null) {
    this.id = id;
    this.userId = userId;
    this.accountId = accountId;
    this.type = type; // 'expense' o 'income'
    this.amount = amount;
    this.currency = currency;
    this.description = description;
    this.category = category;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Valida que la transacción tenga datos válidos
   * @returns {boolean}
   */
  isValid() {
    return (
      this.userId &&
      this.accountId &&
      this.type &&
      this.amount > 0 &&
      this.currency &&
      ['expense', 'income'].includes(this.type)
    );
  }

  /**
   * Verifica si es un gasto
   * @returns {boolean}
   */
  isExpense() {
    return this.type === 'expense';
  }

  /**
   * Verifica si es un ingreso
   * @returns {boolean}
   */
  isIncome() {
    return this.type === 'income';
  }

  /**
   * Obtiene el monto con signo (negativo para gastos, positivo para ingresos)
   * @returns {number}
   */
  getSignedAmount() {
    return this.isExpense() ? -this.amount : this.amount;
  }
}

module.exports = Transaction;
