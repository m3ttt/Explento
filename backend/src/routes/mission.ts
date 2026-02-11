import express from "express";
import { authenticate } from "./auth.js";
import { getAllMissions, getAvailableMissions } from "../controllers/missionController.js";

const router = express.Router();

router.use(authenticate);

// GET /missions, elenco di tutte le missioni
router.get("", getAllMissions);

// GET /missions/available, missioni ancora disponibili per l'utente
router.get("/available", getAvailableMissions);

export default router;
