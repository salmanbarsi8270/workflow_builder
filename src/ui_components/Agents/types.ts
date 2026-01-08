export interface Agent {
  id: string;
  name: string;
  instructions: string;
  model: string;
  created_at?: string;
  api_key?: string;
  connectionId?: string;
  connection_id?: string;
  parent_agent?: string | null;
  tools?: { name: string; piece?: string; action?: string; mcpConfig?: any; connectionId?: string }[];
  sub_agents?: Agent[]; // List of sub-agent objects
  subagents?: Agent[]; // Alternative key from backend
}

export interface ConnectionOption {
  id: string;
  name: string;
  service: string;
}
