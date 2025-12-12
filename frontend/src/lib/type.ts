import * as z from "zod";

// ObjectID MongoDB
export const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const placeHistorySchema = z.object({
    placeId: objectId,
    visited: z.boolean().default(false),
    date: z.date().optional(),
});

const requiredPlaceSchema = z.object({
    placeId: objectId.optional(),
});

// missionsProgresses schema
const missionProgressSchema = z.object({
    missionId: objectId,
    requiredPlacesVisited: z.array(requiredPlaceSchema).default([]),
    progress: z.number().default(0),
    completed: z.boolean().default(false),
});

export const UserSchemaZod = z.object({
    username: z.string(),
    email: z.string(),
    name: z.string(),
    surname: z.string(),
    password: z.string(),
    profileImage: z.string().optional(),
    preferences: z.array(z.string()).default([]),
    expert: z.boolean().default(false),
    exp: z.number().default(0),

    visitedPlaces: z.array(placeHistorySchema).default([]),

    suggestedPlaces: z.array(placeHistorySchema).default([]),

    missionsProgresses: z.array(missionProgressSchema).default([]),
});

// Typescript type
export type User = z.infer<typeof UserSchemaZod>;
