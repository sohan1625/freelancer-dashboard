import { apiDelete, apiGet, apiPost } from "./api";

export interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
}

export function getClients(): Promise<Client[]> {
    return apiGet<Client[]>("/api/clients");
}

export function createClient(client: {
    name: string;
    email: string;
    phone: string;
}): Promise<Client> {
    return apiPost<Client>("/api/clients", client);
}

export function deleteClient(clientId: number, force = false): Promise<null> {
    const suffix = force ? "?force=true" : "";
    return apiDelete<null>(`/api/clients/${clientId}${suffix}`);
}
