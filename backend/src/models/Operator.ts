import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

const OperatorSchema = new Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "operator" }, // utile per future espansioni
    name: String,
    surname: String,
});

// Tipo TypeScript del documento
export type OperatorType = InferSchemaType<typeof OperatorSchema>;
export type OperatorDocument = HydratedDocument<OperatorType>;

// Modello Mongoose
export const Operator = model("Operator", OperatorSchema);
