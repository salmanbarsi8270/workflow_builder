import { Mail, FileSpreadsheet, Clock, HardDrive, FileText, Github, Globe } from "lucide-react";

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'connection' | 'select' | 'object';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: { label: string, value: string }[];
  dependsOn?: { field: string, value: any };
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
        ],
        outputSchema: [
          { name: 'id', type: 'string', description: 'The unique ID of the message.' },
          { name: 'threadId', type: 'string', description: 'The ID of the thread which contains this message.' },
          { name: 'snippet', type: 'string', description: 'A short part of the message text.' },
          { name: 'subject', type: 'string', description: 'The message subject.' },
          { name: 'from', type: 'string', description: 'The sender email address.' },
          { name: 'body', type: 'string', description: 'The full message body.' }
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
        ],
        outputSchema: [
          { name: 'id', type: 'string', description: 'The ID of the sent message.' },
          { name: 'threadId', type: 'string', description: 'The thread ID of the sent message.' }
        ]
      },
      {
        id: 'listMessages',
        name: 'List Messages',
        description: 'List messages in the mailbox.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'Gmail Connection', required: true },
          { name: 'maxResults', label: 'Max Results', type: 'number' },
          { name: 'q', label: 'Search Query', type: 'string' }
        ],
        outputSchema: [
          { name: 'messages', type: 'array', description: 'List of message summaries.' },
          { name: 'resultSizeEstimate', type: 'number', description: 'Estimated total number of results.' }
        ]
      },
      {
        id: 'getMessage',
        name: 'Get Message',
        description: 'Get a specific message by its ID.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'Gmail Connection', required: true },
          { name: 'id', label: 'Message ID', type: 'string', required: true, description: 'The ID of the message to retrieve.' }
        ],
        outputSchema: [
          { name: 'id', type: 'string', description: 'The unique ID of the message.' },
          { name: 'threadId', type: 'string', description: 'The ID of the thread which contains this message.' },
          { name: 'snippet', type: 'string', description: 'A short part of the message text.' },
          { name: 'subject', type: 'string', description: 'The message subject.' },
          { name: 'from', type: 'string', description: 'The sender email address.' },
          { name: 'body', type: 'string', description: 'The full message body.' }
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
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Interact with GitHub repositories.',
    icon: Github,
    category: 'app',
    actions: [
      { 
        id: 'createRepository', 
        name: 'Create Repository', 
        description: 'Creates a new GitHub repository.', 
        type: 'action',
        parameters: [
             { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true },
             { name: 'name', type: 'string', label: 'Name', description: 'Name of the new repository', required: true },
             { name: 'description', type: 'string', label: 'Description', description: 'Optional description' },
             { name: 'private', type: 'boolean', label: 'Private', default: false }
        ]
      },
      {
        id: 'delete_repository',
        name: 'Delete Repository',
        description: 'Permanently deletes a GitHub repository.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true },
          { name: 'repository', type: 'string', label: 'Repository', description: 'e.g. owner/repo', required: true }
        ]
      },
      {
        id: 'createIssue',
        name: 'Create Issue',
        description: 'Creates a new GitHub issue.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true },
          { name: 'repository', type: 'string', label: 'Repository', description: 'Name of the repository', required: true },
          { name: 'title', type: 'string', label: 'Title', description: 'Title of the new issue', required: true },
          { name: 'body', type: 'string', label: 'Body', description: 'Body of the new issue', required: true }
        ]
      },
      {
        id: 'updateIssue',
        name: 'Update Issue',
        description: 'Updates a GitHub issue.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true },
          { name: 'repository', type: 'string', label: 'Repository', description: 'Name of the repository', required: true },
          { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to update', required: true },
          { name: 'title', type: 'string', label: 'Title', description: 'Title of the issue', required: true },
          { name: 'body', type: 'string', label: 'Body', description: 'Body of the issue', required: true },
          { 
            name: 'state', 
            type: 'select', 
            label: 'State', 
            default: 'open',
            options: [
              { label: 'Open', value: 'open' },
              { label: 'Closed', value: 'closed' }
            ]
          }
        ]
      },
      {
        id : 'closeIssue',
        name: 'Close Issue',
        description: 'Closes a GitHub issue.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true },
          { name: 'repository', type: 'string', label: 'Repository', description: 'Name of the repository', required: true },
          { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to close', required: true }
        ]
      },
      {
        id : 'reOpenIssue',
        name: 'Reopen Issue',
        description: 'Reopens a GitHub issue.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true },
          { name: 'repository', type: 'string', label: 'Repository', description: 'Name of the repository', required: true },
          { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to reopen', required: true }
        ]
      },
      {
        id: 'lock_issue',
        name: 'Lock Issue',
        description: 'Locks a GitHub issue.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true },
          { name: 'repository', type: 'string', label: 'Repository', description: 'Name of the repository', required: true },
          { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to lock', required: true }
        ]
      },
      {
        id: 'unlock_issue',
        name: 'Unlock Issue',
        description: 'Unlocks a GitHub issue.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true },
          { name: 'repository', type: 'string', label: 'Repository', description: 'Name of the repository', required: true },
          { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to unlock', required: true }
        ]
      }
    ]
  },
  {
    id: 'http',
    name: 'HTTP',
    description: 'Send HTTP requests to any API.',
    icon: Globe,
    category: 'utility',
    actions: [
      {
        id: 'request',
        name: 'Send Request',
        description: 'Sends an HTTP request.',
        type: 'action',
        parameters: [
          { name: 'method', type: 'select', label: 'Method', default: 'GET', required: true, options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }, { label: 'PUT', value: 'PUT' }, { label: 'PATCH', value: 'PATCH' }, { label: 'DELETE', value: 'DELETE' }] },
          { name: 'url', type: 'string', label: 'URL', description: 'The URL to send the request to', required: true },
          { name: 'headers', type: 'object', label: 'Headers', description: 'JSON object of request headers' },
          { name: 'body', type: 'object', label: 'Body', description: 'JSON body for the request' }
        ],
        outputSchema: [
          { name: 'status', type: 'number', description: 'HTTP status code' },
          { name: 'data', type: 'object', description: 'Response body' },
          { name: 'headers', type: 'object', description: 'Response headers' }
        ]
      }
    ]
  }
];
