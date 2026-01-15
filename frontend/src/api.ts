const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export function getToken(): string | null {
    return localStorage.getItem("token");
}

export function setToken(token: string) {
    localStorage.setItem("token", token);
}

export function clearToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
}

export async function apiFetch(path: string, init: RequestInit = {}) {
    return fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init.headers ?? {}),
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
    });
}

export function setUserInfo(username: string, role: string) {
    localStorage.setItem("username", username);
    localStorage.setItem("role", role);
}

export function getRole(): string | null {
    return localStorage.getItem("role");
}

export function getUsername(): string | null {
    return localStorage.getItem("username");
}