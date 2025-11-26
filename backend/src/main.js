import dotenv from "dotenv";
import { connectDatabase } from "./db.js";
import express from "express";

dotenv.config();
await connectDatabase();

const router = express.Router();
const PORT = process.env.PORT || 3000;

module.exports = router;
