import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schemas";
import { registerUser, loginUser } from "./auth.service";

// Registro de usuario
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lógica para registrar un usuario
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

// Inicio de sesión
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lógica para iniciar sesión
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
