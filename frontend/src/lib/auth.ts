import { API_ENDPOINT } from "./config";
import { UserSchemaZod, type User } from "./type";

let user: User | null = null;
let isChecking = false;

export async function checkAuth() {
    const token = localStorage.getItem("token");

    if (!token) return null;

    if (user) return user;
    if (isChecking) return null;

    isChecking = true;

    const resp = await fetch(`${API_ENDPOINT}/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (resp.status != 200) {
        isChecking = false;
        user = null;
        return null;
    }

    const convertionResp = await UserSchemaZod.safeParseAsync(
        await resp.json(),
    );

    if (convertionResp.error) {
        isChecking = false;
        user = null;
        return null;
    }

    user = convertionResp.data;
    isChecking = false;

    return user;
}

export function getUser() {
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

    if (resp.status != 200) {
        return { error: true };
    }

    const data = await resp.json();
    const token = data["token"];

    localStorage.setItem("token", token);

    return { error: false };
}

export async function logout() {
    localStorage.clear();
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

    console.log(await resp.json());

    if (resp.status != 200) {
        return { error: true };
    }

    return { error: false };
}
