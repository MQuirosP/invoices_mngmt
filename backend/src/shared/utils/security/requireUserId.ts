import { AppError } from "@/shared/utils/appError.utils";
import { AuthRequest } from "@/modules/auth/auth.types";
import { logger } from "../logging/logger";

export const requireUserId = (req: AuthRequest): string => {
  const userId = req.user?.id;
  const timestamp = new Date().toISOString();

  if (!userId) {
    logger.warn({
      layer: "shared",
      module: "security",
      action: "AUTH_USER_ID_MISSING",
      path: req.path,
      method: req.method,
      reason: "USER_ID_UNDEFINED",
      timestamp,
    });

    throw new AppError("User not authenticated", 401, true, undefined, {
      layer: "shared",
      module: "security",
      reason: "USER_ID_UNDEFINED",
      path: req.path,
      method: req.method,
      timestamp,
    });
  }

  return userId;
};