// src/modules/invoice/invoiceItem.schema.ts
import { z } from "zod";

export const createInvoiceItemSchema = z.object({
  description: z.string().min(1),
  price: z.number().nonnegative(),

  warrantyDuration: z.number().int().positive().optional(),
  warrantyValidUntil: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  warrantyNotes: z.string().optional(),
});

export type CreateInvoiceItemInput = z.infer<typeof createInvoiceItemSchema>;