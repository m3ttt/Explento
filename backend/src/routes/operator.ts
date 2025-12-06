import express, { NextFunction, Request, Response } from "express";
import { Operator, OperatorType } from "../models/Operator.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
    loginOperator,
    getAllPlaceEdits,
    getPlaceEdits,
} from "../controllers/operatorController.js";

export interface OperatorAuthRequest extends Request {
    operator?: OperatorType & Document;
}
export async function operatorAuthenticate(
    req: OperatorAuthRequest,
    res: Response,
    next: NextFunction,
) {
    const authHeader = req.headers.authorization;

    console.log("operatorAuthenticate TRIGGERED:", req.path);

    if (!authHeader) {
        return res.status(401).json({ error: "Manca header autorizzazione" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res
            .status(401)
            .json({ error: "Header Authorization non valido" });
    }

    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
        ) as JwtPayload;

        const operatorId = payload.id;
        if (!operatorId)
            return res
                .status(401)
                .json({ error: "Token non valido o scaduto" });

        const foundOperator = (await Operator.findById(operatorId).exec()) as
            | (OperatorType & Document)
            | null;
        if (!foundOperator)
            return res.status(401).json({ error: "Operatore non trovato" });

        req.operator = foundOperator;

        next();
    } catch (err) {
        return res.status(401).json({ error: "Token non valido o scaduto" });
    }
}
const router = express.Router();

// GET /operator/login
router.post("/login", loginOperator);

// Da qui in poi richieste autenticate
router.use(operatorAuthenticate);

router.get("/place_requests", getAllPlaceEdits);
router.get("/place_requests/:id", getPlaceEdits);

export default router;
