import { Router, Response } from "express";
import { User } from "../models/User.js";
import { AuthRequest } from "../routes/auth.js";
import { Mission } from "../models/Mission.js";
import { Place } from "../models/Place.js";

const router = Router();

export const heatmapMissions = async (req: AuthRequest, resp: Response) => {

    try {
        const result = await User.aggregate([
            { $unwind: "$missionsProgresses" },
            { $match: { "missionsProgresses.completed": true } },

            {
                $lookup: {
                    from: "missions",
                    localField: "missionsProgresses.missionId",
                    foreignField: "_id",
                    as: "mission",
                },
            },
            { $unwind: "$mission" },

            { $unwind: "$mission.requiredPlaces" },

            {
                $group: {
                    _id: "$mission.requiredPlaces.placeId",
                    completedMissions: { $sum: 1 },
                },
            },

            {
                $lookup: {
                    from: "places",
                    localField: "_id",
                    foreignField: "_id",
                    as: "place",
                },
            },
            { $unwind: "$place" },

            {
                $project: {
                    _id: 0,
                    placeId: "$place._id",
                    name: "$place.name",
                    location: "$place.location",
                    completedMissions: 1,
                },
            },
        ]);

        resp.json(result);
    } catch (err) {
        console.error(err);
        resp.status(500).json({
            error: "Errore durante la generazione della heatmap",
        });
    }
}

export default router;
