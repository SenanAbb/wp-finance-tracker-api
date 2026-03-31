// ============================================================================
// Category Service (Domain Service)
// ============================================================================
// Lógica de negocio relacionada con categorías
// Usa repository para acceso a datos (agnóstico de BD)
// ============================================================================

class CategoryService {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  /**
   * Obtiene todas las categorías
   * @returns {Promise<Array>}
   */
  async getAllCategories() {
    return await this.categoryRepository.getAllCategories();
  }

  /**
   * Obtiene categorías por tipo
   * @param {string} type - 'expense', 'income', 'investment'
   * @returns {Promise<Array>}
   */
  async getCategoriesByType(type) {
    return await this.categoryRepository.getCategoriesByType(type);
  }

  /**
   * Obtiene categoría por nombre y tipo
   * Útil para mapear nombres de categorías de usuario a IDs
   * @param {string} name
   * @param {string} type
   * @returns {Promise<Object>}
   */
  async getCategoryByName(name, type) {
    return await this.categoryRepository.getCategoryByName(name, type);
  }

  /**
   * Obtiene categoría por ID
   * @param {string} categoryId
   * @returns {Promise<Object>}
   */
  async getCategoryById(categoryId) {
    return await this.categoryRepository.getCategoryById(categoryId);
  }

  /**
   * Obtiene todas las categorías con estructura para contexto
   * Retorna objeto con categorías agrupadas por tipo
   * @returns {Promise<Object>}
   */
  async getCategoriesForContext() {
    const allCategories = await this.getAllCategories();
    
    return {
      expense: allCategories
        .filter(c => c.type === 'expense')
        .map(c => ({ id: c.id, name: c.name })),
      income: allCategories
        .filter(c => c.type === 'income')
        .map(c => ({ id: c.id, name: c.name })),
      investment: allCategories
        .filter(c => c.type === 'investment')
        .map(c => ({ id: c.id, name: c.name })),
    };
  }

  /**
   * Busca categoría por nombre aproximado (case-insensitive)
   * Útil para matching de categorías del usuario
   * @param {string} searchName
   * @param {string} type
   * @returns {Promise<Object|null>}
   */
  async findCategoryByNameFuzzy(searchName, type) {
    const categories = await this.getCategoriesByType(type);
    const searchLower = searchName.toLowerCase().trim();
    
    // Búsqueda exacta
    let match = categories.find(c => c.name.toLowerCase() === searchLower);
    if (match) return match;
    
    // Búsqueda parcial (contiene)
    match = categories.find(c => c.name.toLowerCase().includes(searchLower));
    if (match) return match;
    
    // Búsqueda inversa (está contenido)
    match = categories.find(c => searchLower.includes(c.name.toLowerCase()));
    if (match) return match;
    
    return null;
  }
}

module.exports = CategoryService;
