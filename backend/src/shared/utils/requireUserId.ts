import { AuthRequest } from "@/modules/auth/auth.middleware";
import { AppError } from "@/shared/utils/AppError.utils";

export const requireUserId = (req: AuthRequest): string => {
  const userId = req.user?.id; // Assuming req.user is populated by authentication middleware
  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }
  return userId;
};