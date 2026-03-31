class AppError extends Error {
  constructor({ message, publicMessage, statusCode = 500, code = "APP_ERROR", cause }) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.publicMessage = publicMessage || "Ha ocurrido un error";
    if (cause) this.cause = cause;
  }

  static badRequest(publicMessage = "Petición inválida", code = "BAD_REQUEST") {
    return new AppError({
      message: publicMessage,
      publicMessage,
      statusCode: 400,
      code,
    });
  }

  static unauthorized(publicMessage = "No autorizado", code = "UNAUTHORIZED") {
    return new AppError({
      message: publicMessage,
      publicMessage,
      statusCode: 401,
      code,
    });
  }

  static internal(publicMessage = "Error interno", code = "INTERNAL_ERROR", cause) {
    return new AppError({
      message: publicMessage,
      publicMessage,
      statusCode: 500,
      code,
      cause,
    });
  }
}

function isAppError(err) {
  return Boolean(err && typeof err === "object" && err.name === "AppError" && typeof err.statusCode === "number");
}

module.exports = {
  AppError,
  isAppError,
};
