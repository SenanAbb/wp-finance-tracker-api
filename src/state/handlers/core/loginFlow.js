// ============================================================================
// LOGIN_FLOW Handler: Crear/obtener usuario y crear sesión
// ============================================================================
// Responsabilidades:
// 1. Obtener o crear usuario usando UserService
// 2. Crear sesión para el usuario usando SessionService
// 3. Transicionar a AI_INTERPRETING
// ============================================================================

async function handleLoginFlow({ stateMachine, services, request, phoneE164, body, ttlMs }) {
  try {
    // PASO 1: Obtener o crear usuario
    const user = await services.userService.getOrCreateUser(phoneE164, {
      defaultCurrency: 'EUR',
    });

    request.log.info({ userId: user.id }, 'User obtained or created');

    // PASO 2: Crear sesión para el usuario
    const session = await services.sessionService.createSession(user.id, {
      ttlMs: ttlMs || 24 * 60 * 60 * 1000, // 24 horas
    });

    request.log.info({ userId: user.id, sessionId: session.id }, 'Session created');

    // PASO 3: Transicionar a DONE con mensaje de bienvenida
    // El usuario ha hecho login exitosamente
    stateMachine.setState('DONE', {
      response: `¡Bienvenido! 👋\n\nAhora puedo ayudarte con:\n\n💰 Balance - "dime mi balance"\n💸 Gastos - "cafe 12"\n💳 Cuentas - "mostrar mis cuentas"\n📊 Estadísticas - "dame estadísticas"\n📝 Transacciones - "ultimas 5 transacciones"\n➕ Nueva Cuenta - "crear cuenta banco EUR"`,
      skipResponse: false,
    });
  } catch (err) {
    request.log.error({ error: err.message }, 'Login flow error');
    stateMachine.setState('ERROR_RESPONSE', {
      error: 'Error durante el login: ' + err.message,
    });
  }
}

module.exports = {
  handleLoginFlow,
};
