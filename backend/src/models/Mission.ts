import { Schema, model } from "mongoose";

const MissionSchema = new Schema({
    name: String,
    description: String,
    minLevel: Number,
    rewardExp: Number,
    categories: [String],
    places: [
        {
            placeId: {
                type: Schema.Types.ObjectId,
                ref: "Place",
            },
        },
    ],
    requiredCount: Number,
});

export default model("Mission", MissionSchema);
