export interface Agent {
  id: string;
  name: string;
  instructions: string;
  model: string;
  created_at?: string;
  tools?: { name: string; piece?: string; action?: string; mcpConfig?: any }[];
}

export interface ConnectionOption {
  id: string;
  name: string;
  service: string;
}
