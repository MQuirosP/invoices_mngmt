import { Request, Response } from 'express';
import { checkDbHealth } from './dbHealth.service';

export async function handleDbHealth(req: Request, res: Response) {
  const jobId = req.header('X-Job-ID') || 'unknown';

  try {
    const result = await checkDbHealth(jobId);
    res.json(result);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    console.error({
      action: 'DB_HEALTH_CONTROLLER_ERROR',
      jobId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ error: error.message, jobId });
  }
}
