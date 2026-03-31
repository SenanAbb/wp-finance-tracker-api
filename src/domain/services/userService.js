// ============================================================================
// User Service (Domain Service)
// ============================================================================
// Lógica de negocio relacionada con usuarios
// Usa repositories para acceso a datos (agnóstico de BD)
// ============================================================================

const { User } = require('../entities/index.js');

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Obtiene un usuario por su ID
   * @param {string} userId
   * @returns {Promise<User>}
   */
  async getUserById(userId) {
    const userData = await this.userRepository.getUserById(userId);
    if (!userData) return null;
    return this._mapToEntity(userData);
  }

  /**
   * Obtiene un usuario por su número de teléfono
   * @param {string} phoneE164
   * @returns {Promise<User>}
   */
  async getUserByPhone(phoneE164) {
    const userData = await this.userRepository.getUserByPhone(phoneE164);
    if (!userData) return null;
    return this._mapToEntity(userData);
  }

  /**
   * Crea un nuevo usuario
   * @param {Object} userData - { phone_number, default_currency }
   * @returns {Promise<User>}
   */
  async createUser(userData) {
    const created = await this.userRepository.createUser(userData);
    return this._mapToEntity(created);
  }

  /**
   * Actualiza un usuario
   * @param {string} userId
   * @param {Object} userData
   * @returns {Promise<User>}
   */
  async updateUser(userId, userData) {
    const updated = await this.userRepository.updateUser(userId, userData);
    return this._mapToEntity(updated);
  }

  /**
   * Obtiene un usuario o lo crea si no existe
   * Lógica de negocio: si el usuario no existe, lo crea automáticamente
   * @param {string} phoneE164
   * @param {Object} options - { defaultCurrency = 'EUR' }
   * @returns {Promise<User>}
   */
  async getOrCreateUser(phoneE164, options = {}) {
    const { defaultCurrency = 'EUR' } = options;

    // Intentar obtener usuario existente
    let user = await this.getUserByPhone(phoneE164);
    if (user) {
      return user;
    }

    // Usuario no existe - crear nuevo
    const newUser = await this.createUser({
      phone_number: phoneE164,
      default_currency: defaultCurrency,
    });

    return newUser;
  }

  /**
   * Mapea datos de BD a entidad de dominio
   * @private
   * @param {Object} userData
   * @returns {User}
   */
  _mapToEntity(userData) {
    return new User(
      userData.id,
      userData.phone_number,
      userData.default_currency,
      userData.created_at,
      userData.updated_at,
    );
  }
}

module.exports = UserService;
