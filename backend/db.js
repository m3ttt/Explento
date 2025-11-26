import mongoose from "mongoose";

export async function connectDatabase() {
  mongoose.connection.on("connected", () => {
    console.log("✅ Mongoose connesso a MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ Errore Mongoose:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("🔌 Mongoose disconnesso");
  });

  try {
    await mongoose.connect(process.env.MONGO_DB_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    return mongoose.connection;
  } catch (error) {
    console.error("💥 Errore connessione iniziale:", error.message);
    process.exit(1);
  }
}
