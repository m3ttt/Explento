import { Router, Response } from "express";
import { User } from "../models/User.js";
import { AuthRequest } from "../routes/auth.js";
import { Place } from "../models/Place.js";

const router = Router();

export const heatmapMissions = async (req: AuthRequest, resp: Response) => {
    try {
        const result = await User.aggregate([
            // 1. Considera solo le missioni completate
            { $unwind: "$missionsProgresses" },
            { $match: { "missionsProgresses.completed": true } },
            
            // 2. Unwind dei posti visitati (saltiamo se l'array è vuoto)
            { $unwind: "$missionsProgresses.requiredPlacesVisited" },

            // 3. CONVERSIONE: Trasforma il placeId in ObjectId per sicurezza
            {
                $addFields: {
                    "tempPlaceId": { $toObjectId: "$missionsProgresses.requiredPlacesVisited.placeId" }
                }
            },

            // 4. Conteggio per placeId
            {
                $group: {
                    _id: "$tempPlaceId",
                    completedMissions: { $sum: 1 },
                },
            },

            // 5. Join con la collection Place
            {
                $lookup: {
                    from: "places", // Assicura che il nome su MongoDB sia esattamente "places"
                    localField: "_id",
                    foreignField: "_id",
                    as: "place",
                },
            },

            // 6. Estrae il primo (e unico) elemento del lookup
            { $unwind: "$place" },

            // 7. Proiezione finale
            {
                $project: {
                    _id: 0,
                    placeId: "$_id",
                    completedMissions: 1,
                    name: "$place.name",
                    location: "$place.location",
                },
            },

            // 8. Rimuove eventuali places senza location valida
            { $match: { "location.lat": { $exists: true }, "location.lon": { $exists: true } } },
        ]);

        resp.json(result);
    } catch (err) {
        console.error("Errore Aggregation:", err);
        resp.status(500).json({ error: "Errore durante la generazione della heatmap" });
    }
};

export default router;
