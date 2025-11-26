import { Schema, model } from "mongoose";

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

export default model("Place", PlaceSchema);
