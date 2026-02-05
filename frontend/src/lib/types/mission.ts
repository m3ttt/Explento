import z from "zod";

const MissionSchema = z.object({
    name: z.string(),
    description: z.string(),
    minLevel: z.number().default(0),
    rewardExp: z.number(),
    categories: z.array(z.string()),
    requiredPlaces: z.array(z.string()),
    requiredCount: z.number().default(1),
});

export type Mission = z.infer<typeof MissionSchema>;
