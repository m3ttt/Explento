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

// Aggiunge una missione all'utente
export const activateMission = async (req: AuthRequest, resp: Response) => {
    try {
        const user = req.user as UserType;
        if (!user) return resp.status(401).json({ error: "Non autenticato" });

        const { missionId } = req.body;
        if (!missionId) return resp.status(400).json({ error: "Mancante missionId" });

        // Controlla che la missione esista
        const mission = await Mission.findById(missionId);
        if (!mission) return resp.status(404).json({ error: "Missione non trovata" });

        // Verifica se l'utente ha già la missione
        const alreadyAdded = user.missionsProgresses.some(
            mp => mp.missionId.toString() === missionId
        );
        if (alreadyAdded)
            return resp.status(400).json({ error: "Missione già attiva per l'utente" });

        // Aggiunge la missione all'utente
        user.missionsProgresses.push({
            missionId,
            requiredPlacesVisited: [],
            progress: 0,
            completed: false
        });

        await user.save();

        return resp.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return resp.status(500).json({ error: "Errore server" });
    }
};

// Rimuove una missione dall'utente
export const removeMission = async (req: AuthRequest, resp: Response) => {
    try {
        const user = req.user as UserType;
        if (!user) return resp.status(401).json({ error: "Non autenticato" });

        const { missionId } = req.params;
        if (!missionId) return resp.status(400).json({ error: "Mancante missionId" });

        // Verifica se l'utente ha la missione
        const index = user.missionsProgresses.findIndex(
            mp => mp.missionId.toString() === missionId
        );

        if (index === -1) {
            return resp.status(404).json({ error: "Missione non trovata nell'account utente" });
        }

        // Rimuove la missione
        user.missionsProgresses.splice(index, 1);

        await user.save();

        return resp.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return resp.status(500).json({ error: "Errore server" });
    }
};

// Crea una nuova missione
export const createMission = async (req: AuthRequest, resp: Response) => {
    try {
        const { name, description, minLevel, rewardExp, categories, requiredPlaces, requiredCount } = req.body;

        if (!name || !rewardExp || !categories) {
            return resp.status(400).json({ error: "Campi obbligatori mancanti" });
        }

        const mission = new Mission({
            name,
            description: description || "",
            minLevel: minLevel || 0,
            rewardExp,
            categories,
            requiredPlaces: requiredPlaces || [],
            requiredCount: requiredCount || 1
        });

        await mission.save();

        return resp.status(201).json({ success: true, mission });
    } catch (err) {
        console.error(err);
        return resp.status(500).json({ error: "Errore server" });
    }
};
