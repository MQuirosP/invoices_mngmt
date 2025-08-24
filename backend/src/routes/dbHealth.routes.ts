import { Router } from 'express';
import { handleDbHealth } from '@/modules/monitoring/dbHealth.controller';

const router = Router();

router.get('/health/db', handleDbHealth);

export default router;