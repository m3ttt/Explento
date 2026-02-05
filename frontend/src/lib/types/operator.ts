import z from "zod";

export const OperatorSchema = z.object({
    email: z.string(),
    password: z.string(),
    role: z.string().default("operator"),
    name: z.string().optional(),
    surname: z.string().optional(),
});

export type Operator = z.infer<typeof OperatorSchema>;
