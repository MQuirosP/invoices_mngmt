import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    name: z.string().min(1, "Name is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;