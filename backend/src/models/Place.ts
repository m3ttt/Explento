import { InferSchemaType, Schema, model } from "mongoose";

const PlaceSchema = new Schema({
    name: String,
    description: String,
    categories: [String],
    location: {
        lat: Number,
        lon: Number,
    },
    images: [String],
    isFree: Boolean,
});

export type PlaceType = InferSchemaType<typeof PlaceSchema>;
export const Place = model("Place", PlaceSchema);
