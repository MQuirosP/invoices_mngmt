import { Request } from 'express';
import { Role } from '@/shared/constants/roles';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}
