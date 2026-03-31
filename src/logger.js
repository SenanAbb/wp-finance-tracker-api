function parseBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const v = String(value).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y";
}

function getLoggerOptions(env) {
  const nodeEnv = String(env.NODE_ENV || "development").toLowerCase();
  const isProd = nodeEnv === "production";

  const level = env.LOG_LEVEL || (isProd ? "info" : "debug");
  const pretty = parseBool(env.LOG_PRETTY, !isProd);

  const base = {
    service: "apps-api",
    env: nodeEnv,
  };

  if (!pretty) {
    return {
      level,
      base,
    };
  }

  return {
    level,
    base,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: true,
      },
    },
  };
}

module.exports = {
  getLoggerOptions,
};
