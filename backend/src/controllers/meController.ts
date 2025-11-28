import type { Request, Response } from "express";
import { AuthRequest } from "../routes/auth.js";
import { Place, PlaceType } from "../models/Place.js";
import { User } from "../models/User.js";

export const triggerVisit = async (req: AuthRequest, resp: Response) => {
    if (!req.user) return;

    const { placeId } = req.query;
    if (!placeId) return resp.status(400).json({ error: "Nessun luogo dato " });

    const { lat, lon } = req.body;

    if (!lat || !lon)
        return resp.status(400).json({ error: "Coordinate non trovate" });

    const place = await Place.findById(placeId).exec();
    if (!place) return resp.status(400).json({ error: "Luogo non trovato" });

    if (!place.location) return;

    // Check coordinate
    if (place.location.lat != lat || place.location.lon != lon)
        return resp.status(400).json({ error: "Posizione utente errata " });

    let found = false;

    req.user.places
        .filter((a) => {
            return !a.visited;
        })
        .forEach((p) => {
            if (p.placeId.toString() == placeId) {
                found = true;

                p.visited = true;
                p.date = new Date(Date.now());

                // TODO: Implementare logica missioni
            }
        });

    if (!found)
        return resp
            .status(400)
            .json({ error: "Luogo non presente nei consigliati" });

    await req.user.save();

    return resp.status(200);
};
export const getMeInformation = async (req: AuthRequest, resp: Response) => {
    return resp.status(200).json(req.user);
};
