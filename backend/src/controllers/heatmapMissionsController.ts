import { Router, Response } from "express";
import { User } from "../models/User.js";
import { AuthRequest } from "../routes/auth.js";
import { Place } from "../models/Place.js";

const router = Router();

export const heatmapMissions = async (req: AuthRequest, resp: Response) => {
    try {
        const result = await User.aggregate([
            { $unwind: "$missionsProgresses" },
            { $match: { "missionsProgresses.completed": true } },
            { $unwind: "$missionsProgresses.requiredPlacesVisited" },

            // Conteggio delle missioni completate per ogni place
            {
                $group: {
                    _id: "$missionsProgresses.requiredPlacesVisited.placeId",
                    completedMissions: { $sum: 1 },
                },
            },

            // Join con la collection Place
            {
                $lookup: {
                    from: "places",
                    localField: "_id",
                    foreignField: "_id",
                    as: "place",
                },
            },

            // Se non c'è corrispondenza, preserva l'array vuoto
            { $unwind: { path: "$place", preserveNullAndEmptyArrays: true } },

            // Output finale per il frontend
            {
                $project: {
                    _id: 0,
                    placeId: "$_id",
                    completedMissions: 1,
                    name: "$place.name",
                    location: "$place.location",
                },
            },

            // Rimuove eventuali places senza location
            { $match: { location: { $ne: null } } },
        ]);

        resp.json(result);
    } catch (err) {
        console.error(err);
        resp.status(500).json({
            error: "Errore durante la generazione della heatmap",
        });
    }
};

export default router;
