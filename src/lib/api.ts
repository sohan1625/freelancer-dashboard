const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const normalizeInvoice = (inv: any) => ({
    ...inv,
    status: inv.status?.toLowerCase(),
});

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.statusText}`);
    const data = await res.json();
    if (Array.isArray(data)) return data.map(normalizeInvoice) as T;
    return data;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.statusText}`);
    const data = await res.json();
    return normalizeInvoice(data) as T;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.statusText}`);
    const data = await res.json();
    return normalizeInvoice(data) as T;
}

export async function apiDelete(path: string): Promise<void> {
    const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.statusText}`);
}