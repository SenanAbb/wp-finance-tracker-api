// ============================================================================
// JWT Authentication Middleware
// ============================================================================
// Valida JWT Bearer tokens en requests HTTP
// Inyecta información del usuario en request.user
// ============================================================================

const { verifyToken } = require('../utils/jwt.js');

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

/**
 * Middleware para validar JWT Bearer tokens
 * Extrae el token del header Authorization y lo valida
 * @param {Object} authService - Instancia de AuthService
 * @returns {Function} Middleware de Fastify
 */
function createJwtAuthMiddleware(authService) {
  return async (request, reply) => {
    try {
      const cookies = parseCookies(request.headers.cookie);

      // PASO 1: Extraer token desde cookie (preferido) o header Authorization (fallback)
      let token = cookies.accessToken;
      if (!token) {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7); // Remover "Bearer "
        }
      }

      if (!token) {
        return reply.status(401).send({
          ok: false,
          error: 'Missing access token',
        });
      }

      // PASO 3: Verificar firma del JWT
      let payload;
      try {
        payload = verifyToken(token);
      } catch (err) {
        return reply.status(401).send({
          ok: false,
          error: 'Invalid or expired token',
        });
      }

      // PASO 4: Validar token usando AuthService
      const validation = await authService.validateToken(payload);
      if (!validation.ok) {
        return reply.status(401).send({
          ok: false,
          error: validation.error,
        });
      }

      // PASO 5: Inyectar usuario en request
      request.user = {
        userId: validation.userId,
        sessionId: validation.sessionId,
        phone: validation.phone,
      };
    } catch (err) {
      return reply.status(401).send({
        ok: false,
        error: 'Authentication failed',
      });
    }
  };
}

module.exports = {
  createJwtAuthMiddleware,
};
