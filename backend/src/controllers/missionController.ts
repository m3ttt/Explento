import { Request, Response } from "express";
import Mission from "../models/Mission.js";
import { User, UserType } from "../models/User.js";
import { AuthRequest } from "../routes/auth.js";

// Restituisce tutte le missioni sul database
export const getAllMissions = async (req: AuthRequest, resp: Response) => {
    try {
        const missions = await Mission.find().lean();
        return resp.status(200).json(missions);
    } catch (err) {
        console.error(err);
        return resp.status(500).json({ error: "Errore server" });
    }
};

// Restituisce le missioni disponibili per l'utente (missioni che non ha ancora accettato/attivato)
export const getAvailableMissions = async (req: AuthRequest, resp: Response) => {
    try {
        const user = req.user as UserType;
        if (!user) return resp.status(401).json({ error: "Non autenticato" });

        // Prende tutti gli _id delle missioni già attive per l'utente
        const activeMissionIds = user.missionsProgresses.map(mp => mp.missionId.toString());

        // Trova tutte le missioni NON presenti nell'array
        const missions = await Mission.find({
            _id: { $nin: activeMissionIds }
        }).lean();

        return resp.status(200).json(missions);
    } catch (err) {
        console.error(err);
        return resp.status(500).json({ error: "Errore server" });
    }
};
