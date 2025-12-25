import { Mail, FileSpreadsheet, Clock, HardDrive, FileText } from "lucide-react";

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'connection' | 'select';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: { label: string, value: string }[];
  dependsOn?: { field: string, value: any };
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'trigger';
  parameters?: ActionParameter[];
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
      { 
        id: 'schedule', 
        name: 'Schedule', 
        description: 'Standard polling trigger based on intervals.', 
        type: 'trigger',
        parameters: [
            { 
              name: 'intervalType', 
              type: 'select', 
              label: 'Interval Type', 
              default: 'minutes',
              required: true,
              options: [
                { label: 'Minutes', value: 'minutes' },
                { label: 'Seconds', value: 'seconds' },
                { label: 'Hours', value: 'hours' },
                { label: 'Days', value: 'days' }
              ]
            },
            { 
              name: 'intervalMinutes', 
              type: 'number', 
              label: 'Minutes', 
              description: 'e.g. 5', 
              required: true,
              dependsOn: { field: 'intervalType', value: 'minutes' } 
            },
            { 
              name: 'intervalSeconds', 
              type: 'number', 
              label: 'Seconds', 
              description: 'e.g. 300', 
              required: true,
              dependsOn: { field: 'intervalType', value: 'seconds' } 
            },
            { 
              name: 'intervalHours', 
              type: 'number', 
              label: 'Hours', 
              description: 'e.g. 1', 
              required: true,
              dependsOn: { field: 'intervalType', value: 'hours' } 
            },
            { 
              name: 'intervalDay', 
              type: 'number', 
              label: 'Days', 
              description: 'e.g. 1', 
              required: true,
              dependsOn: { field: 'intervalType', value: 'days' } 
            }
        ]
      }
    ]
  },

  // --- Apps ---
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Integrate with Google Mail to send and read messages.',
    icon: Mail,
    category: 'app',
    actions: [
      // Triggers
      { 
        id: 'newEmail', 
        name: 'New Email', 
        description: 'Fires when a new email is received in the inbox.', 
        type: 'trigger',
        parameters: [
             { name: 'connection', type: 'connection', label: 'Gmail Connection', required: true }
        ] 
      },
      // Actions
      { 
        id: 'sendEmail', 
        name: 'Send Email', 
        description: 'Sends a new email.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Gmail Connection', required: true },
            { name: 'to', type: 'string', label: 'To', description: 'Recipient email address', required: true },
            { name: 'subject', type: 'string', label: 'Subject', description: 'Email subject line', required: true },
            { name: 'body', type: 'string', label: 'Body', description: 'Email body content (supports HTML)', required: true }
        ]
      },
      { 
        id: 'listMessages', 
        name: 'List Messages', 
        description: 'Lists recent emails.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Gmail Connection', required: true },
            { name: 'maxResults', type: 'number', label: 'Max Results', description: 'Maximum number of messages to return', default: 10 },
            { name: 'q', type: 'string', label: 'Query', description: 'Gmail search query (e.g., from:someone@gmail.com)' }
        ]
      }
    ]
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    description: 'Perform operations on Google Spreadsheets.',
    icon: FileSpreadsheet,
    category: 'app',
    actions: [
      { 
        id: 'appendRow', 
        name: 'Append Row', 
        description: 'Appends a row of values to the end of a sheet.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Sheets Connection', required: true },
            { name: 'spreadsheetId', type: 'string', label: 'Spreadsheet ID', description: 'The ID of the spreadsheet.', required: true },
            { name: 'range', type: 'string', label: 'Range', description: 'The sheet name or range (e.g., Sheet1!A1).', required: true },
            { name: 'values', type: 'array', label: 'Values', description: 'List of values for the row (e.g., ["Data 1", "Data 2"]).', required: true }
        ]
      },
      { 
        id: 'appendRowSmart', 
        name: 'Append Row Smart', 
        description: 'Similar to appendRow, but automatically creates the worksheet if it doesn\'t exist.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Sheets Connection', required: true },
            { name: 'spreadsheetId', type: 'string', label: 'Spreadsheet ID', description: 'The ID of the spreadsheet.', required: true },
            { name: 'range', type: 'string', label: 'Range', description: 'The sheet name or range (e.g., Sheet1!A1).', required: true },
            { name: 'values', type: 'array', label: 'Values', description: 'List of values for the row (e.g., ["Data 1", "Data 2"]).', required: true }
        ]
      },
      { 
        id: 'getValues', 
        name: 'Get Values', 
        description: 'Retrieves values from a specific range.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Sheets Connection', required: true },
            { name: 'spreadsheetId', type: 'string', label: 'Spreadsheet ID', description: 'The ID of the spreadsheet.', required: true },
            { name: 'range', type: 'string', label: 'Range', description: 'The range to read (e.g., Sheet1!A1:B10).', required: true },
        ]
      },
      { 
        id: 'createSpreadsheet', 
        name: 'Create Spreadsheet', 
        description: 'Creates a brand new spreadsheet.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Sheets Connection', required: true },
            { name: 'title', type: 'string', label: 'Title', description: 'Title of the new spreadsheet.', required: true }
        ]
      }
    ]
  },
  {
    id: 'drive',
    name: 'Google Drive',
    description: 'Manage files and folders in Google Drive.',
    icon: HardDrive,
    category: 'app',
    actions: [
      { 
        id: 'listFiles', 
        name: 'List Files', 
        description: 'Lists files in the user\'s Drive.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Drive Connection', required: true },
            { name: 'pageSize', type: 'number', label: 'Page Size', description: 'Number of files to return', default: 10 }
        ]
      },
      { 
        id: 'createFolder', 
        name: 'Create Folder', 
        description: 'Creates a new folder.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Drive Connection', required: true },
            { name: 'name', type: 'string', label: 'Folder Name', description: 'Name of the new folder', required: true }
        ]
      }
    ]
  },
   {
    id: 'docs',
    name: 'Google Docs',
    description: 'Create and modify Google Documents.',
    icon: FileText,
    category: 'app',
    actions: [
      { 
        id: 'createDocument', 
        name: 'Create Document', 
        description: 'Creates a new Google Doc.', 
        type: 'action',
        parameters: [
             { name: 'connection', type: 'connection', label: 'Google Docs Connection', required: true },
             { name: 'title', type: 'string', label: 'Title', description: 'Title of the new document', required: true }
        ]
      },
      { 
        id: 'appendText', 
        name: 'Append Text', 
        description: 'Appends text to an existing document.', 
        type: 'action',
        parameters: [
             { name: 'connection', type: 'connection', label: 'Google Docs Connection', required: true },
             { name: 'documentId', type: 'string', label: 'Document ID', required: true },
             { name: 'text', type: 'string', label: 'Text', description: 'The text content to append', required: true }
        ]
      }
    ]
  }
];
