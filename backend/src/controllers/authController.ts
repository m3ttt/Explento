import { Request, Response } from "express";
import { User } from "../models/User.js";
import { compare } from "bcrypt";
import { hash } from "bcrypt";
import pkg from "jsonwebtoken";
const { sign } = pkg;

export async function loginUser(req: Request, resp: Response) {
    const { username, password } = req.body;

    if (username == "" || password == "")
        return resp.status(400).json({ error: "Credenziali non fornite" });

    const foundUser = await User.findOne({ username: username });
    if (foundUser == null)
        return resp.status(400).json({ error: "Username o password errati" });

    const res = await compare(password, foundUser.password);
    if (!res) {
        return resp.status(400).json({ error: "Username o password errati" });
    }

    const jwt = sign({ id: foundUser.id }, process.env.JWT_SECRET as string, {
        expiresIn: "72h",
    });

    return resp.status(200).json({ token: jwt });
}
