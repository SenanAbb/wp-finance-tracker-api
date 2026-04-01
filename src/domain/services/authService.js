// ============================================================================
// Auth Service (Domain Service)
// ============================================================================
// Lógica de negocio relacionada con autenticación
// Usa repositories para acceso a datos (agnóstico de BD)
// ============================================================================

const { generateOTP, hashOTP, verifyOTP } = require('../../utils/otp.js');
const { generateAccessToken, generateRefreshToken, hashToken, getRefreshTokenExpiresAt } = require('../../utils/jwt.js');
const { validatePhoneNumber } = require('../../utils/phoneValidator.js');

const OTP_EXPIRATION = parseInt(process.env.OTP_EXPIRATION || '600', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '900', 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10);
const OTP_DEBUG_DETAILS = String(process.env.OTP_DEBUG_DETAILS || '').toLowerCase() === 'true';

function isWhatsAppConversationWindowError(sendResult) {
  const providerMessage = String(
    sendResult?.meta?.providerError?.message || sendResult?.error || '',
  ).toLowerCase();

  return providerMessage.includes('cannot send non-template messages outside the 24-hour window');
}

class AuthService {
  constructor(authRepository, userRepository, sessionService, kapsoAdapter = null) {
    this.authRepository = authRepository;
    this.userRepository = userRepository;
    this.sessionService = sessionService;
    this.kapsoAdapter = kapsoAdapter;
  }

  /**
   * Solicita un login por teléfono
   * @param {string} phoneNumber
   * @param {string} ip
   * @param {string} userAgent
   * @param {Object} log
   * @returns {Promise<Object>} - { ok: boolean, error?: string, expiresIn?: number }
   */
  async requestLogin(phoneNumber, ip, userAgent, log = null) {
    try {
      // PASO 1: Validar formato y país del teléfono
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }

      // PASO 2: Verificar rate limit por IP
      const rateLimitedByIp = await this.authRepository.checkRateLimit(
        ip,
        'request_login',
        RATE_LIMIT_WINDOW,
        RATE_LIMIT_MAX_REQUESTS,
      );

      // PASO 2b: Verificar rate limit por teléfono (más estricto)
      const rateLimitedByPhone = await this.authRepository.checkRateLimit(
        ip,
        'request_login',
        RATE_LIMIT_WINDOW,
        RATE_LIMIT_MAX_REQUESTS,
        phoneNumber,
      );

      if (rateLimitedByIp || rateLimitedByPhone) {
        await this.authRepository.createRateLimit({
          ipAddress: ip,
          phoneNumber,
          requestType: 'request_login',
          success: false,
        });
        return { ok: false, error: 'Too many login attempts. Try again later.' };
      }

      // PASO 3: Buscar usuario en BD
      const user = await this.userRepository.getUserByPhone(phoneNumber);
      if (!user) {
        await this.authRepository.createRateLimit({
          ipAddress: ip,
          phoneNumber,
          requestType: 'request_login',
          success: false,
        });
        // Respuesta genérica para evitar enumeración de usuarios
        return { ok: true, expiresIn: OTP_EXPIRATION };
      }

      // PASO 4: Generar OTP
      const otp = generateOTP();
      const codeHash = hashOTP(otp);
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION * 1000);

      // PASO 5: Crear challenge en BD
      const challenge = await this.authRepository.createAuthChallenge({
        phoneNumber,
        codeHash,
        expiresAt,
        ip,
        userAgent,
      });

      // PASO 6: Registrar intento exitoso
      await this.authRepository.createRateLimit({
        ipAddress: ip,
        phoneNumber,
        requestType: 'request_login',
        success: true,
      });

      const isDev = process.env.NODE_ENV !== 'production';

      if (this.kapsoAdapter) {
        const sendResult = await this.kapsoAdapter.sendText(
          phoneNumber,
          `Tu código de acceso para Finance Tracker es: ${otp}. Caduca en ${Math.floor(OTP_EXPIRATION / 60)} minutos.`,
        );

        if (!sendResult.ok) {
          const userFriendlyError = isWhatsAppConversationWindowError(sendResult)
            ? 'Para iniciar sesión, primero tienes que abrir conversación por WhatsApp con Finance Tracker y enviarnos un mensaje.'
            : 'Failed to send OTP via WhatsApp';

          log?.error?.(
            {
              phoneNumber,
              error: sendResult.error,
              phoneNumberId: sendResult.meta?.phoneNumberId,
              providerError: sendResult.meta?.providerError,
            },
            'Failed to send OTP via WhatsApp',
          );
          return {
            ok: false,
            error: userFriendlyError,
            ...(OTP_DEBUG_DETAILS && {
              details: {
                providerError: sendResult.meta?.providerError || null,
                providerMessage: sendResult.error || null,
                phoneNumberId: sendResult.meta?.phoneNumberId || null,
              },
            }),
          };
        }

        log?.info?.(
          {
            phoneNumber,
            messageId: sendResult.messageId,
            phoneNumberId: sendResult.meta?.phoneNumberId,
          },
          'OTP sent via WhatsApp',
        );
      } else if (!isDev) {
        return { ok: false, error: 'OTP delivery service is not configured' };
      }

      return {
        ok: true,
        expiresIn: OTP_EXPIRATION,
        ...(isDev && { otp }), // Solo en desarrollo
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Verifica un OTP e inicia sesión
   * @param {string} phoneNumber
   * @param {string} otp
   * @param {string} ip
   * @returns {Promise<Object>} - { ok: boolean, error?: string, accessToken?: string, refreshToken?: string, expiresIn?: number }
   */
  async verifyOTP(phoneNumber, otp, ip) {
    try {
      // PASO 1: Validar formato del teléfono
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }

      // PASO 1b: Rate limit de verificación OTP (IP + teléfono)
      const verifyLimitedByIp = await this.authRepository.checkRateLimit(
        ip,
        'verify_otp',
        RATE_LIMIT_WINDOW,
        RATE_LIMIT_MAX_REQUESTS,
      );

      const verifyLimitedByPhone = await this.authRepository.checkRateLimit(
        ip,
        'verify_otp',
        RATE_LIMIT_WINDOW,
        RATE_LIMIT_MAX_REQUESTS,
        phoneNumber,
      );

      if (verifyLimitedByIp || verifyLimitedByPhone) {
        await this.authRepository.createRateLimit({
          ipAddress: ip,
          phoneNumber,
          requestType: 'verify_otp',
          success: false,
        });
        return { ok: false, error: 'Too many OTP verification attempts. Try again later.' };
      }

      // PASO 2: Obtener challenge activo
      const challenge = await this.authRepository.getActiveAuthChallenge(phoneNumber);
      if (!challenge) {
        await this.authRepository.createRateLimit({
          ipAddress: ip,
          phoneNumber,
          requestType: 'verify_otp',
          success: false,
        });
        return { ok: false, error: 'No active OTP challenge found' };
      }

      // PASO 3: Verificar que no se excedieron intentos fallidos
      if (challenge.failed_attempts >= OTP_MAX_ATTEMPTS) {
        await this.authRepository.createRateLimit({
          ipAddress: ip,
          phoneNumber,
          requestType: 'verify_otp',
          success: false,
        });
        return { ok: false, error: 'Too many failed attempts. Request a new OTP.' };
      }

      // PASO 4: Verificar OTP
      let otpValid = false;
      try {
        otpValid = verifyOTP(otp, challenge.code_hash);
      } catch (err) {
        // Error en comparación de timing-safe
        otpValid = false;
      }

      if (!otpValid) {
        // Incrementar intentos fallidos
        await this.authRepository.incrementFailedAttempts(challenge.id);
        await this.authRepository.createRateLimit({
          ipAddress: ip,
          phoneNumber,
          requestType: 'verify_otp',
          success: false,
        });
        return { ok: false, error: 'Invalid OTP' };
      }

      // PASO 5: Marcar challenge como consumido
      await this.authRepository.consumeAuthChallenge(challenge.id);

      // PASO 6: Obtener usuario
      const user = await this.userRepository.getUserByPhone(phoneNumber);
      if (!user) {
        return { ok: false, error: 'User not found' };
      }

      // PASO 7: Crear sesión
      const session = await this.sessionService.createSession(user.id, {
        ttlMs: 24 * 60 * 60 * 1000, // 24 horas
      });

      // PASO 8: Generar tokens
      const accessToken = generateAccessToken(user.id, session.id);
      const refreshToken = generateRefreshToken();
      const refreshTokenHash = hashToken(refreshToken);
      const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

      // PASO 9: Guardar refresh token en BD
      await this.authRepository.createRefreshToken({
        sessionId: session.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
      });

      // PASO 10: Registrar intento exitoso
      await this.authRepository.createRateLimit({
        ipAddress: ip,
        phoneNumber,
        requestType: 'verify_otp',
        success: true,
      });

      return {
        ok: true,
        accessToken,
        refreshToken,
        expiresIn: 3600, // Access token expira en 1 hora
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Refresca un Access Token usando un Refresh Token
   * @param {string} refreshToken
   * @returns {Promise<Object>} - { ok: boolean, error?: string, accessToken?: string, expiresIn?: number }
   */
  async refreshToken(refreshToken) {
    try {
      // PASO 1: Hashear refresh token
      const refreshTokenHash = hashToken(refreshToken);

      // PASO 2: Obtener refresh token de BD
      const session = await this.authRepository.getRefreshToken(refreshTokenHash);
      if (!session) {
        return { ok: false, error: 'Invalid or expired refresh token' };
      }

      // PASO 3: Verificar que la sesión no está revocada
      if (session.revoked_at) {
        return { ok: false, error: 'Session has been revoked' };
      }

      // PASO 4: Generar nuevo Access Token
      const accessToken = generateAccessToken(session.user_id, session.id);

      return {
        ok: true,
        accessToken,
        expiresIn: 3600, // Access token expira en 1 hora
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Logout: revoca la sesión y el refresh token
   * @param {string} sessionId
   * @returns {Promise<Object>} - { ok: boolean, error?: string }
   */
  async logout(sessionId) {
    try {
      // PASO 1: Revocar sesión
      await this.sessionService.revokeSession(sessionId);

      // PASO 2: Revocar refresh token (si existe)
      // Nota: El refresh token se revoca automáticamente al revocar la sesión
      // porque refresh_token_hash se limpia

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Valida un JWT y retorna la información del usuario
   * @param {Object} tokenPayload - payload del JWT decodificado
   * @returns {Promise<Object>} - { ok: boolean, error?: string, userId?: string, sessionId?: string }
   */
  async validateToken(tokenPayload) {
    try {
      const { sub: userId, session_id: sessionId } = tokenPayload;

      if (!userId || !sessionId) {
        return { ok: false, error: 'Invalid token payload' };
      }

      // PASO 1: Verificar que la sesión existe y no está revocada
      const session = await this.sessionService.getSessionById(sessionId);
      if (!session || session.revoked_at) {
        return { ok: false, error: 'Session not found or revoked' };
      }

      // PASO 2: Verificar que el usuario existe
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        return { ok: false, error: 'User not found' };
      }

      return {
        ok: true,
        userId,
        sessionId,
        phone: user.phone_number,
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

module.exports = AuthService;
