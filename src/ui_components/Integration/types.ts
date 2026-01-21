export interface ConnectedAccount {
  id: string;
  externalId: string;
  username: string;
  avatarUrl: string;
  connectedAt: string;
}

export interface IntegrationApp {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  connected: boolean;
  lastSynced?: string;
  category?: string;
  connectionStatus?: 'healthy' | 'warning' | 'error';
  syncProgress?: number;
  accounts?: ConnectedAccount[];
  service?: string;
  popularity?: number;
  featured?: boolean;
  metadata?: {
    actions?: string[];
    triggers?: string[];
    fullMetadata?: any;
  };
}
