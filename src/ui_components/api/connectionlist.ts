import { API_URL } from "./apiurl";

/**
 * Fetch all connections for a user (flat list - backward compatible)
 */
export async function getConnections(userId: string) {
    const response = await fetch(`${API_URL}/api/connections/${userId}`);
    const data = await response.json();
    return data;
}

/**
 * Fetch services with their connections arrays (new structure for multiple accounts)
 */
export async function getServices(userId: string) {
    const response = await fetch(`${API_URL}/api/services?userId=${userId}`);
    const data = await response.json();
    return data;
}

/**
 * Delete a specific connection by its ID
 */
export async function deleteConnection(id: string) {
    const response = await fetch(`${API_URL}/api/disconnect/connections/${id}`, {
        method: 'DELETE',
    });
    const data = await response.json();
    console.log(data);
    return data;
}

/**
 * Delete all connections for a user and service (legacy endpoint)
 */
export async function disconnectService(userId: string, serviceId: string) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/disconnect/${userId}/${serviceId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return data;
}