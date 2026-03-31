// ============================================================================
// Category Repository (Port)
// ============================================================================
// Define la interfaz para acceso a datos de categorías
// Implementado por SupabaseCategoryRepository
// ============================================================================

class CategoryRepository {
  /**
   * Obtiene todas las categorías
   * @returns {Promise<Array>}
   */
  async getAllCategories() {
    throw new Error('getAllCategories() must be implemented');
  }

  /**
   * Obtiene categorías por tipo
   * @param {string} type - 'expense', 'income', 'investment'
   * @returns {Promise<Array>}
   */
  async getCategoriesByType(type) {
    throw new Error('getCategoriesByType() must be implemented');
  }

  /**
   * Obtiene categoría por nombre
   * @param {string} name
   * @param {string} type
   * @returns {Promise<Object>}
   */
  async getCategoryByName(name, type) {
    throw new Error('getCategoryByName() must be implemented');
  }

  /**
   * Obtiene categoría por ID
   * @param {string} categoryId
   * @returns {Promise<Object>}
   */
  async getCategoryById(categoryId) {
    throw new Error('getCategoryById() must be implemented');
  }
}

module.exports = CategoryRepository;
