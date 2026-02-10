import z from "zod";

export const CategoriesEnum = z.enum([
  "montagna",
  "lago",
  "cultura",
  "scienza",
  "borgo",
  "città",
  "gusto",
  "indoor",
  "outdoor",
  "impegnativo",
  "rilassante",
  "per famiglie",
]);

export const PlaceSchema = z.object({
  _id: z.string(),
  name: z.string(),
  normalizedName: z.string().optional(),
  description: z.string().optional(),
  categories: z.array(CategoriesEnum),
  location: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  isFree: z.boolean(),
  images: z.array(z.string()).optional(),
  distance: z.number(),
});

export type Place = z.infer<typeof PlaceSchema>;
