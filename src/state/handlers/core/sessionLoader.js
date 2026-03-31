// ============================================================================
// SESSION_LOADER Handler: Cargar/verificar sesión del usuario
// ============================================================================
// Responsabilidades:
// 1. Obtener usuario usando UserService
// 2. Buscar sesión activa usando SessionService
// 3. Si no hay sesión → PERMISSION_DENIED (pedir login)
// 4. Si usuario pide login → LOGIN_FLOW
// 5. Si hay sesión válida → AI_INTERPRETING
// ============================================================================

async function handleSessionLoader({ stateMachine, services, request, phoneE164, body }) {
  try {
    // PASO 1: Verificar si el usuario pide login
    const bodyLower = String(body || '').toLowerCase().trim();
    const requestsLogin = bodyLower === 'login' || bodyLower === 'iniciar sesión';

    request.log.info(
      { phone: phoneE164, requestsLogin },
      '🔐 SESSION_LOADER → Verificando sesión',
    );

    // PASO 2: Obtener usuario usando UserService
    const user = await services.userService.getUserByPhone(phoneE164);

    if (!user) {
      // Usuario no existe
      if (requestsLogin) {
        request.log.info({ phone: phoneE164 }, '🔐 SESSION_LOADER → Usuario nuevo, pidió login → LOGIN_FLOW');
        stateMachine.setState('LOGIN_FLOW', {
          phoneE164,
          rawMessage: body,
        });
      } else {
        request.log.info({ phone: phoneE164 }, '🔐 SESSION_LOADER → Usuario no existe, no pidió login → PERMISSION_DENIED');
        stateMachine.setState('PERMISSION_DENIED', {
          response: 'Hola 👋 Parece que es tu primera vez.\n\nEnvía "login" para comenzar.',
          skipResponse: false,
        });
      }
      return;
    }

    // PASO 3: Usuario existe - buscar sesión activa
    const activeSession = await services.sessionService.getActiveSession(user.id);

    if (requestsLogin) {
      request.log.info({ userId: user.id }, '🔐 SESSION_LOADER → Usuario existente pidió login → LOGIN_FLOW');
      stateMachine.setState('LOGIN_FLOW', {
        user,
        phoneE164,
        rawMessage: body,
      });
      return;
    }

    if (!activeSession) {
      request.log.info({ userId: user.id }, '🔐 SESSION_LOADER → Sesión expirada → PERMISSION_DENIED');
      stateMachine.setState('PERMISSION_DENIED', {
        response: 'Tu sesión ha expirado. Envía "login" para iniciar sesión nuevamente.',
        skipResponse: false,
      });
      return;
    }

    // PASO 4: Sesión válida - transicionar a CONTEXT_LOADER
    request.log.info(
      { userId: user.id, sessionId: activeSession.id },
      '🔐 SESSION_LOADER → Sesión válida → CONTEXT_LOADER',
    );
    stateMachine.setState('CONTEXT_LOADER', {
      user,
      session: activeSession,
      rawMessage: body,
      phoneE164,
    });
  } catch (err) {
    request.log.error({ error: err.message }, 'Session loader error');
    stateMachine.setState('ERROR_RESPONSE', {
      error: 'Error verificando sesión: ' + err.message,
    });
  }
}

module.exports = {
  handleSessionLoader,
};
