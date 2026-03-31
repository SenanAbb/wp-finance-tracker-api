function getOpenAIConfig(env) {
  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    enabled: String(env.AI_ENABLED || "true").toLowerCase() !== "false",
  };
}

async function openaiResponsesJson({ apiKey, model, schemaName, schema, messages, requestLog }) {
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY is missing");
    err.code = "OPENAI_API_KEY_MISSING";
    throw err;
  }

  const startedAt = Date.now();

  const body = {
    model,
    messages,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        schema,
        strict: true,
      },
    },
  };

  requestLog?.debug({ model, schemaName }, "OpenAI request");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const latencyMs = Date.now() - startedAt;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.error?.message || `OpenAI error (status ${res.status})`;
    const err = new Error(message);
    err.code = json?.error?.code || "OPENAI_ERROR";
    err.status = res.status;
    err.details = json;
    requestLog?.error({ err, latencyMs }, "OpenAI request failed");
    throw err;
  }

  const usage = json?.usage || null;
  requestLog?.info(
    {
      latencyMs,
      usage,
    },
    "OpenAI response",
  );

  const text = json?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    const err = new Error("OpenAI returned empty output");
    err.code = "OPENAI_EMPTY_OUTPUT";
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const err = new Error("OpenAI returned non-JSON output");
    err.code = "OPENAI_NON_JSON";
    err.raw = text;
    throw err;
  }

  return { parsed, usage, latencyMs };
}

module.exports = {
  getOpenAIConfig,
  openaiResponsesJson,
};
