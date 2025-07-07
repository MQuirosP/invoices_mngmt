import { Router } from "express";
import { register, loginUser } from "../controller/auth.controller";

const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", register);
// POST /api/auth/login
authRouter.post("/login", loginUser);

export default authRouter;