import { USERS_ENDPOINT } from "../config.js";
import { User, UserType } from "../models/User.js"; // schema User MongoDB
import type { Request, Response } from "express";

export function parsePublicUser(u: UserType) {
    return {
        self: `${USERS_ENDPOINT}/${u.username}`,
        username: u.username,
        exp: u.exp,
        profileImage: u.profileImage,
    };
}

export const getUserByUsername = async (req: Request, res: Response) => {
    const { username } = req.params;

    if (username == "")
        return res.status(400).json({ message: "Nessuno Username inserito" });

    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        res.json(parsePublicUser(user));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore del server" });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    const { expert } = req.query;

    let users;

    if (expert == "true") users = await User.find({ expert: true });
    else users = await User.find();

    const parsedUser: any[] = [];

    users.forEach((u: UserType) => {
        parsedUser.push(parsePublicUser(u));
    });

    res.status(200).json(parsedUser);
};

// Bisogna metterlo nell'endpoint /auth/register
// export const addUser = async (req: Request, res: Response) => {
//     const { username, name, surname, email, password } = req.body;
//
//     if (
//         username == "" ||
//         name == "" ||
//         surname == "" ||
//         email == "" ||
//         password == ""
//     )
//         return res.status(400).json({ message: "Schema data invalido" });
//
//     const hashedPassword = await bcrypt.hash(password, 10);
//
//     try {
//         const newUser = await User.create({
//             username: username,
//             name: name,
//             surname: surname,
//             email: email,
//             password: hashedPassword,
//             exp: 0,
//         });
//         res.status(200).json(newUser);
//     } catch (_) {
//         res.status(400).json({ message: "Errore nella creazione dell'utente" });
//     }
// };
