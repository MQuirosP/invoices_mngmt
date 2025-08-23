import { Router } from "express";
import { loginRateLimiter } from "@/shared/middleware/features/rateLimiter";
import { authenticate, AuthRequest } from "@/modules/auth/auth.middleware";
import { AuthController } from "../modules/auth/auth.controller";

const authRouter = Router();
const controller = new AuthController();

authRouter.post("/register", controller.register.bind(controller));
authRouter.post("/login", loginRateLimiter, controller.login.bind(controller));
authRouter.post("/logout", authenticate, controller.logoutUser.bind(controller));
authRouter.get("/list", authenticate, controller.listUsers.bind(controller));

authRouter.get("/me", authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: "User authenticated successfully",
    user: req.user,
  });
});

export default authRouter;