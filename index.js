// ============================================================================
// ENTRY POINT: Servidor Fastify para WhatsApp Finance Tracker
// ============================================================================
// Este archivo inicia el servidor API que recibe webhooks de Twilio (WhatsApp)
// y procesa comandos financieros del usuario.
// ============================================================================

require("dotenv").config();

const Fastify = require("fastify");
const { getLoggerOptions } = require("./src/logger.js");
const { isAppError } = require("./src/utils/errors.js");
const kapsoRoutes = require("./src/routes/kapso.js");
const { registerAuthRoutes } = require("./src/routes/auth.js");
const KapsoWhatsAppAdapter = require("./src/adapters/implementations/kapso/kapsoWhatsAppClient.js");
const { createSupabaseRepositories } = require("./src/adapters/implementations/supabase/index.js");
const { createJwtAuthMiddleware } = require("./src/middleware/jwtAuth.js");
const {
  UserService,
  SessionService,
  AccountService,
  TransactionService,
  StatisticsService,
  CategoryService,
  AuthService,
  VectorSearchService,
} = require("./src/domain/services/index.js");

const HOST = process.env.API_HOST || "0.0.0.0";
const PORT = Number(process.env.API_PORT || 3001);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  process.env.WEB_APP_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
].filter(Boolean);

async function main() {
  // Crear instancia de Fastify con logger configurado
  const app = Fastify({
    logger: getLoggerOptions(process.env),
    disableRequestLogging: true,
  });

  // Hook: CORS + Logging
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;

    // Agregar headers CORS
    if (allowedOrigins.includes(origin)) {
      reply.header("Access-Control-Allow-Origin", origin);
    }
    reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    reply.header("Access-Control-Allow-Credentials", "true");

    // Manejar preflight requests (OPTIONS)
    if (request.method === "OPTIONS") {
      reply.code(200).send();
      return;
    }

    // Loguear request
    request.log.info(
      {
        method: request.method,
        url: request.url,
        ip: request.ip,
      },
      "HTTP",
    );
  });

  // Hook: Loguear cada response HTTP que sale (con tiempo de respuesta)
  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTimeMs: reply.elapsedTime,
      },
      "HTTP done",
    );
  });

  // Manejador global de errores
  // Si hay error en Kapso, responde con 200 (ya respondió)
  // Si hay error en otra ruta, responde con JSON
  app.setErrorHandler(async (err, request, reply) => {
    const appErr = isAppError(err)
      ? err
      : {
          statusCode: 500,
          code: err?.code || "UNHANDLED_ERROR",
          publicMessage: "Error interno",
        };

    request.log.error({ err }, "Unhandled error");

    const isKapsoRoute = request.url && request.url.startsWith("/kapso/");
    if (isKapsoRoute) {
      // Kapso ya recibió 200, solo loguear
      if (!reply.sent) {
        reply.code(200).send("EVENT_RECEIVED");
      }
      return;
    }

    // Para otras rutas: responder con JSON
    reply
      .code(appErr.statusCode || 500)
      .type("application/json")
      .send({
        ok: false,
        error: {
          code: appErr.code,
          message: appErr.publicMessage,
        },
      });
  });

  // Registrar middleware JWT para rutas protegidas
  // Se registrará después de inicializar los servicios
  let jwtAuthMiddleware;
  let kapsoAdapter = null;

  if (process.env.KAPSO_API_KEY && process.env.KAPSO_PHONE_NUMBER_ID) {
    kapsoAdapter = new KapsoWhatsAppAdapter({
      kapsoApiKey: process.env.KAPSO_API_KEY,
      phoneNumberId: process.env.KAPSO_PHONE_NUMBER_ID,
    });
  }

  // Inicializar repositories y services (agnóstico de la BD)
  let repositories;
  let services;
  try {
    // Crear repositories desde el adaptador Supabase
    // El adaptador es responsable de crear el cliente de Supabase
    repositories = await createSupabaseRepositories(process.env);

    // Crear instancias de servicios de dominio
    const sessionService = new SessionService(repositories.sessionRepository);
    services = {
      userService: new UserService(repositories.userRepository),
      sessionService,
      accountService: new AccountService(repositories.accountRepository),
      transactionService: new TransactionService(
        repositories.transactionRepository,
        repositories.accountRepository,
      ),
      statisticsService: new StatisticsService(repositories.statisticsRepository),
      categoryService: new CategoryService(repositories.categoryRepository),
      vectorSearchService: new VectorSearchService(repositories.supabase),
      authService: new AuthService(
        repositories.authRepository,
        repositories.userRepository,
        sessionService,
        kapsoAdapter,
      ),
    };

    // Crear middleware JWT después de inicializar AuthService
    jwtAuthMiddleware = createJwtAuthMiddleware(services.authService);

    app.log.info("Repositories and services initialized successfully");
  } catch (err) {
    repositories = null;
    services = null;
    app.log.error({ err }, "Repositories and services initialization failed");
  }

  // Endpoint de salud: verificar que el servidor está vivo
  app.get("/health", async () => {
    return {
      ok: true,
      repositories: Boolean(repositories),
      services: Boolean(services),
    };
  });

  // Registrar rutas de autenticación (públicas y protegidas)
  if (services && jwtAuthMiddleware) {
    await registerAuthRoutes(app, services, jwtAuthMiddleware);
  }

  // Registrar rutas de Kapso (webhook principal para Meta Cloud API)
  if (kapsoAdapter) {
    await app.register(kapsoRoutes, { repositories, services, kapsoAdapter });
    app.log.info("Kapso WhatsApp adapter initialized");
  } else {
    app.log.warn("Kapso not configured (missing KAPSO_API_KEY or KAPSO_PHONE_NUMBER_ID)");
  }

  // Iniciar servidor
  await app.listen({ host: HOST, port: PORT });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  app.log.info(
    {
      baseUrl,
      health: `${baseUrl}/health`,
      kapsoWebhook: `${baseUrl}/kapso/webhook`,
    },
    "API ready",
  );
}

// Ejecutar servidor. Si falla, mostrar error y salir.
main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
