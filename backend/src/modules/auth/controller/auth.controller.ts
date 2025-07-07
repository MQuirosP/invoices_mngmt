import { Request, Response, NextFunction } from "express";
import { registerSchema } from "../schemas/auth.schemas";
import { registerUser } from "../service/auth.service";

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
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lógica para iniciar sesión
    res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    next(error);
  }
};
