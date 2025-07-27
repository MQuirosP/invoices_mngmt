import Tesseract from "tesseract.js";
import sharp from "sharp";
import {
  ExtractedInvoiceMetadata,
  extractMetadataFromText,
} from "@/shared/utils/extractMetadata.utils";

export class TesseractOCRService {
  async extractMetadataFromBuffer(
    buffer: Buffer
  ): Promise<ExtractedInvoiceMetadata> {
    console.log(`Using OCR provider: Tesseract.js`);
    // Preprocesar la imagen para mejorar OCR
    const preprocessedBuffer = await sharp(buffer)
      .resize({ width: 1500 })      // Redimensionar para mejor lectura
      .grayscale()                  // Pasar a escala de grises
      .linear(1.2, -10)             // Ajustar contraste y brillo
      .threshold(150)               // Binarización para limpiar la imagen
    //   .blur(1)                     // Suavizado para reducir ruido
      .toBuffer();

    // Crear worker con idioma español
    const worker = await Tesseract.createWorker(["spa"]);

    try {
      // Cargar el worker (incluye idioma)
      // await worker.load();

      // Inicializar idioma
      await worker.reinitialize("spa");

      // Ajustar modo de segmentación de página para mejor precisión
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // prueba AUTO o SINGLE_LINE también
      });

      // Ejecutar reconocimiento OCR sobre imagen preprocesada
      const { data: { text } } = await worker.recognize(preprocessedBuffer);

      if (!text) {
        throw new Error("No se extrajo texto con Tesseract.js");
      }
      
      // Extraer metadatos con tu función custom
      return extractMetadataFromText(text);
    } finally {
      // Terminar worker para liberar recursos
      await worker.terminate();
    }
  }
}
