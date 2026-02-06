import type { Response } from "express";
import { AuthRequest } from "../routes/auth.js";
import { Place } from "../models/Place.js";
import { PlaceEditRequest } from "../models/PlaceEditRequest.js";
import type { ParsedQs } from "qs";

const getDistanceFromLatLonInKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const getPlaces = async (req: AuthRequest, res: Response) => {
    try {
        let allPlaces;

        // Ottengo gli id dei posti già visitati
        const visitedPlaceIds =
            req.user?.visitedPlaces?.map((vp) => vp.placeId) || [];

        let filter: any = {
            _id: { $nin: visitedPlaceIds },
        };

        if (
            req.user?.preferences &&
            req.user?.preferences?.categories.length != 0
        ) {
            filter.categories = {
                // TODO: Capire se mettere $in o $all
                $in: req.user.preferences.categories,
            };

            if (!req.user.preferences.alsoPaid) filter.isFree = true;
        }

        allPlaces = await Place.find(filter).lean();

        const { lat, lon, radius } = req.query;

        if (lat && lon) {
            const userLat = parseFloat(lat as string);
            const userLon = parseFloat(lon as string);
            const searchRadius = radius ? parseFloat(radius as string) : 5;

            const nearbyPlaces = allPlaces
                .map((place) => {
                    let distance = 0;

                    if (place.location)
                        distance = getDistanceFromLatLonInKm(
                            userLat,
                            userLon,
                            place.location.lat,
                            place.location.lon,
                        );

                    return {
                        ...place,
                        distance: parseFloat(distance.toFixed(2)),
                    };
                })
                .filter((place) => place.distance <= searchRadius)
                .sort((a, b) => a.distance - b.distance);

            return res.status(200).json(nearbyPlaces);
        }

        return res.status(200).json(allPlaces);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore del server" });
    }
};
function validatePlaceBase(
    name: string,
    description: string | undefined,
    categories: string[],
    location: { lat: number | string; lon: number | string },
    isFree: boolean,
    images?: string[],
) {
    if (!name || name.trim().length === 0) return "Nome mancante";
    if (name.length < 3) return "Nome troppo corto";
    if (name.length > 100) return "Nome troppo lungo";

    if (!categories || !Array.isArray(categories) || categories.length === 0)
        return "Categorie non valide";

    for (const cat of categories) {
        if (typeof cat !== "string" || cat.trim().length === 0)
            return "Ogni categoria deve essere una stringa non vuota";
    }

    if (
        !location ||
        typeof location.lat === "undefined" ||
        typeof location.lon === "undefined" ||
        isNaN(Number(location.lat)) ||
        isNaN(Number(location.lon))
    ) {
        return "Coordinate non valide";
    }

    if (typeof isFree !== "boolean") return "isFree deve essere booleano";

    if (description && description.length < 10)
        return "Descrizione troppo corta";

    if (description && description.length > 500)
        return "Descrizione troppo lunga";

    if (images) {
        if (!Array.isArray(images)) return "Images deve essere un array";
        if (images.length > 10) return "Massimo 10 immagini per luogo";

        for (const img of images) {
            if (typeof img !== "string") return "Immagini non valide";
            if (!/^data:image\/(png|jpeg|jpg|gif);base64,/.test(img))
                return "Formato immagine non valido";
        }
    }

    return null;
}

// Normalizzazione avanzata stringa
const normalizeString = (str: string) => {
    return str
        .normalize("NFD") // separa accenti
        .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
        .replace(/['’´`]/g, "") // rimuove apostrofi
        .replace(/[^a-zA-Z0-9 ]/g, " ") // rimuove simboli strani
        .replace(/\s+/g, " ") // spazi doppi → singolo
        .trim()
        .toLowerCase();
};

export const createAddPlaceRequest = async (
    req: AuthRequest,
    res: Response,
) => {
    if (!req.user)
        return res.status(401).json({ message: "Utente non autenticato" });

    try {
        const { name, description, categories, location, images, isFree } =
            req.body;

        const validationError = await validatePlaceUpload(
            name,
            description,
            categories,
            location,
            isFree,
            images,
        );
        if (validationError)
            return res.status(400).json({ error: validationError });

        const normalized = normalizeString(name);

        const existingPlace = await Place.findOne({
            normalizedName: normalized,
        });

        if (existingPlace) {
            return res.status(409).json({
                message: "Questo luogo esiste già nell'applicazione",
                placeId: existingPlace._id,
            });
        }

        // Creazione di una richiesta di nuovo luogo
        const newRequest = new PlaceEditRequest({
            userId: req.user._id,
            proposedChanges: {
                name,
                description,
                categories,
                location,
                images,
                isFree,
            },
            isNewPlace: true,
            status: "pending",
        });

        await newRequest.save();

        return res.status(201).json({
            message:
                "Richiesta di nuovo luogo inviata e in attesa di approvazione",
            request: newRequest,
        });
    } catch (error) {
        console.error("Errore creazione luogo:", error);
        res.status(500).json({ message: "Errore del server" });
    }
};

async function validatePlaceUpload(
    name: string,
    description: string | undefined,
    categories: string[],
    location: { lat: number | string; lon: number | string },
    isFree: boolean,
    images?: string[],
) {
    return validatePlaceBase(
        name,
        description,
        categories,
        location,
        isFree,
        images,
    );
}

export const createUpdatePlaceRequest = async (
    req: AuthRequest,
    res: Response,
) => {
    if (!req.user) return;

    if (!req.params) return res.status(400).json({ error: "Nessun id dato" });

    const { id } = req.params;

    try {
        const { name, description, categories, location, images, isFree } =
            req.body;

        const validationError = await validatePlaceUpdate(
            id,
            name,
            description,
            categories,
            location,
            isFree,
            images,
        );

        if (validationError)
            return res.status(400).json({ error: validationError });

        // Creazione della richiesta di modifica
        const editRequest = new PlaceEditRequest({
            userId: req.user._id,
            placeId: id,
            isNewPlace: false,
            status: "pending",
            proposedChanges: {
                name,
                description,
                categories,
                location,
                images,
                isFree,
            },
        });

        await editRequest.save();

        return res.status(201).json({
            message:
                "Richiesta di modifica inviata e in attesa di approvazione",
            request: editRequest,
        });
    } catch (error) {
        console.error("Errore creazione luogo:", error);
        res.status(500).json({ message: "Errore del server" });
    }
};

async function validatePlaceUpdate(
    placeId: string | ParsedQs | (string | ParsedQs)[] | undefined,
    name: string,
    description: string | undefined,
    categories: string[],
    location: { lat: number | string; lon: number | string },
    isFree: boolean,
    images?: string[],
) {
    if (!placeId) return "Nessun luogo dato";

    let goodPlaceId: string;

    if (Array.isArray(placeId)) {
        goodPlaceId = String(placeId[0]);
    } else if (typeof placeId === "string") {
        goodPlaceId = placeId;
    } else {
        return "placeId non valido";
    }

    const baseError = validatePlaceBase(
        name,
        description,
        categories,
        location,
        isFree,
        images,
    );

    if (baseError) return baseError;

    const place = await Place.findById(goodPlaceId);
    if (!place) return "Luogo non trovato";

    return null;
}

export async function getPlaceById(req: AuthRequest, resp: Response) {
    if (!req.params)
        return resp.status(400).json({ error: "Inserire id luogo" });

    const place = await Place.findById(req.params.id);
    if (!place) return resp.status(400).json({ error: "Luogo non trovato" });

    return resp.status(200).json(place);
}
