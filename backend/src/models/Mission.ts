import { InferSchemaType, Schema, model } from "mongoose";

const MissionSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    minLevel: { type: Number, default: 0 },
    rewardExp: { type: Number, required: true },
    categories: { type: [String], required: true },
    requiredPlaces: [
        {
            placeId: {
                type: Schema.Types.ObjectId,
                ref: "Place",
            },
        },
    ],
    requiredCount: { type: Number, default: 1 },
});

// Tipo TypeScript del documento
export type MissionType = InferSchemaType<typeof MissionSchema>;

// Modello Mongoose
export const Mission =  model("Mission", MissionSchema);
