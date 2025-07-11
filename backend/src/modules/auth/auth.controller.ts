import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { registerUser, loginUser } from "./auth.service";

// Create user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await registerUser(parsed);
    res.status(201).json({
      success: true,
      data: result,
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginUser(parsed);
    res.status(200).json({
      success: true,
      data: result,
      message: "User logged in successfully",
    });
  } catch (error) {
    next(error);
  }
};
