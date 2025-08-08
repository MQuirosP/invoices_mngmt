import { Router } from "express";
import { register, login, listUsers } from "./auth.controller";
import { authenticate, AuthRequest } from "./auth.middleware";
import { loginRateLimiter } from "@/shared/middleware/rateLimiter";

const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", register);
// POST /api/auth/login
authRouter.post("/login", loginRateLimiter, login);
// GET /api/users
authRouter.get("/list", authenticate, listUsers);

// Protecting the routes with authentication middleware
authRouter.get("/me", authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: "User authenticated successfully",
    user: req.user,
  });
});

export default authRouter;
