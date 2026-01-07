export interface Connection {
  id: string;
  externalId: string;
  name: string; // The service name (e.g. "Google Sheets")
  icon: any;       // The icon component/url from our frontend mapping
  externalUsername: string; // The actual username/email from the service
  connectedAt: string;
  status: 'active' | 'expired' | 'error';
  serviceCode: string; // e.g., 'google_sheets', 'discord'
  category: string;
}

export interface ServiceDefinition {
    id: string; // 'google-sheets'
    name: string; // 'Google Sheets'
    icon: any;
    category: string;
    description: string;
}
