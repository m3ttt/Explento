import z from "zod";
import { CategoriesEnum } from "./place";

export const MissionProgressSchema = z.object({
  missionId: z.string(),
  requiredPlacesVisited: z
    .array(
      z.object({
        placeId: z.string(),
      }),
    )
    .optional(),
  progress: z.number(),
  completed: z.boolean(),
});

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
  discoveredPlaces: z
    .array(
      z.object({
        placeId: z.string(),
        date: z.string().optional(),
      }),
    )
    .optional(),
  missionsProgresses: z.array(MissionProgressSchema).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type MissionProgress = z.infer<typeof MissionProgressSchema>;
