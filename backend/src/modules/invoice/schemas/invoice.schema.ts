import { z } from "zod";

export const createInvoiceSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    issueDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid issue date",
      })
      .transform((date) => new Date(date)),
    expiration: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid expiration date",
      })
      .transform((d) => new Date(d)),
    provider: z.string().min(1, "Provider is required"),
  })
  .strict()
  .superRefine(({ issueDate, expiration }, ctx) => {
    if (expiration <= issueDate) {
      ctx.addIssue({
        path: ["expiration"],
        message: "Expiration must be after issue date",
        code: z.ZodIssueCode.custom,
      });
    }
  });

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;