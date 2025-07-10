import vision from "@google-cloud/vision";
// import { v2 as cloudinary } from "cloudinary";
import { extractMetadataFromText } from "@/shared/utils/extractMetadata";
import { prisma } from "@/config/prisma";
import axios from "axios";

export class ImportService {
  private visionClient = new vision.ImageAnnotatorClient();

  async importFromCloudinaryUrl(url: string, userId: string) {
    // OCR del archivo en Cloudinary
    // Descargar el archivo como buffer
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // OCR desde buffer
    const [result] = await this.visionClient.textDetection({
      image: { content: Buffer.from(response.data) },
    });
    const ocrText = result.fullTextAnnotation?.text;

    console.log("Texto OCR extraído:", ocrText?.substring(0, 500));

    if (!ocrText) throw new Error("No se pudo extraer texto del archivo");

    const metadata = extractMetadataFromText(ocrText);
    const extParts = url.split(".");
    const ext =
      extParts.length > 1 ? extParts.pop()!.split("?")[0].toLowerCase() : "";

    const newInvoice = await prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration ?? new Date(), // Provide a default or extract from metadata
        provider: metadata.provider ?? "Desconocido", // Provide a default or extract from metadata
        extracted: true,
        attachments: {
          create: [
            {
              url,
              mimeType: `${ext.toUpperCase()}`, // mejorar con tipo real
              fileName: `${metadata.title}.${ext}`,
            },
          ],
        },
        warranty: metadata.duration
          ? {
              create: {
                duration: metadata.duration,
                validUntil: new Date(
                  metadata.issueDate.getTime() + metadata.duration * 86400000
                ),
              },
            }
          : undefined,
      },
      include: { attachments: true, warranty: true },
    });

    return newInvoice;
  }

  async updateInvoiceFromCloudinaryUrl(url: string, invoiceId: string) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const [result] = await this.visionClient.textDetection({
      image: { content: Buffer.from(response.data) },
    });

    

    const ocrText = result.fullTextAnnotation?.text;
    if (!ocrText) throw new Error("No se pudo extraer texto del archivo");

    const metadata = extractMetadataFromText(ocrText);
    // const extParts = url.split(".");
    // const ext =
    //   extParts.length > 1 ? extParts.pop()!.split("?")[0].toLowerCase() : "";

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration ?? new Date(),
        provider: metadata.provider ?? "Desconocido",
        extracted: true,
        warranty: metadata.duration
          ? {
              upsert: {
                update: {
                  duration: metadata.duration,
                  validUntil: new Date(
                    metadata.issueDate.getTime() +
                      metadata.duration * 86400000
                  ),
                },
                create: {
                  duration: metadata.duration,
                  validUntil: new Date(
                    metadata.issueDate.getTime() +
                      metadata.duration * 86400000
                  ),
                },
              },
            }
          : undefined,
      },
      include: {
        attachments: true,
        warranty: true,
      },
    });

    return updatedInvoice;
  }
}

