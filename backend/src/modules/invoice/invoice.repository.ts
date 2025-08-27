import { prisma } from "@/config/prisma";
import { Attachment, Invoice, InvoiceItem, Prisma, User } from "@prisma/client";

export type FullInvoice = Invoice & {
  items: InvoiceItem[];
  attachments: Attachment[];
  user: Pick<User, "id" | "email" | "fullname" | "role">;
};


export const InvoiceRepository = {
  findById: async (id: string): Promise<FullInvoice | null> => {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      attachments: true,
      user: {
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
        },
      },
    },
  });
},

  findByUserId: async (userId: string): Promise<Invoice[]> => {
    return prisma.invoice.findMany({
      where: { userId },
      include: {
        items: true,
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  create: async (data: {
    userId: string;
    title: string;
    issueDate: Date;
    expiration: Date;
    provider: string;
    extracted?: boolean;
  }): Promise<Invoice> => {
    return prisma.invoice.create({
      data,
      include: {
        items: true,
        attachments: true,
      },
    });
  },

  update: async (
    id: string,
    data: Partial<{
      title: string;
      issueDate: Date;
      expiration: Date;
      provider: string;
      extracted: boolean;
    }>
  ): Promise<Invoice> => {
    return prisma.invoice.update({
      where: { id },
      data,
      include: {
        items: true,
        attachments: true,
      },
    });
  },

  delete: async (id: string): Promise<Invoice> => {
    return prisma.invoice.delete({
      where: { id },
      include: {
        items: true,
        attachments: true,
      },
    });
  },

  addInvoiceItem: async (data: {
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    warrantyDuration?: number;
    warrantyValidUntil?: Date;
    warrantyNotes?: string;
  }): Promise<InvoiceItem> => {
    return prisma.invoiceItem.create({
      data,
    });
  },

  updateInvoiceItem: async (
    id: string,
    data: Partial<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      warrantyDuration?: number;
      warrantyValidUntil?: Date;
      warrantyNotes?: string;
    }>
  ): Promise<InvoiceItem> => {
    return prisma.invoiceItem.update({
      where: { id },
      data,
    });
  },

  deleteInvoiceItem: async (id: string): Promise<InvoiceItem> => {
    return prisma.invoiceItem.delete({
      where: { id },
    });
  },

  getInvoiceItems: async (invoiceId: string): Promise<InvoiceItem[]> => {
    return prisma.invoiceItem.findMany({
      where: { invoiceId },
      orderBy: { createdAt: "asc" },
    });
  },

  getInvoiceStats: async (userId: string) => {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        items: true,
      },
    });

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, invoice) => {
      const invoiceTotal = invoice.items.reduce(
        (itemSum, item) => itemSum + item.total,
        0
      );
      return sum + invoiceTotal;
    }, 0);

    const extractedCount = invoices.filter((inv) => inv.extracted).length;
    const pendingExtraction = totalInvoices - extractedCount;

    return {
      totalInvoices,
      totalAmount,
      extractedCount,
      pendingExtraction,
    };
  },

  // findAll: async (filters?: {
  //   userId?: string;
  //   provider?: string;
  //   extracted?: boolean;
  // }): Promise<Invoice[]> => {
  //   const where: Prisma.InvoiceWhereInput = {};
    
  //   if (filters) {
  //     if (filters.userId) where.userId = filters.userId;
  //     if (filters.provider?.trim()) {
  //       where.provider = { contains: filters.provider, mode: "insensitive" };
  //     }
  //     if (Object.prototype.hasOwnProperty.call(filters, "extracted")) {
  //       where.extracted = filters.extracted;
  //     }
  //   }

  //   const include = {
  //     items: true,
  //     attachments: true,
  //     ...(filters?.userId && {
  //       user: {
  //         select: {
  //           id: true,
  //           email: true,
  //           fullname: true,
  //           role: true,
  //         },
  //       },
  //     }),
  //   };

  //   return prisma.invoice.findMany({
  //     where,
  //     include,
  //     orderBy: { createdAt: "desc" },
  //   });
  // },
};
