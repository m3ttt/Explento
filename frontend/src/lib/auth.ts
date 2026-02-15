import { API_ENDPOINT } from "./config";
import { UserSchema, type User } from "../lib/types/user";
import { ref, type Ref } from "vue";
import { tokenToString } from "typescript";

// Variabile che rappresenta l'utente
let user = ref<User | null>(null);

const storageTokenName = "userToken";

export async function checkAuth(): Promise<Ref<User | null>> {
  user.value = null;

  const token = localStorage.getItem(storageTokenName);

  // No JWT Token, no user
  if (!token) return user;

  // Provo a fare /me con il token
  const resp = await fetch(`${API_ENDPOINT}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    return user;
  }
  const data = await resp.json();

  const convertionResp = await UserSchema.safeParseAsync(data);

  if (!convertionResp.success) {
    console.error(convertionResp.error);
    return user;
  }

  user.value = convertionResp.data;
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

  localStorage.setItem(storageTokenName, token);

  return { error: false };
}

export async function logout() {
  // Imposto user a null per farlo sloggare
  user.value = null;
  localStorage.setItem(storageTokenName, "");
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

export async function refreshUser() {
  const token = localStorage.getItem(storageTokenName);
  if (!token) {
    user.value = null;
    return;
  }

  const resp = await fetch(`${API_ENDPOINT}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    user.value = null;
    return;
  }

  const data = await resp.json();
  const parsed = await UserSchema.safeParseAsync(data);

  if (parsed.success) {
    user.value = parsed.data;
  }
}

export async function makeUserAuthenticatedRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem(storageTokenName);

  const headers: HeadersInit = {
    ...(options.headers ?? {}),
    Authorization: `Bearer ${token}`,
  };

  const resp = await fetch(`${API_ENDPOINT}${path}`, {
    ...options,
    headers,
  });

  return resp;
}
