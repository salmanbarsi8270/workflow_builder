export interface AuthConfig {
  type: 'none' | 'headers' | 'bearer' | 'apiKey';
  apiKeyHeader?: string;
  apiKeyValue?: string;
  accessToken?: string;
  headers?: Record<string, string>;
}

export interface MCPConfig {
  name: string;
  type: 'stdio' | 'sse' | 'http' | 'streamable-http';
  url?: string;
  command?: string;
  args?: string[];
  enabledTools?: string[]; // List of specific tool names to enable
  connectionId?: string;
  auth?: AuthConfig;
  env?: Record<string, string>;
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
    type?: 'piece' | 'mcp' | 'workflow';
    piece?: string;
    action?: string;
    mcpConfig?: MCPConfig;
    connectionId?: string;
    workflowId?: string;
  }[];
  sub_agents?: Agent[];
  subagents?: Agent[];
  safety_config?: { instructions: string };
  ui_config?: {
    theme_color: string;
    template_id: string;
    logo_url?: string;
    title?: string;
    welcome_message?: string;
    input_placeholder?: string;
    font_family?: string;
    show_branding?: boolean;
  };
}

export interface ConnectionOption {
  id: string;
  name: string;
  service: string;
}
