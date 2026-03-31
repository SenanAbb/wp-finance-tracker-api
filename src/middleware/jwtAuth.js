// ============================================================================
// JWT Authentication Middleware
// ============================================================================
// Valida JWT Bearer tokens en requests HTTP
// Inyecta información del usuario en request.user
// ============================================================================

const { verifyToken } = require('../utils/jwt.js');

/**
 * Middleware para validar JWT Bearer tokens
 * Extrae el token del header Authorization y lo valida
 * @param {Object} authService - Instancia de AuthService
 * @returns {Function} Middleware de Fastify
 */
function createJwtAuthMiddleware(authService) {
  return async (request, reply) => {
    try {
      // PASO 1: Extraer header Authorization
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          ok: false,
          error: 'Missing or invalid Authorization header',
        });
      }

      // PASO 2: Extraer token
      const token = authHeader.slice(7); // Remover "Bearer "

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
