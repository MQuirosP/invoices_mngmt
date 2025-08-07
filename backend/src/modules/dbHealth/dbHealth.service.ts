import { prisma } from "@/config/prisma";

export async function checkDbHealth(jobId: string) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    console.info({
      action: "DB_HEALTH_OK",
      jobId,
      timestamp: new Date().toISOString(),
    });

    return { status: "ok", jobId };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    console.error({
      action: "DB_HEALTH_ERROR",
      jobId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw new Error("DB unreachable");
  }
}
