import { API_ENDPOINT } from "./config";
import { UserSchema, type User } from "../lib/types/user";

// Variabile che rappresenta l'utente
let user: User | null = null;

// Controlliamo se abbiamo un check già in corso
let isChecking = false;

export async function checkAuth(): Promise<User | null> {
    const token = localStorage.getItem("token");

    // No JWT Token, no user
    if (!token) return null;

    if (user) return user;
    if (isChecking) return null;

    isChecking = true;

    // Provo a fare /me con il token
    const resp = await fetch(`${API_ENDPOINT}/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!resp.ok) {
        isChecking = false;
        user = null;
        return null;
    }
    const data = await resp.json();

    const convertionResp = await UserSchema.safeParseAsync(data);

    if (!convertionResp.success) {
        console.error(convertionResp.error);
        isChecking = false;
        user = null;
        return null;
    }

    user = convertionResp.data;
    isChecking = false;

    return user;
}

export async function login(
    username: string,
    password: string,
): Promise<{ error: boolean }> {
    const resp = await fetch(`${API_ENDPOINT}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    });

    if (!resp.ok) {
        return { error: true };
    }

    const data = await resp.json();
    const token = data["token"];

    localStorage.setItem("token", token);

    return { error: false };
}

export async function logout() {
    // Imposto user a null per farlo sloggare
    user = null;
    localStorage.setItem("token", "");
}

export async function register(
    username: string,
    password: string,
    email: string,
    name: string,
    surname: string,
): Promise<{ error: boolean }> {
    const resp = await fetch(`${API_ENDPOINT}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username,
            password: password,
            surname: surname,
            name: name,
            email: email,
        }),
    });

    if (!resp.ok) {
        return { error: true };
    }

    return { error: false };
}
