import mongoose from "mongoose";

export async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
  } catch (e) {
    console.error("Errore nella connessione al Database MongoDB: " + e);
  }
}
