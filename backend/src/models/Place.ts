import { InferSchemaType, Schema, model } from "mongoose";

const PlaceSchema = new Schema({
    name: {type: String, required: true},
    normalizedName: {type: String, index: true},
    description: String,
    categories: {type: [String], required: true},
    location: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        _id: false, // evita che Mongoose crei un _id per location
    },
    images: [String], // opzionale
    isFree: { type: Boolean, required: true },
});

// Tipo TypeScript del documento
export type PlaceType = InferSchemaType<typeof PlaceSchema>;

// Modello Mongoose
export const Place = model("Place", PlaceSchema);
