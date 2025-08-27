import { Router } from "express";
import { loginRateLimiter } from "@/shared/middleware/features/rateLimiter";
import { authenticate, AuthRequest } from "@/modules/auth/auth.middleware";

import { AuthController } from "@/modules/auth/auth.controller";
import type { AuthControllerType } from "@/modules/auth/auth.controller";

const authRouter = Router();
const authController: AuthControllerType = AuthController;

authRouter.post("/register", authController.register);
authRouter.post("/login", loginRateLimiter, authController.login);
authRouter.post("/logout", authenticate, authController.logoutUser);
authRouter.get("/list", authenticate, authController.listUsers);

authRouter.get("/me", authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: "User authenticated successfully",
    user: req.user,
  });
});

export default authRouter;