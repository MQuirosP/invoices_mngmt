import { Request } from "express";
import { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  user?: {
    id: string;
    email: string;
    role: Role;
    jti: string;
  };
}