import { Router } from "express";
import { authenticate, AuthRequest } from "./auth.middleware";
import { loginRateLimiter } from "@/shared/middleware/rateLimiter";
import { AuthController } from "./auth.controller";

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