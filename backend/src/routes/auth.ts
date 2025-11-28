import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: string | JwtPayload;
}

export function authenticate(
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
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token non valido o scaduto" });
    }
}
