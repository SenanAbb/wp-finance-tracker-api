// ============================================================================
// StateMachine: Máquina de estados para controlar el flujo de procesamiento
// ============================================================================
// Mantiene el estado actual y el contexto compartido entre transiciones.
// Cada transición actualiza el estado y el contexto.
// ============================================================================

class StateMachine {
  constructor(initialState = 'IDLE') {
    this.state = initialState;
    this.context = {};
    this.history = [{ state: initialState, timestamp: Date.now() }];
  }

  // Transicionar a nuevo estado y actualizar contexto
  setState(newState, contextUpdate = {}) {
    this.context = { ...this.context, ...contextUpdate };
    this.state = newState;
    this.history.push({
      state: newState,
      timestamp: Date.now(),
      contextKeys: Object.keys(contextUpdate),
    });
  }

  // Obtener estado actual y contexto
  getState() {
    return {
      state: this.state,
      context: this.context,
    };
  }

  // Obtener historial de transiciones (para debugging)
  getHistory() {
    return this.history;
  }

  // Verificar si está en estado final
  isDone() {
    return this.state === 'DONE';
  }

  // Verificar si está en estado de error
  isError() {
    return this.state === 'ERROR_RESPONSE';
  }
}

module.exports = StateMachine;
