import vision from "@google-cloud/vision";
import axios from "axios";
import { extractMetadataFromText } from "@/shared/utils/extractMetadata.utils";

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

  static async extractMetadataFromImage(url: string) {
    const text = await this.extractTextFromImage(url);
    return extractMetadataFromText(text);
  }
}
