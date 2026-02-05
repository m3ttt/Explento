import { z } from "zod";

/**
 * Helper per ObjectId serializzato (string)
 */
const ObjectIdSchema = z.string().min(1);

/**
 * Schema per la location
 */
const LocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

/**
 * Schema per i cambiamenti proposti
 * Contiene solo i campi modificati dall’utente
 */
export const ProposedChangesSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  location: LocationSchema.optional(),
  isFree: z.boolean().optional(),
}).passthrough(); 
// passthrough per tollerare eventuali campi futuri

/**
 * Schema principale PlaceEditRequest
 */
export const PlaceEditRequestSchema = z.object({
  _id: ObjectIdSchema,

  placeId: ObjectIdSchema.optional(),

  userId: ObjectIdSchema,

  proposedChanges: ProposedChangesSchema,

  isNewPlace: z.boolean(),

  status: z.enum(["pending", "approved", "rejected"]),

  operatorId: ObjectIdSchema.optional(),

  operatorComment: z.string().nullable().optional(),

  createdAt: z.string(), // ISO date
  updatedAt: z.string(), // ISO date
});

/**
 * Tipo TypeScript inferito dallo schema Zod
 */
export type PlaceEditRequest = z.infer<typeof PlaceEditRequestSchema>;
