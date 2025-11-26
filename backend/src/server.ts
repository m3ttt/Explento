import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./db.js";

dotenv.config();

// Wrapper async per la connessione DB e avvio server
async function startServer() {
    try {
        await connectDatabase(); // connessione a MongoDB
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server avviato sulla porta ${PORT}`);
        });
    } catch (err) {
        console.error("Errore avvio server:", err);
    }
}

startServer();
