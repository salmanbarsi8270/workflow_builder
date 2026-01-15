import { API_URL } from "./apiurl";

export interface FlowListResponse {
    success: boolean;
    flows?: any[];
    error?: string;
}

export interface FlowResponse {
    success: boolean;
    flow?: any;
    error?: string;
}

export interface CreateFlowPayload {
    userId: string;
    name: string;
    ui_definition: {
        nodes: any[];
        edges: any[];
    };
}

export interface UpdateFlowPayload {
    flowId: string;
    name?: string;
    ui_definition?: {
        nodes: any[];
        edges: any[];
    };
    is_active?: boolean;
}

/**
 * List all flows for a user
 */
export async function listFlows(userId: string): Promise<FlowListResponse> {
    try {
        const response = await fetch(`${API_URL}/api/flows?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error("Failed to list flows:", error);
        return { success: false, error: error.message || "Failed to list flows" };
    }
}

/**
 * Get a single flow by ID
 */
export async function getFlow(flowId: string): Promise<FlowResponse> {
    try {
        const response = await fetch(`${API_URL}/api/flows/${flowId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error("Failed to get flow:", error);
        return { success: false, error: error.message || "Failed to get flow" };
    }
}

/**
 * Create a new flow
 */
export async function createFlow(payload: CreateFlowPayload): Promise<FlowResponse> {
    try {
        const response = await fetch(`${API_URL}/api/flows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error("Failed to create flow:", error);
        return { success: false, error: error.message || "Failed to create flow" };
    }
}

/**
 * Update an existing flow
 */
export async function updateFlow(payload: UpdateFlowPayload): Promise<FlowResponse> {
    try {
        const response = await fetch(`${API_URL}/api/flows/${payload.flowId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error("Failed to update flow:", error);
        return { success: false, error: error.message || "Failed to update flow" };
    }
}

/**
 * Delete a flow
 */
export async function deleteFlow(flowId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/flows/${flowId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error("Failed to delete flow:", error);
        return { success: false, error: error.message || "Failed to delete flow" };
    }
}
