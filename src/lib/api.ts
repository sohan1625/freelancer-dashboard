const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
const REQUEST_TIMEOUT_MS = 10000;

// ─── Error Class ─────────────────────────────────────────────

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

// ─── Helpers ─────────────────────────────────────────────────

function parseErrorMessage(text: string): string {
    if (!text) return "Something went wrong.";
    try {
        const json = JSON.parse(text);
        return json.message || json.error || json.detail || text;
    } catch {
        return text;
    }
}

function getAccessToken() {
    return localStorage.getItem("accessToken");
}

function getRefreshToken() {
    return localStorage.getItem("refreshToken");
}

function setAccessToken(token: string) {
    localStorage.setItem("accessToken", token);
}

function clearAuth() {
    localStorage.clear();
}

function redirectToLogin() {
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}

// ─── Core Request ───────────────────────────────────────────

async function request<T>(
    endpoint: string,
    method: string,
    body?: unknown,
    retry = true
): Promise<T> {

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const token = getAccessToken(); // ✅ SINGLE SOURCE

    let res: Response;

    try {
        res = await fetch(API_BASE + endpoint, {
            method,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (err) {
        clearTimeout(timeout);
        throw new ApiError("Network error", 0);
    }

    clearTimeout(timeout);

    // Handle token expiry/invalid token responses.
    if (res.status === 401 || res.status === 403) {
        if (retry && getRefreshToken()) {
            try {
                const refreshRes = await fetch(API_BASE + "/api/auth/refresh", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        refreshToken: getRefreshToken(),
                    }),
                });

                if (!refreshRes.ok) throw new Error();

                const data = await refreshRes.json();
                setAccessToken(data.accessToken);

                return request<T>(endpoint, method, body, false);

            } catch {
                clearAuth();
                redirectToLogin();
                throw new ApiError("Session expired", 401);
            }
        }

        clearAuth();
        redirectToLogin();
        throw new ApiError("Session expired", res.status);
    }

    const text = await res.text();

    if (!res.ok) {
        throw new ApiError(parseErrorMessage(text), res.status);
    }

    return text ? JSON.parse(text) : null;
}

// ─── Public APIs ────────────────────────────────────────────

export function apiGet<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, "GET");
}

export function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
    return request<T>(endpoint, "POST", body);
}

export function apiPatch<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, "PATCH", body);
}

export function apiDelete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, "DELETE");
}
