import z from "zod";

export const MissionSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  minLevel: z.number().default(0),
  rewardExp: z.number(),
  categories: z.array(z.string()).optional(),
  requiredPlaces: z
    .array(
      z.object({
        placeId: z.string(),
      }),
    )
    .optional(),
  requiredCount: z.number().optional(),
});

export type Mission = z.infer<typeof MissionSchema>;
