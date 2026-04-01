// ============================================================================
// Auth Routes
// ============================================================================
// Endpoints para autenticación por teléfono y gestión de tokens JWT
// ============================================================================

/**
 * Registra las rutas de autenticación
 * @param {Object} app - Instancia de Fastify
 * @param {Object} services - Objeto con instancias de servicios
 * @param {Function} jwtAuthMiddleware - Middleware JWT para rutas protegidas
 */
async function registerAuthRoutes(app, services, jwtAuthMiddleware) {
  const { authService } = services;

  function parseCookies(cookieHeader) {
    const result = {};
    if (!cookieHeader) return result;
    const parts = String(cookieHeader).split(';');
    for (const part of parts) {
      const [rawKey, ...rest] = part.trim().split('=');
      if (!rawKey) continue;
      const key = rawKey.trim();
      const value = rest.join('=');
      if (!key) continue;
      result[key] = decodeURIComponent(value || '');
    }
    return result;
  }

  function appendSetCookie(reply, cookieValue) {
    const current = reply.getHeader('set-cookie');
    if (!current) {
      reply.header('Set-Cookie', cookieValue);
      return;
    }

    if (Array.isArray(current)) {
      reply.header('Set-Cookie', [...current, cookieValue]);
      return;
    }

    reply.header('Set-Cookie', [String(current), cookieValue]);
  }

  function setAuthCookies(reply, { accessToken, refreshToken, accessMaxAgeSeconds, refreshMaxAgeSeconds }) {
    const isProd = String(process.env.NODE_ENV || 'development').toLowerCase() === 'production';

    const base = `Path=/; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`;
    appendSetCookie(reply, `accessToken=${encodeURIComponent(accessToken)}; ${base}; Max-Age=${accessMaxAgeSeconds}`);
    appendSetCookie(reply, `refreshToken=${encodeURIComponent(refreshToken)}; ${base}; Max-Age=${refreshMaxAgeSeconds}`);
  }

  function clearAuthCookies(reply) {
    const isProd = String(process.env.NODE_ENV || 'development').toLowerCase() === 'production';

    const base = `Path=/; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`;
    appendSetCookie(reply, `accessToken=; ${base}; Max-Age=0`);
    appendSetCookie(reply, `refreshToken=; ${base}; Max-Age=0`);
  }

  /**
   * POST /auth/request-login
   * Solicita un OTP para login por teléfono
   */
  app.post('/auth/request-login', async (request, reply) => {
    const { phone } = request.body;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];

    if (!phone) {
      return reply.status(400).send({
        ok: false,
        error: 'Phone number is required',
      });
    }

    const result = await authService.requestLogin(phone, ip, userAgent, request.log);

    if (!result.ok) {
      return reply.status(400).send(result);
    }

    return reply.status(200).send({ ok: true, expiresIn: result.expiresIn || 3600 });
  });

  /**
   * POST /auth/verify-otp
   * Verifica un OTP e inicia sesión
   */
  app.post('/auth/verify-otp', async (request, reply) => {
    const { phone, otp } = request.body;
    const ip = request.ip;

    if (!phone || !otp) {
      return reply.status(400).send({
        ok: false,
        error: 'Phone number and OTP are required',
      });
    }

    const result = await authService.verifyOTP(phone, otp, ip);

    if (!result.ok) {
      return reply.status(400).send(result);
    }

    if (result.accessToken && result.refreshToken) {
      setAuthCookies(reply, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessMaxAgeSeconds: result.expiresIn || 3600,
        refreshMaxAgeSeconds: parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '604800', 10),
      });
    }

    return reply.status(200).send({ ok: true, expiresIn: result.expiresIn || 3600 });
  });

  /**
   * POST /auth/refresh-token
   * Refresca un Access Token usando un Refresh Token
   */
  app.post('/auth/refresh-token', async (request, reply) => {
    const cookies = parseCookies(request.headers.cookie);
    const refreshToken = request.body?.refreshToken || cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(400).send({
        ok: false,
        error: 'Refresh token is required',
      });
    }

    const result = await authService.refreshToken(refreshToken);

    if (!result.ok) {
      return reply.status(401).send(result);
    }

    if (result.accessToken) {
      const isProd = String(process.env.NODE_ENV || 'development').toLowerCase() === 'production';
      const base = `Path=/; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`;
      appendSetCookie(reply, `accessToken=${encodeURIComponent(result.accessToken)}; ${base}; Max-Age=${result.expiresIn || 3600}`);
    }

    return reply.status(200).send({ ok: true, expiresIn: result.expiresIn || 3600 });
  });

  /**
   * POST /auth/logout
   * Revoca la sesión actual (requiere JWT válido)
   */
  app.post('/auth/logout', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        ok: false,
        error: 'Unauthorized',
      });
    }

    const result = await authService.logout(request.user.sessionId);

    if (!result.ok) {
      return reply.status(400).send(result);
    }

    clearAuthCookies(reply);
    return reply.status(200).send(result);
  });

  /**
   * GET /auth/me
   * Obtiene información del usuario actual (requiere JWT válido)
   */
  app.get('/auth/me', { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        ok: false,
        error: 'Unauthorized',
      });
    }

    return reply.status(200).send({
      ok: true,
      userId: request.user.userId,
      phone: request.user.phone,
      sessionId: request.user.sessionId,
    });
  });
}

module.exports = {
  registerAuthRoutes,
};
