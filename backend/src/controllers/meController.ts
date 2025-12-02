import type { Request, Response } from "express";
import { AuthRequest } from "../routes/auth.js";
import { Place, PlaceType } from "../models/Place.js";
import { UserType } from "../models/User.js";
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

    const validationError = await validateVisit(req.user, req.query.placeId, req.body.lat, req.body.lon);
    if (validationError) return resp.status(400).json({ error: validationError });

    // placeId una volta validato può essere una stringa o un array di string
    // prendo quindi solo il primo elemento
    const placeId = Array.isArray(req.query.placeId) ? String(req.query.placeId[0]) : String(req.query.placeId);

    await recordVisit(req.user, placeId);
    await updateMissionsProgress(req.user, placeId);

    await req.user.save();

    return resp.status(200).json({ success: true });
};

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
    user: UserType,
    placeId: string | ParsedQs | (string | ParsedQs)[] | undefined,
    lat: any,
    lon: any
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

    // TODO: implementare check coordinate in un raggio di n metri
    if (place.location.lat !== lat || place.location.lon !== lon) 
        return "Posizione utente errata";

    return null;
}

async function recordVisit(user: UserType, placeId: string) {
    const alreadyVisited = user.visitedPlaces.some(
        vp => vp.placeId?.toString() === placeId
    );

    if (alreadyVisited) return; // luogo già visitato, non aggiungo nulla

    user.visitedPlaces.push({
        placeId,
        visited: true,
        date: new Date(),
    });
}

async function updateMissionsProgress(user: UserType, placeId: string) {

    for (const missionProgress of user.missionsProgresses) {
        // se la missione è già completata, salto
        if (missionProgress.completed) continue;

        // carico la missione dal DB
        const mission = await Mission.findById(missionProgress.missionId);
        if (!mission) continue;

        // verifico se il luogo visitato è tra i requiredPlaces
        const isRequired = mission.requiredPlaces.some(
            rp => rp.placeId && rp.placeId.toString() === placeId
        );

        // verifica se il luogo non è già stato registrato come visitato nella missione
        const alreadyVisitedInMission = missionProgress.requiredPlacesVisited.some(
            rpv => rpv.placeId && rpv.placeId.toString() === placeId
        );

        // Se il luogo conta come progresso e non è ancora stato visitato nella missione
        if (isRequired && !alreadyVisitedInMission) {
            // il luogo conta come progresso, aggiungo ai requiredPlacesVisited
            missionProgress.requiredPlacesVisited.push({ placeId });
            missionProgress.progress = missionProgress.requiredPlacesVisited.length;

            // Segno missione come completata e aggiungo rewardExp all'utente
            if (missionProgress.progress >= mission.requiredCount) {
                missionProgress.completed = true;
                user.exp += mission.rewardExp;
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
