import mongoose from "mongoose";

export async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL || "");
        console.log("Connesso a MongoDB");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
