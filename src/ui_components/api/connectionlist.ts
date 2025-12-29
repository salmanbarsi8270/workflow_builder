import { API_URL } from "./apiurl";

export async function getConnections(userId: string) {
    const response = await fetch(`${API_URL}/api/services?userId=${userId}`);
    const data = await response.json();
    console.log(data);
    return data;
}