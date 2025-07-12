import vision from "@google-cloud/vision";
import {
  ExtractedInvoiceMetadata,
  extractMetadataFromText,
} from "@/shared/utils/extractMetadata.utils";

const client = new vision.ImageAnnotatorClient();

export class OCRService {
  async extractMetadataFromBuffer(
    buffer: Buffer
  ): Promise<ExtractedInvoiceMetadata> {
    const [result] = await client.textDetection({ image: { content: buffer } });
    const text = result.fullTextAnnotation?.text;
    if (!text) throw new Error("No text extracted");
    return extractMetadataFromText(text); // from utils
  }
}
