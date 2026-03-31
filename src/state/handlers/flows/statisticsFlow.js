// ============================================================================
// STATISTICS_FLOW Handler: Mostrar estadísticas y análisis
// ============================================================================
// Responsabilidades:
// 1. Obtener transacciones del período (default: este mes)
// 2. Calcular totales, promedios, tendencias (usando service)
// 3. Generar recomendaciones
// ============================================================================

async function handleStatisticsFlow({ stateMachine, repositories, services, request }) {
  const { user, interpretation, categoriesWithIds } = stateMachine.context;

  const period = interpretation.period || "month";

  try {
    const statistics = await services.statisticsService.getStatistics(user.id, period);

    if (!statistics || statistics.totalExpenses === 0 && statistics.totalIncome === 0) {
      stateMachine.setState('DONE', {
        response: `📊 Estadísticas - ${period}\n\nNo hay transacciones en este período.`,
        skipResponse: false,
      });
      return;
    }

    const recommendations = services.statisticsService.generateRecommendations(statistics);
    const topCategories = services.statisticsService.getTopCategories(statistics.expensesByCategory, 1);
    const topCategory = topCategories[0];

    const periodLabel =
      period === "today"
        ? "Hoy"
        : period === "week"
          ? "Esta semana"
          : period === "month"
            ? "Este mes"
            : "Este año";

    // PASO 1: Mapear category_id a nombre de categoría
    let topCategoryStr = "N/A";
    if (topCategory) {
      const categoryId = topCategory.category;
      let categoryName = categoryId;
      
      // Buscar nombre de categoría en categoriesWithIds
      if (categoriesWithIds) {
        for (const type of ['expense', 'income', 'investment']) {
          const found = categoriesWithIds[type]?.find(c => c.id === categoryId);
          if (found) {
            categoryName = found.name;
            break;
          }
        }
      }
      
      topCategoryStr = `${categoryName}: ${topCategory.total.toFixed(2)} EUR`;
    }

    const recommendationStr = recommendations.length > 0 ? recommendations[0].message : "";

    const response = `📊 Estadísticas - ${periodLabel}\n\n💸 Gastos totales: ${statistics.totalExpenses.toFixed(2)} EUR\n💰 Ingresos totales: ${statistics.totalIncome.toFixed(2)} EUR\n\n📈 Gasto promedio: ${statistics.averageExpense.toFixed(2)} EUR\n\n🏆 Categoría con más gastos:\n${topCategoryStr}\n\n${recommendationStr}`;

    stateMachine.setState('DONE', {
      response,
      skipResponse: false,
    });
  } catch (err) {
    request.log?.error({ error: err.message }, "Failed to fetch statistics");
    stateMachine.setState('DONE', {
      response: "No se pudieron cargar las estadísticas.",
      skipResponse: false,
    });
  }
}

module.exports = {
  handleStatisticsFlow,
};
