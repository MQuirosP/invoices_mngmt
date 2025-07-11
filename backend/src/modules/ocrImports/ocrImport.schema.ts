import { z } from "zod";

export const importSchema = z.object({
  userId: z.string().uuid(),
  source: z.string().optional(),
  file: z.any(), // multer file object
});
