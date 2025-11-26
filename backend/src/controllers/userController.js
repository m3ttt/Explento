import mongoose from "mongoose";
import User from "../models/User.js"; // schema User MongoDB

export const getUserById = async (req, res) => {
    const { id } = req.params;
    // console.log("ID ricevuto:", id);

    // Controllo se l'ID è un ObjectId valido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID non valido" });
    }

    try {
        const user = await User.findById(id);
        // .populate('visitedPlaces.placeId')
        // .populate('missionsProgress.missionId')
        // .populate('missionsProgress.visitedPlaces.placeId');

        // console.log("Utente trovato:", user);

        if (!user) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore del server" });
    }
};
