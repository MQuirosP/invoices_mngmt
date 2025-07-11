import { Response } from "express";
import { ImportService } from "./ocrImport.service";
import { AuthRequest } from "../auth/auth.middleware";

const service = new ImportService();

export const importFromUrl = async (req: AuthRequest, res: Response) => {
  console.log(req.body);
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
