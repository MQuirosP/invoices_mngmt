import pino from "pino";

function formatError(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "issues" in err &&
    Array.isArray((err as any).issues)
  ) {
    return (err as any).issues
      .map((issue: any) => `${issue.path?.join(".") || "unknown"}: ${issue.message}`)
      .join(" | ");
  }

  if (err instanceof Error) {
    return err.message;
  }

  return JSON.stringify(err);
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined, // no pid, no hostname
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
    bindings() {
      return {};
    },
    log(obj) {
      return obj;
    },
  },
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      singleLine: true,
      messageFormat: "{msg}",
    },
  },
});

// To delete
export const logError = (err: unknown, context: string) => {
  logger.error({ error: formatError(err) }, context);
};