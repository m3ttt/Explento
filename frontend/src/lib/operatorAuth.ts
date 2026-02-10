import { API_ENDPOINT } from "./config";
import { ref, type Ref } from "vue";
import { OperatorSchema, type Operator } from "./types/operator";

// Variabile che rappresenta l'utente
let operator = ref<Operator | null>(null);

const storageTokenName = "operatorAuth";

export async function checkAuthOp(): Promise<Ref<Operator | null>> {
  operator.value = null;

  const token = localStorage.getItem(storageTokenName);

  // No JWT Token, no operator
  if (!token) return operator;

  // Provo a fare /operator/me con il token
  const resp = await fetch(`${API_ENDPOINT}/operator/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    return operator;
  }
  const data = await resp.json();

  const convertionResp = await OperatorSchema.safeParseAsync(data);

  if (!convertionResp.success) {
    console.error(convertionResp.error);
    return operator;
  }

  operator.value = convertionResp.data;
  return operator;
}

export async function loginOp(
  email: string,
  password: string,
): Promise<{ error: boolean }> {
  const resp = await fetch(`${API_ENDPOINT}/operator/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
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

export async function logoutOp() {
  // Imposto user a null per farlo sloggare
  operator.value = null;
  localStorage.setItem(storageTokenName, "");
}

export async function makeOperatorAuthenticatedRequest(
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
