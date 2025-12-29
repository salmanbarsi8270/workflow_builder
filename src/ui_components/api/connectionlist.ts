import { API_URL } from "./apiurl";

export async function getConnections(userId: string) {
    const response = await fetch(`${API_URL}/api/connections/${userId}`);
    const data = await response.json();
    return data;
}

export async function deleteConnection(id: string) {
    const response = await fetch(`${API_URL}/api/connections/${id}`, {
        method: 'DELETE',
    });
    const data = await response.json();
    console.log(data);
    return data;
}