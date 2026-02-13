import { Request, Response } from "express";
import { Operator } from "../models/Operator";
import { compare } from "bcrypt";
import pkg from "jsonwebtoken";
const { sign } = pkg;
import { PlaceEditRequest } from "../models/PlaceEditRequest";
import { Place } from "../models/Place";
import { User } from "../models/User";

import type { OperatorAuthRequest } from "../routes/operator";

export const loginOperator = async (req: Request, resp: Response) => {
    const { email, password } = req.body;

    if (email == "" || password == "") {
        return resp
            .status(400)
            .json({ message: "Email e/o password mancanti" });
    }

    // Cerca nel DB un operatore con la stessa email
    const foundOperator = await Operator.findOne({ email: email });
    if (!foundOperator) {
        return resp.status(400).json({ message: "Email o password errati" });
    }

    // Comparo password e hash salvato su mongodb
    const res = await compare(password, foundOperator.password);
    if (!res) {
        return resp.status(400).json({ message: "Email o password errati" });
    }

    // Creo un JWT token
    // NOTE: Cambiare tempo validità??
    const token = sign(
        { id: foundOperator._id.toString(), role: "operator" },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "24h",
        },
    );

    return resp.status(200).json({ token: token });
};

export const getAllPlaceEdits = async (
    req: OperatorAuthRequest,
    resp: Response,
) => {
    const { placeId, status, isNewPlace } = req.query;

    let query: Record<string, any> = {};

    // filtro ID luogo
    if (placeId) query.placeId = placeId;

    // filtro stato
    if (status) {
        const allowedStatuses = ["pending", "approved", "rejected"];
        if (!allowedStatuses.includes(status as string)) {
            return resp
                .status(400)
                .json({ message: "Stato non valido per il filtro" });
        }
        query.status = status;
    }

    // filtro nuovo luogo
    if (isNewPlace !== undefined) {
        if (isNewPlace !== "true" && isNewPlace !== "false") {
            return resp.status(400).json({
                message: "Valore non valido per isNewPlace (usa true/false)",
            });
        }

        query.isNewPlace = isNewPlace === "true";
    }

    const reqs = await PlaceEditRequest.find(query);

    return resp.status(200).json(reqs);
};

export const getPlaceEdits = async (
    req: OperatorAuthRequest,
    res: Response,
) => {
    const { id } = req.params;

    if (id == "") {
        return res.status(400).json({ message: "Nessun id inserito" });
    }

    const placeEdit = await PlaceEditRequest.findById(id);
    if (!placeEdit) {
        return res
            .status(400)
            .json({ message: "PlaceEditRequest non trovata" });
    }

    return res.status(200).json(placeEdit);
};

export const updatePlaceEdits = async (
    req: OperatorAuthRequest,
    resp: Response,
) => {
    const XP_PER_APPROVED_REQUEST = 10;

    const { id } = req.params;
    const { status, operatorComment } = req.body;

    if (!id) return resp.status(400).json({ message: "Nessun id inserito" });
    if (!req.operator)
        return resp.status(401).json({ message: "Operatore non autenticato" });

    const allowedStatuses = ["pending", "approved", "rejected"];
    if (!allowedStatuses.includes(status)) {
        return resp.status(400).json({ message: "Stato non valido" });
    }

    const editRequest = await PlaceEditRequest.findById(id);
    if (!editRequest) {
        return resp.status(404).json({ message: "Richiesta non trovata" });
    }

    if (editRequest.status !== "pending") {
        return resp
            .status(400)
            .json({ message: `Richiesta già ${editRequest.status}` });
    }

    // Aggiorna metadati della richiesta
    editRequest.status = status;
    editRequest.operatorComment = operatorComment || "";
    editRequest.operatorId = req.operator._id; // Utilizza id operatore preso dalla request

    const user = await User.findById(editRequest.userId);
    if (!user)
        return resp
            .status(400)
            .json({ error: "Utente collegato alla richiesta non trovato" });

    if (status === "approved") {
        if (editRequest.isNewPlace) {
            // Nuovo luogo aggiunto
            // Crea istanza del modello Place con i dati proposti
            const newPlace = new Place(editRequest.proposedChanges);
            const savedPlace = await newPlace.save();

            // Collega richiesta al nuovo luogo appena creato
            editRequest.placeId = savedPlace._id;

            // Assegna Exp all'utente
            user.addEXP(3 * XP_PER_APPROVED_REQUEST);
        } else {
            // Modifica luogo esistente
            const place = await Place.findById(editRequest.placeId);
            if (!place) {
                return resp
                    .status(404)
                    .json({ message: "Place originale non trovato" });
            }

            // Mongoose Merge: aggiorna solo i campi presenti in proposedChanges
            Object.assign(place, editRequest.proposedChanges);

            await place.save();

            // Assegna Exp all'utente
            user.addEXP(XP_PER_APPROVED_REQUEST);
        }
    }

    await editRequest.save();

    return resp.status(200).json({
        message: "Richiesta processata con successo",
        status: editRequest.status,
    });
};

export const meOperator = async (req: OperatorAuthRequest, resp: Response) => {
    return resp.json(req.operator);
};
