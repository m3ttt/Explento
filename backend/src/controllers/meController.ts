import type { Response } from "express";
import { AuthRequest } from "../routes/auth.js";
import { Place } from "../models/Place.js";
import { User, UserType } from "../models/User.js";
import Mission from "../models/Mission.js";
import type { ParsedQs } from "qs";

/**
 * Gestisce la visita di un utente a un luogo.
 *
 * Valida i parametri della visita, registra la visita e aggiorna eventuali progressi
 * delle missioni dell'utente.
 *
 * @param req - Oggetto della richiesta autenticata, deve contenere l'utente, latitudine e longitudine
 * @param resp - Oggetto della risposta, usato per inviare il risultato
 * @returns Risposta HTTP con { success: true } se tutto va bene, altrimenti errore 400 con messaggio
 */
export const triggerVisitPlace = async (req: AuthRequest, resp: Response) => {
    if (!req.user) return;

    if (!req.query) return resp.status(400).json({ error: "Manca placeId" });
    if (!req.body)
        return resp.status(400).json({ error: "Mancano coordinate GPS" });

    const validationError = await validateVisit(
        req.query.placeId,
        req.body.lat,
        req.body.lon,
    );

    if (validationError)
        return resp.status(400).json({ error: validationError });

    // placeId una volta validato può essere una stringa o un array di string
    // prendo quindi solo il primo elemento
    const placeId = Array.isArray(req.query.placeId)
        ? String(req.query.placeId[0])
        : String(req.query.placeId);

    await recordVisit(req.user, placeId);
    await updateMissionsProgress(req.user, placeId);
    await req.user.save();

    // TODO: EXP va aggiunta solo se il luogo non è stato ancora scoperto.
    req.user.addEXP(5);

    return resp.status(200).json({ success: true });
};

function getDistanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Raggio della Terra in metri
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Valida una visita di un utente a un luogo.
 *
 * @param user - L'utente che sta visitando il luogo
 * @param placeId - L'ID del luogo da visitare
 * @param lat - Latitudine dell'utente
 * @param lon - Longitudine dell'utente
 * @returns Un messaggio di errore se la visita non è valida, altrimenti null
 */
async function validateVisit(
    placeId: string | ParsedQs | (string | ParsedQs)[] | undefined,
    lat: any,
    lon: any,
) {
    if (!placeId) return "Nessun luogo dato";

    // Estrazione sicura di placeId
    let goodPlaceId: string;

    if (Array.isArray(placeId)) {
        goodPlaceId = String(placeId[0]); // Prendo primo elemento
    } else if (typeof placeId === "string") {
        goodPlaceId = placeId;
    } else {
        return "placeId non valido"; // ParsedQs o undefined
    }

    // Conversione e validazione delle coordinate
    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (isNaN(latNum) || isNaN(lonNum)) return "Coordinate non valide";

    // Verifica che place esista e abbia coordinate assegnate
    const place = await Place.findById(goodPlaceId).exec();
    if (!place) return "Luogo non trovato";
    if (!place.location) return "Luogo senza coordinate";

    // Controllo distanza entro 20 metri
    const distance = getDistanceInMeters(
        latNum,
        lonNum,
        place.location.lat,
        place.location.lon
    );

    // Se l'utente si trova a piu di 20 metri di distanza dal luogo, visita non valida
    if (distance > 20) {
        return "Posizione utente fuori dal raggio consentito";
    }

    return null;
}

async function recordVisit(user: UserType, placeId: string) {
    const alreadyVisited = user.visitedPlaces.some(
        (vp) => vp.placeId?.toString() === placeId,
    );

    if (alreadyVisited) return; // luogo già visitato, non aggiungo nulla

    user.visitedPlaces.push({
        placeId,
        visited: true,
        date: new Date(),
    });
}

async function updateMissionsProgress(user: UserType, placeId: string) {
    // Preleva tutti gli _id delle missioni dell'utente che non sono completate
    const incompleteMissionIds = user.missionsProgresses
    .filter(mp => !mp.completed)
    .map(mp => mp.missionId);

    // Singola query per recuperare tutte le missioni non completate
    const missions = await Mission.find({
    _id: { $in: incompleteMissionIds }
    }).lean(); // lean() per restituire plain objects

    const place = await Place.findById(placeId);
    if (!place) return;

    for (const missionProgress of user.missionsProgresses) {
        // se la missione è già completata, salto
        if (missionProgress.completed) continue;

        // carico la missione
        const mission = missions.find(m => m._id.toString() === missionProgress.missionId.toString());
        if (!mission) continue;

        const hasRequiredPlaces = mission.requiredPlaces.length > 0;
        const hasCategories = mission.categories.length > 0;

        // verifica se il luogo non è già stato registrato come visitato nella missione
        const alreadyVisitedInMission =
            missionProgress.requiredPlacesVisited.some(
                (rpv) => rpv.placeId && rpv.placeId.toString() === placeId,
            );
        
        // Se già contato per questa missione, passo alla successiva
        if (alreadyVisitedInMission) continue;

        let countsForProgress = false;
        
        // NB: Se una missione ha requiredPlaces + categories, ignora le categorie
        //     le categorie contano solo se requiredPlaces è vuoto.

        // CASO 1: missione con luoghi specifici
        if (hasRequiredPlaces) {
            countsForProgress = mission.requiredPlaces.some(
                (rp) => rp.placeId && rp.placeId.toString() === placeId,
            );
        }
        // CASO 2: missione per categoria
        else if (hasCategories) {
            countsForProgress = place.categories.some((cat: string) =>
                mission.categories.includes(cat),
            );
        }

        // Se il luogo conta come progresso
        if (countsForProgress) {
            // il luogo conta come progresso, aggiungo ai requiredPlacesVisited
            missionProgress.requiredPlacesVisited.push({ placeId });
            missionProgress.progress =
                missionProgress.requiredPlacesVisited.length;

            // Segno missione come completata e aggiungo rewardExp all'utente
            if (missionProgress.progress >= mission.requiredCount) {
                missionProgress.completed = true;
                user.addEXP(mission.rewardExp);
            }
        }
    }
}

/**
 * Restituisce le informazioni dell'utente autenticato.
 *
 * @param req - Oggetto della richiesta autenticata, deve contenere l'utente in `req.user`
 * @param resp - Oggetto della risposta, usato per inviare il risultato
 * @returns Risposta HTTP con i dati dell'utente autenticato
 */
export const getMeInformation = async (req: AuthRequest, resp: Response) => {
    return resp.status(200).json(req.user);
};

export const setSuggestions = async (req: AuthRequest, resp: Response) => {};

/**
 * Aggiorna le preferenze utente
 *
 * @param req - Oggetto della richiesta autenticata, deve contenere l'utente in `req.user`
 * @param resp - Oggetto della risposta, usato per inviare il risultato
 * @returns Risposta HTTP con codice di stato
 */
export const updatePreferences = async (req: AuthRequest, resp: Response) => {
    if (!req.body) {
        return resp.status(400).json({ error: "Informazioni mancanti" });
    }

    const { alsoPaid, categories } = req.body;

    if (alsoPaid == null || categories == null)
        return resp.status(400).json({ error: "Informazioni mancanti" });

    const user = await User.findById(req.user?._id);
    if (!user) return resp.status(400).json({ error: "Utente non trovato" });

    user.preferences = {
        alsoPaid: alsoPaid,
        categories: categories,
    };

    user.save();

    return resp.status(200).json({ message: "Ok" });
};
