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
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      singleLine: true,
      messageFormat: "{msg}",
    },
  },
});

export const logError = (err: unknown, context: string) => {
  logger.error({ error: formatError(err) }, context);
};