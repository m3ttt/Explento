import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User, UserType } from "../models/User.js";
import { Document } from "mongoose";

export interface AuthRequest extends Request {
    user?: UserType & Document;
}

export async function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) {
    const authHeader = req.headers.authorization;

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

        const userId = payload.id;
        if (!userId)
            return res
                .status(401)
                .json({ error: "Token non valido o scaduto" });

        const foundUser = (await User.findById(userId).exec()) as
            | (UserType & Document)
            | null;
        if (!foundUser)
            return res
                .status(401)
                .json({ error: "Token non valido o scaduto" });

        req.user = foundUser;

        next();
    } catch (err) {
        return res.status(401).json({ error: "Token non valido o scaduto" });
    }
}
