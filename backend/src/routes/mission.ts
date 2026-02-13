import express from "express";
import { authenticate } from "./auth";
import { getAllMissions, activateMission, getAvailableMissions, removeMission, createMission } from "../controllers/missionController";

const router = express.Router();

router.use(authenticate);

// GET /missions, elenco di tutte le missioni
router.get("", getAllMissions);

// GET /missions/available, missioni ancora disponibili per l'utente
router.get("/available", getAvailableMissions);

// POST /missions/activate, attiva una missione per l'utente
router.post("/activate", activateMission);

// DELETE /missions/:missionId, utente rinuncia a una missione
router.delete("/:missionId", removeMission);

// POST /missions, crea una nuova missione
router.post("", createMission);

export default router;
