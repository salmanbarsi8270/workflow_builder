import { 
  Mail, 
  FileSpreadsheet, 
  Clock
} from "lucide-react";

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'trigger';
}

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'app' | 'utility';
  actions: ActionDefinition[];
}

export const APP_DEFINITIONS: AppDefinition[] = [
  // --- Utilities ---
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'Trigger workflows at specific intervals.',
    icon: Clock,
    category: 'utility',
    actions: [
      { id: 'every_x_minutes', name: 'Every X Minutes', description: 'Triggers the flow every X minutes.', type: 'trigger' },
      { id: 'every_hour', name: 'Every Hour', description: 'Triggers the flow every hour.', type: 'trigger' },
      { id: 'every_day', name: 'Every Day', description: 'Triggers the flow every day.', type: 'trigger' },
      { id: 'cron_expression', name: 'Cron Expression', description: 'Trigger using a specific cron expression.', type: 'trigger' }
    ]
  },
  {
    id: 'delay',
    name: 'Delay',
    description: 'Pause the workflow for a set time.',
    icon: Clock, // Keeping clock for now
    category: 'utility',
    actions: [
      { id: 'delay_for', name: 'Delay For', description: 'Pause execution for a specific duration.', type: 'action' }
    ]
  },

  // --- Apps ---
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Manage emails with Gmail integration.',
    icon: Mail,
    category: 'app',
    actions: [
      { id: 'send_email', name: 'Send Email', description: 'Send an email through a Gmail account.', type: 'action' },
      { id: 'custom_api', name: 'Custom API Call', description: 'Make a custom API call to a specific endpoint.', type: 'action' }
    ]
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Manage spreadsheets.',
    icon: FileSpreadsheet,
    category: 'app',
    actions: [
      { id: 'insert_row', name: 'Insert Row', description: 'Add a new row to a spreadsheet.', type: 'action' },
      { id: 'read_rows', name: 'Read Rows', description: 'Read multiple rows from a sheet.', type: 'action' }
    ]
  }
];
