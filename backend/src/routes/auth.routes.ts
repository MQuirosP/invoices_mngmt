import { Router } from "express";
import { loginRateLimiter } from "@/shared/middleware/features/rateLimiter";
import { authenticate, AuthRequest } from "@/modules/auth/auth.middleware";
import {
  // register,
  // login,
  // logoutUser,
  // listUsers,
} from "@/modules/auth/auth.controller";

import { AuthController } from "@/modules/auth/auth.controller";

const authRouter = Router();

authRouter.post("/register", AuthController.register);
authRouter.post("/login", loginRateLimiter, AuthController.login);
authRouter.post("/logout", authenticate, AuthController.logoutUser);
authRouter.get("/list", authenticate, AuthController.listUsers);

authRouter.get("/me", authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: "User authenticated successfully",
    user: req.user,
  });
});

export default authRouter;