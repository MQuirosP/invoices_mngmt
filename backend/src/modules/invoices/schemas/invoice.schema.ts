import { z } from "zod";

export const createInvoiceSchemna = z.object({
  title: z.string().min(1, "Title is required"),
  issueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid issue date",
  }),
  expiration: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid expiration date",
  }),
  provider: z.string().min(1, "Provider is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileType: z.enum(["PDF", "XML", "JPG", "PNG"], {
    message: "Invalid file type",
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchemna>;
