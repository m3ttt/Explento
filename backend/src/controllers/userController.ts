import mongoose from "mongoose";
import User from "../models/User.js"; // schema User MongoDB
import type { Request, Response } from "express";

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (id == undefined)
        return res.status(400).json({ message: "Nessun ID inserito" });

    // Controllo se l'ID è un ObjectId valido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID non valido" });
    }

    try {
        const user = await User.findById(id);
        // .populate('visitedPlaces.placeId')
        // .populate('missionsProgress.missionId')
        // .populate('missionsProgress.visitedPlaces.placeId');

        if (!user) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore del server" });
    }
};
