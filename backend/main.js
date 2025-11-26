import dotenv from "dotenv";
import { connectDatabase } from "./db.js";

dotenv.config();

await connectDatabase();
