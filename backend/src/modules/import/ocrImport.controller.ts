import { Response, NextFunction } from "express";
import { ImportService } from "./ocrImport.service";
import { AuthRequest } from "../auth/auth.middleware";

const service = new ImportService();

export const importFromUrl = async (req: AuthRequest, res: Response) => {
  const { url } = req.body;
  const userId = req.user?.id;

  if (!url || !userId) return res.status(400).json({ message: "Faltan datos" });

  try {
    const invoice = await service.importFromCloudinaryUrl(url, userId);
    return res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al importar factura" });
  }
};

export const importFromLocal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const file = req.file;

  if (!file || !userId) {
    res.status(400).json({ message: "Missing file or user ID" });
    return;
  }

  try {
    const invoice = await service.importFromLocalFile(file.buffer, userId, file.originalname, file.mimetype);
    res.status(201).json(invoice);
  } catch (error) {
    next(error); // importante para el manejo de errores
  }
};

