import z from "zod";

export const UserSchema = z.object({
    _id: z.string(),
    username: z.string(),
    email: z.string(),
    name: z.string(),
    surname: z.string(),
    profileImage: z.string().optional(),
    preferences: z.array(z.string()).optional().default([]),
    expert: z.boolean(),
    exp: z.number().default(0),
    visitedPlaces: z
        .array(
            z.object({
                placeId: z.string(),
                visited: z.boolean(),
                date: z.date().optional(),
            }),
        )
        .optional(),
    missionProgress: z
        .array(
            z.object({
                missionId: z.string(),
                requiredVisitedPlaces: z.array(
                    z.object({
                        placeId: z.string(),
                    }),
                ),
                progress: z.number(),
                completed: z.boolean(),
            }),
        )
        .optional(),
});

export type User = z.infer<typeof UserSchema>;
