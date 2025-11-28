import { InferSchemaType, Schema, model } from "mongoose";

const UserSchema = new Schema({
    username: { type: String, unique: true },
    email: String,
    name: String,
    surname: String,
    password: String,
    profileImage: String,
    preferences: [String],
    expert: { type: Boolean, default: false },
    exp: { type: Number, default: 0 },

    places: [
        {
            placeId: {
                type: Schema.Types.ObjectId,
                ref: "Place",
                required: true,
            },
            visited: {
                type: Boolean,
                default: false,
            },
            date: {
                type: Date,
            },
        },
    ],

    missionsProgress: [
        {
            missionId: {
                type: Schema.Types.ObjectId,
                ref: "Mission",
                required: true,
            },
            visitedPlaces: [
                {
                    placeId: {
                        type: Schema.Types.ObjectId,
                        ref: "Place",
                    },
                },
            ],
            progress: { type: Number, default: 0 },
            completed: { type: Boolean, default: false },
        },
    ],
});

export type UserType = InferSchemaType<typeof UserSchema>;
export const User = model("User", UserSchema);
