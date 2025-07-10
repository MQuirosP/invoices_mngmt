import { z } from "zod";

export const createWarrantySchema = z.object({
  invoiceId: z.string().uuid(),
  duration: z.number().int().positive(),
  notes: z.string().optional(),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

export const updateWarrantySchema = z.object({
  duration: z.number().int().positive(),
  notes: z.string().optional(),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

export type CreateWarrantyInput = z.infer<typeof createWarrantySchema>;
export type UpdateWarrantyInput = z.infer<typeof updateWarrantySchema>;
