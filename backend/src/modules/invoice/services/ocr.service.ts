import { prisma } from "@/config/prisma";
import {  } from "@/shared/utils/AppError";
import { AppError, ImportService, AttachmentService } from "@/shared";

export class OCRService {
  constructor(private importService: ImportService) {}

  async createInvoiceFromBuffer(
    buffer: Buffer,
    userId: string,
    originalName: string,
    mimeType: string
  ) {
    // Extraer metadata usando OCR
    const metadata = await this.importService.extractFromBuffer(buffer);

    // 1️⃣ Crear la factura sin items
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
      },
      include: { attachments: true, items: true },
    });

    // 2️⃣ Crear los items si existen
    if (metadata.items?.length) {
      await prisma.invoiceItem.createMany({
        data: metadata.items.map((item) => ({ ...item, invoiceId: invoice.id })),
      });
    }

    // 3️⃣ Subir el attachment
    await AttachmentService.uploadValidated(
      { buffer, mimetype: mimeType, originalname: originalName },
      invoice.id,
      userId
    );

    // 4️⃣ Devolver la factura con relaciones
    return prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { attachments: true, items: true },
    });
  }

  async updateInvoiceFromUrl(invoiceId: string, userId: string, url: string) {
    // Buscar la factura con attachments e items
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { attachments: true, items: true },
    });
    if (!invoice) throw new AppError("Invoice not found", 404);

    // Extraer metadata desde la URL
    const metadata = await this.importService.extractFromUrl(url);

    // Crear attachment si no existe
    const existingAttachment = invoice.attachments.find((a) => a.url === url);
    if (!existingAttachment) {
      await prisma.attachment.create({
        data: {
          invoiceId,
          url,
          fileName: "file_from_url",
          mimeType: "application/octet-stream",
        },
      });
    }

    // 1️⃣ Actualizar solo los campos de la factura
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
      },
    });

    // 2️⃣ Reemplazar items existentes
    await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
    if (metadata.items?.length) {
      await prisma.invoiceItem.createMany({
        data: metadata.items.map((item) => ({ ...item, invoiceId })),
      });
    }

    // 3️⃣ Devolver la factura actualizada con relaciones
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { attachments: true, items: true },
    });
  }
}
