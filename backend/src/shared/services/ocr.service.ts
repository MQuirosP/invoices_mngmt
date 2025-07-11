import vision from "@google-cloud/vision";
import axios from "axios";

const client = new vision.ImageAnnotatorClient();

export class OCRService {
  static async extractTextFromImage(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    });
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      throw new Error("No se pudo extraer texto de la imagen");
    }
    return detections[0].description || "";
  }

  static extractMetadataFromText(text: string) {
    const title = text
      .match(/(?:Factura|Título|Concepto):?\s*(.+)/i)?.[1]
      .trim();
    const issueDate = text.match(
      /(?:Fecha\s+de\s+emisión|Emitido):?\s*(\d{2,4}[-/]\d{1,2}[-/]\d{1,2})/i
    )?.[1];
    const expiration = text.match(
      /(?:Vencimiento|Fecha\s+de\s+vencimiento):?\s*(\d{2,4}[-/]\d{1,2}[-/]\d{1,2})/i
    )?.[1];
    const provider = text.match(/(?:Proveedor|Emisor):?\s*(.+)/i)?.[1]?.trim();
    const duration = text.match(
      /(?:Garantía|Duración):?\s*(\d+)\s*(mes(?:es)?|año(?:s)?)/i
    );

    return {
        title: title || "Factura sin título",
        issueDate: issueDate || null,
        expiration: expiration || null,
        provider: provider || "Desconocido",
        warrantyDuration: duration ? `${duration[1]} ${duration[2]}`: null,
    };
  }
}
