import { Request, Response } from "express";
import { User } from "../models/User";
import { compare, hash } from "bcrypt";
import pkg from "jsonwebtoken";
const { sign } = pkg;

/**
 * Gestisce il login per l'utente
 *
 * Valida lo username e la password salvate nel database e in caso, restituisce il JWT Token
 *
 * @param req - Oggetto della richiesta
 * @param resp - Oggetto della risposta, usato per inviare il risultato
 * @returns Risposta HTTP con { success: true } se tutto va bene, altrimenti errore 400 con messaggio
 */
export async function loginUser(req: Request, resp: Response) {
    const { username, password } = req.body;

    if (username == "" || password == "")
        return resp.status(400).json({ error: "Credenziali non fornite" });

    const foundUser = await User.findOne({ username: username });
    if (foundUser == null)
        return resp.status(400).json({ error: "Username o password errati" });

    // Vado a confrontare l'hash salvato nel database con la password per verificare la corretezza
    const res = await compare(password, foundUser.password);
    if (!res) {
        return resp.status(400).json({ error: "Username o password errati" });
    }

    // Vado a creare il JWT Token per l'utente, contenente il suo id e il suo ruolo
    // Uso il JWT_SECRET per firmare il JWT Token
    // NOTE: In caso impostare il timer di scadenza maggiore o minore
    const jwt = sign(
        { id: foundUser._id, role: "user" },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "72h",
        },
    );

    // Il frontend salverà il token e lo manderà alle richieste HTTP
    return resp.status(200).json({ token: jwt });
}

/**
 * Gestisce la registrazione di un utente
 *
 * Controlla i campi necessari e va a creare un nuovo utente
 *
 * @param req - Oggetto della richiesta
 * @param resp - Oggetto della risposta, usato per inviare il risultato
 * @returns Risposta HTTP con { success: true } se tutto va bene, altrimenti errore 400 con messaggio
 */

export const registerUser = async (req: Request, res: Response) => {
    const { username, name, surname, email, password } = req.body;

    if (
        username == "" ||
        name == "" ||
        surname == "" ||
        email == "" ||
        password == ""
    )
        return res.status(400).json({ message: "Schema dati invalido" });

    // Vado a effettuare l'hashing della password
    const hashedPassword = await hash(password, 10);

    try {
        const newUser = await User.create({
            username: username.toString(),
            name: name,
            surname: surname,
            email: email,
            password: hashedPassword,
            exp: 0,
        });
        res.status(200).json(newUser);
    } catch (e) {
        console.log(e);
        res.status(400).json({ error: "Errore nella creazione dell'utente" });
    }
};
