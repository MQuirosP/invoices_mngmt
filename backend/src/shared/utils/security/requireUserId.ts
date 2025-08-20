import { AppError } from "@/shared/utils/AppError";
import { AuthRequest } from "@/modules/auth/auth.types";
import { logger } from "./logger";

export const requireUserId = (req: AuthRequest): string => {
  const userId = req.user?.id; 
  if (!userId) {
  logger.warn({
    action: "AUTH_USER_ID_MISSING",
    context: "AUTH_MIDDLEWARE",
    path: req.path,
    method: req.method,
  });
  throw new AppError("User not authenticated", 401);
}
  return userId;
};