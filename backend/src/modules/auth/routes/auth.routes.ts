import { Router } from "express";
import { register, login } from "../controller/auth.controller";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", register);
// POST /api/auth/login
authRouter.post("/login", login);

// Protecting the routes with authentication middleware
authRouter.get("/me", authenticate, (req: AuthRequest, res) => {
    res.json({
        success: true,
        message: "User authenticated successfully",
        user: req.user,
    });
})

export default authRouter;