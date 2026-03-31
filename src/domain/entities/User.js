// ============================================================================
// User Entity (Domain Model)
// ============================================================================
// Representa un usuario en el dominio de negocio
// Agnóstico de la BD y frameworks
// ============================================================================

class User {
  constructor(id, phoneNumber, defaultCurrency, createdAt = null, updatedAt = null) {
    this.id = id;
    this.phoneNumber = phoneNumber;
    this.defaultCurrency = defaultCurrency;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Valida que el usuario tenga datos válidos
   * @returns {boolean}
   */
  isValid() {
    return this.phoneNumber && this.defaultCurrency;
  }

  /**
   * Obtiene el nombre de la moneda por defecto
   * @returns {string}
   */
  getDefaultCurrency() {
    return this.defaultCurrency;
  }

  /**
   * Actualiza la moneda por defecto
   * @param {string} currency
   */
  setDefaultCurrency(currency) {
    this.defaultCurrency = currency;
  }
}

module.exports = User;
