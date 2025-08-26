import { Router } from "express";
import { loginRateLimiter } from "@/shared/middleware/features/rateLimiter";
import { authenticate, AuthRequest } from "@/modules/auth/auth.middleware";
import {
  register,
  login,
  logoutUser,
  listUsers,
} from "@/modules/auth/auth.controller";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", loginRateLimiter, login);
authRouter.post("/logout", authenticate, logoutUser);
authRouter.get("/list", authenticate, listUsers);

authRouter.get("/me", authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: "User authenticated successfully",
    user: req.user,
  });
});

export default authRouter;