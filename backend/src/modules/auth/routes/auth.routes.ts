import { Router } from "express";
import { registerUser, loginUser } from "../controller/auth.controller";

const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", registerUser);
// POST /api/auth/login
authRouter.post("/login", loginUser);

export default authRouter;