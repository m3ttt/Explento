import z from "zod";
import { CategoriesEnum } from "./place";

export const UserSchema = z.object({
    _id: z.string(),
    username: z.string(),
    email: z.string(),
    name: z.string(),
    surname: z.string(),
    profileImage: z.string().optional(),
    preferences: z
        .object({
            alsoPaid: z.boolean().optional(),
            categories: z.array(CategoriesEnum),
        })
        .optional(),
    expert: z.boolean(),
    exp: z.number().default(0),
    visitedPlaces: z
        .array(
            z.object({
                placeId: z.string(),
                date: z.string().optional(),
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
