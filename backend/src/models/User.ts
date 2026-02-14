import { InferSchemaType, Schema, model, Document, Types } from "mongoose";

const DiscoveredPlaceSchema = new Schema(
    {
        placeId: {
            type: Schema.Types.ObjectId,
            ref: "Place",
            required: true,
        },
        date: { type: Date },
    },
    { _id: false },
);

const SuggestedPlaceSchema = new Schema(
    {
        placeId: {
            type: Schema.Types.ObjectId,
            ref: "Place",
            required: true,
        },
        visited: { type: Boolean, default: false },
        date: { type: Date },
    },
    { _id: false },
);

const MissionProgressSchema = new Schema(
    {
        missionId: {
            type: Schema.Types.ObjectId,
            ref: "Mission",
            required: true,
        },
        requiredPlacesVisited: [
            {
                placeId: { type: Schema.Types.ObjectId, ref: "Place" },
                _id: false,
            },
        ],
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
    },
    { _id: false },
);

// 2. Schema Principale
const UserSchema = new Schema(
    {
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
            },
        },
        expert: { type: Boolean, default: false },
        exp: { type: Number, default: 0 },
        discoveredPlaces: [DiscoveredPlaceSchema],
        suggestedPlaces: [SuggestedPlaceSchema],
        missionsProgresses: [MissionProgressSchema],
    },
    { timestamps: true },
);

interface IUserMethods {
    addEXP(amount: number): Promise<void>;
}

export type UserType = Document<
    unknown,
    {},
    InferSchemaType<typeof UserSchema>
> &
    InferSchemaType<typeof UserSchema> &
    IUserMethods & { _id: Types.ObjectId };

export type UserDocument = UserType;

UserSchema.methods.addEXP = async function (amount: number) {
    this.exp += amount;
    if (this.exp >= 50 && !this.expert) {
        this.expert = true;
    }
    // await this.save();
};

export const User = model<UserDocument>("User", UserSchema);
