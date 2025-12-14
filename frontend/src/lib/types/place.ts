import z from "zod";

export const PlaceSchema = z.object({
    _id: z.string(),
    name: z.string(),
    normalizedName: z.string(),
    description: z.string().optional(),
    categories: z.array(z.string()),
    location: z.object({
        lat: z.number(),
        lon: z.number(),
    }),
    isFree: z.boolean(),
    images: z.array(z.string()).optional(),
    distance: z.number(),
});

export type Place = z.infer<typeof PlaceSchema>;
