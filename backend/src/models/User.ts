import { InferSchemaType, Schema, model } from "mongoose";

const UserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    password: { type: String, required: true },
    profileImage: String,
    preferences: {
        alsoPaid: { type: Boolean },
        categories: {
            type: [String],
            required: true,
            enum: [
                "montagna",
                "lago",
                "cultura",
                "scienza",
                "borgo",
                "città",
                "gusto",
                "indoor",
                "outdoor",
                "impegnativo",
                "rilassante",
                "per famiglie",
            ],
            _id: false,
        },
        _id: false,
    },
    expert: { type: Boolean, default: false },
    exp: { type: Number, default: 0 },
    // TODO: Inserire data iscrizione

    visitedPlaces: [
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

    // storico posti suggeriti all'utente
    suggestedPlaces: [
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

    missionsProgresses: [
        {
            missionId: {
                type: Schema.Types.ObjectId,
                ref: "Mission",
                required: true,
            },
            requiredPlacesVisited: [
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

// Tipo TypeScript del documento
export type UserType = InferSchemaType<typeof UserSchema>;

// Modello Mongoose
export const User = model("User", UserSchema);
