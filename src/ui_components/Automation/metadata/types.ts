export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'connection' | 'select' | 'object' | 'dynamic-select' | 'agent';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: { label: string, value: string }[];
  dependsOn?: string[] | { field: string, value: any };
  dynamicOptions?: { action: string, dependsOn?: string[] };
}

export interface PropertyMetadata {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  properties?: PropertyMetadata[];
  items?: PropertyMetadata;
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'trigger';
  parameters?: ActionParameter[];
  outputSchema?: PropertyMetadata[];
}

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'app' | 'utility' | 'agent';
  actions: ActionDefinition[];
}
