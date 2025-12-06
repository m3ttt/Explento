import { Request, Response } from "express";
import { Operator } from "../models/Operator.js";
import { compare } from "bcrypt";
import pkg from "jsonwebtoken";
import { OperatorAuthRequest } from "../routes/operator.js";
import { PlaceEditRequest } from "../models/PlaceEditRequest.js";
const { sign } = pkg;

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
        { id: foundOperator.id, role: "operator" },
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
    const { placeId } = req.query;

    const reqs = await PlaceEditRequest.find();

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
