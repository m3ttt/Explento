import { InferSchemaType, Schema, model } from "mongoose";

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
    },
    email: String,
    name: String,
    surname: String,
    password: String,
    profileImage: String,
    preferences: [String],
    expert: {
        type: Boolean,
        default: false,
    },
    exp: {
        type: Number,
        default: 0,
    },
    visitedPlaces: [
        {
            placeId: {
                type: Schema.Types.ObjectId,
                ref: "Place",
            },
            date: Date,
        },
    ],
    missionsProgress: [
        {
            missionId: {
                type: Schema.Types.ObjectId,
                ref: "Mission",
            },
            visitedPlaces: [
                {
                    placeId: {
                        type: Schema.Types.ObjectId,
                        ref: "Place",
                    },
                },
            ],
            progress: Number,
            completed: Boolean,
        },
    ],
});

export type UserType = InferSchemaType<typeof UserSchema>;
export const User = model("User", UserSchema);
