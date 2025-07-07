import { Request, Response, NextFunction } from "express";

// Registro de usuario
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lógica para registrar un usuario
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

// Inicio de sesión
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lógica para iniciar sesión
    res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    next(error);
  }
}