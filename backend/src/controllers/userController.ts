import { USERS_ENDPOINT } from "../config.js";
import { User, UserType } from "../models/User.js";
import type { Request, Response } from "express";

/**
 * Converte un utente completo nel suo formato pubblico,
 * restituendo solo le informazioni visibili all’esterno
 * e aggiungendo il link alla risorsa pubblica dell’utente.
 *
 * @param u - L'utente da trasformare nel formato pubblico
 * @returns Un oggetto con i dati pubblici dell'utente
 */
export function parsePublicUser(u: UserType) {
    return {
        self: `${USERS_ENDPOINT}/${u.username}`,
        username: u.username,
        exp: u.exp,
        profileImage: u.profileImage,
    };
}

/**
 * Recupera un utente tramite il suo username
 * e restituisce i dati pubblici associati.
 *
 * @param req - La richiesta HTTP contenente lo username nei parametri
 * @param res - La risposta HTTP usata per inviare il risultato
 * @returns I dati pubblici dell'utente, oppure un errore adeguato
 */
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


/**
 * Recupera la lista di tutti gli utenti,
 * con possibilità di filtrare per il campo "expert".
 *
 * @param req - La richiesta HTTP, che può contenere il parametro di query `expert`
 * @param res - La risposta HTTP usata per restituire la lista degli utenti
 * @returns Un array di utenti in formato pubblico, eventualmente filtrati
 */
export const getAllUsers = async (req: Request, res: Response) => {
    const { expert } = req.query;

    try {
        let filter: any = {};
        if (expert === "true") filter.expert = true;
        else if (expert === "false") filter.expert = false;

        const users = await User.find(filter);

        const parsedUsers = users.map(u => parsePublicUser(u));
        res.status(200).json(parsedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore del server" });
    }
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
