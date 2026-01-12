export interface MCPConfig {
  name: string;
  type: 'stdio' | 'sse' | 'http' | 'streamable-http';
  url?: string;
  command?: string;
  args?: string[];
}

export interface Agent {
  id: string;
  userId?: string;
  name: string;
  instructions: string;
  model: string;
  created_at?: string;
  api_key?: string;
  connectionId?: string;
  connection_id?: string;
  parent_agent?: string | null;
  tools?: {
    name: string;
    piece?: string;
    action?: string;
    mcpConfig?: MCPConfig;
    connectionId?: string
  }[];
  sub_agents?: Agent[];
  subagents?: Agent[];
  safety_config?: { instructions: string };
}

export interface ConnectionOption {
  id: string;
  name: string;
  service: string;
}
