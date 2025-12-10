import type { Request, Response } from "express";
import { AuthRequest } from "../routes/auth.js";
import { Place } from "../models/Place.js";
import { PlaceEditRequest } from "../models/PlaceEditRequest.js";
import type { ParsedQs } from "qs";

export const getPlaces = async (req: AuthRequest, res: Response) => {
    try {
        const places = await Place.find(); // recupera tutti i luoghi dal DB
        res.status(200).json(places);
    } catch (error) {
        console.error("Errore recupero luoghi:", error);
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
    return validatePlaceBase(name, description, categories, location, isFree, images);
}

export const createUpdatePlaceRequest = async (req: AuthRequest, res: Response) => {
    if (!req.user) return;

    try {
        const {
            placeId,
            name,
            description,
            categories,
            location,
            images,
            isFree,
        } = req.body;

        const validationError = await validatePlaceUpdate(
            name,
            description,
            categories,
            location,
            images,
            isFree,
        );

        if (validationError)
            return res.status(400).json({ error: validationError });

        // Creazione della richiesta di modifica
        const editRequest = new PlaceEditRequest({
            userId: req.user._id,
            placeId,
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
        images
    );

    if (baseError) return baseError;

    const place = await Place.findById(goodPlaceId).exec();
    if (!place) return "Luogo non trovato";

    return null;
}
