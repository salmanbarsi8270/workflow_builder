import { API_URL } from "./apiurl";

export interface PieceOption {
    label: string;
    value: string | number;
}

export interface PieceOptionsRequest {
    userId: string;
    service: string;
    actionName: string;
    connectionId?: string;
    context?: Record<string, any>;
}

export async function getPieces() {
    const response = await fetch(`${API_URL}/api/pieces`);
    const data = await response.json();
    return data;
}

export async function getPieceOptions(request: PieceOptionsRequest) {
    const response = await fetch(`${API_URL}/api/pieces/options`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });
    const data = await response.json();
    return data;
}

export async function runAction(request: any) {
    const response = await fetch(`${API_URL}/api/run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });
    const data = await response.json();
    return data;
}

export async function getExcelWorkbooks(userId: string) {
    const response = await fetch(`${API_URL}/api/excel/workbooks?userId=${userId}`);
    const data = await response.json();
    return data;
}
