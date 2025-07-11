import { z } from "zod";

export const createInvoiceSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    issueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid issue date",
    }),
    expiration: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid expiration date",
    }),
    provider: z.string().min(1, "Provider is required"),
  })
  .strict();

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
