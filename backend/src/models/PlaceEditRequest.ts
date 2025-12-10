import { Schema, model, InferSchemaType } from "mongoose";

const PlaceEditRequestSchema = new Schema(
    {
        placeId: {
            type: Schema.Types.ObjectId,
            ref: "Place",
            required: function() {
                return !this.isNewPlace; // richiesto solo se non è un nuovo luogo
            }
        },
        
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Contiene solo i campi che l'utente ha modificato rispetto all'originale
        proposedChanges: {
            type: Object,
            required: true,
        },

        isNewPlace: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        operatorId: {
            type: Schema.Types.ObjectId,
            ref: "Operator",
        },

        operatorComment: String,
    },
    { timestamps: true },
);

// Tipo TypeScript del documento
export type PlaceEditRequestType = InferSchemaType<
    typeof PlaceEditRequestSchema
>;

// Modello Mongoose
export const PlaceEditRequest = model(
    "PlaceEditRequest",
    PlaceEditRequestSchema,
);
