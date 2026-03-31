// ============================================================================
// Supabase Category Repository (Adapter)
// ============================================================================
// Implementación de CategoryRepository usando Supabase
// ============================================================================

const CategoryRepository = require('../../repositories/categoryRepository.js');

class SupabaseCategoryRepository extends CategoryRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async getAllCategories() {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getCategoriesByType(type) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('type', type)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getCategoryByName(name, type) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('name', name.toLowerCase())
      .eq('type', type)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getCategoryById(categoryId) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
}

module.exports = SupabaseCategoryRepository;
