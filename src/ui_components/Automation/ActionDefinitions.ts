import { Mail, FileSpreadsheet, Clock, HardDrive, FileText, Github, Globe } from "lucide-react";

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'connection' | 'select' | 'object' | 'dynamic-select';
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
  category: 'app' | 'utility';
  actions: ActionDefinition[];
}

export const APP_DEFINITIONS: AppDefinition[] = [
  // --- Logic ---
  {
    id: 'logic',
    name: 'Logic',
    description: 'Control flow logic.',
    icon: HardDrive, // Placeholder icon
    category: 'utility',
    actions: [
      { 
        id: 'condition', 
        name: 'Condition', 
        description: 'Branch the flow based on a condition.', 
        type: 'action',
        parameters: [
             { 
               name: 'condition', 
               type: 'string', 
               label: 'Expression', 
               description: 'e.g. {{step.1.output}} == "true"',
               required: true 
             }
        ]
      },
      { 
        id: 'parallel', 
        name: 'Parallel', 
        description: 'Execute multiple branches in parallel.', 
        type: 'action',
        parameters: [
             { 
               name: 'branches', 
               type: 'array', 
               label: 'Branches', 
               description: 'Define the branches to execute.',
               required: true,
               default: ['Branch 1', 'Branch 2']
             }
        ]
      },

      {
        id: 'loop',
        name: 'Loop on Items',
        description: 'Iterate over a list of items.',
        type: 'action',
        parameters: [
             { 
               name: 'items', 
               type: 'string', // Changed to string to allow {{vars}} or static JSON "[1,2]"
               label: 'Items', 
               description: 'List of items to iterate over (e.g. {{trigger.body.items}} or ["a", "b"])',
               required: true
             }
        ]
      },
    ]
  },

  // --- Utilities ---
  {
    id: 'utility',
    name: 'Utility',
    description: 'Generic workflow utilities.',
    icon: HardDrive,
    category: 'utility',
    actions: [
      {
        id: 'wait',
        name: 'Wait',
        description: 'Pause the workflow for a duration or approval.',
        type: 'action',
        parameters: [
            {
                name: 'waitType',
                type: 'select',
                label: 'Wait Type',
                default: 'delay',
                required: true,
                options: [
                    { label: 'Time Delay', value: 'delay' },
                    { label: 'Wait for Approval', value: 'approval' }
                ]
            },
            {
                name: 'delayDuration',
                type: 'number',
                label: 'Duration',
                description: 'Amount of time to wait.',
                required: true,
                dependsOn: { field: 'waitType', value: 'delay' }
            },
            {
                name: 'delayUnit',
                type: 'select',
                label: 'Unit',
                default: 'seconds',
                required: true,
                dependsOn: { field: 'waitType', value: 'delay' },
                options: [
                    { label: 'Seconds', value: 'seconds' },
                    { label: 'Minutes', value: 'minutes' },
                    { label: 'Hours', value: 'hours' },
                    { label: 'Days', value: 'days' }
                ]
            },
            {
                name: 'approvers',
                type: 'string', // generic string for now, could be array of emails
                label: 'Approvers',
                description: 'Comma separated emails (Optional)',
                dependsOn: { field: 'waitType', value: 'approval' }
            }
        ]
      },
      {
        id: 'log',
        name: 'Log',
        description: 'Log a message to the run console.',
        type: 'action',
        parameters: [
          { name: 'message', type: 'string', label: 'Message', required: true }

        ]
      }
    ]
  },

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
             { name: 'connection', type: 'connection', label: 'Gmail Connection', required: true },
             { 
               name: 'folder', 
               type: 'dynamic-select', 
               label: 'Folder', 
               default: 'INBOX',
               required: true,
               dynamicOptions: { action: 'listLabels' }
             },
             { name: 'q', type: 'string', label: 'Search Query', description: 'Optional. e.g. "from:boss@example.com"' }
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
        id: 'listLabels',
        name: 'List Labels',
        description: 'Lists all available Gmail labels.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'Gmail Connection', required: true }
        ],
        outputSchema: [
          { name: 'labels', type: 'array', items: { name: 'label', type: 'object', properties: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' }
          ]}}
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
            { 
              name: 'spreadsheetId', 
              type: 'dynamic-select', 
              label: 'Spreadsheet', 
              description: 'The spreadsheet to append to.', 
              required: true,
              dynamicOptions: { action: 'listSpreadsheets' }
            },
            { 
              name: 'range', 
              type: 'dynamic-select', 
              label: 'Sheet', 
              description: 'The sheet to append to.', 
              required: true,
              dynamicOptions: { action: 'listSheets', dependsOn: ['spreadsheetId'] }
            },
            { name: 'values', type: 'array', label: 'Values', description: 'List of values for the row (e.g., ["Data 1", "Data 2"]).', required: true }
        ],
        outputSchema: [
          { name: 'spreadsheetId', type: 'string' },
          { name: 'tableRange', type: 'string' },
          { name: 'updates', type: 'object', properties: [
            { name: 'updatedRange', type: 'string' },
            { name: 'updatedRows', type: 'number' },
            { name: 'updatedColumns', type: 'number' },
            { name: 'updatedCells', type: 'number' }
          ]}
        ]
      },
      { 
        id: 'appendRowSmart', 
        name: 'Append Row Smart', 
        description: 'Similar to appendRow, but automatically creates the worksheet if it doesn\'t exist.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Sheets Connection', required: true },
            { 
              name: 'spreadsheetId', 
              type: 'dynamic-select', 
              label: 'Spreadsheet', 
              description: 'The spreadsheet to append to.', 
              required: true,
              dynamicOptions: { action: 'listSpreadsheets' }
            },
            { name: 'range', type: 'string', label: 'Sheet Name', description: 'The sheet name (will be created if missing).', required: true },
            { name: 'values', type: 'array', label: 'Values', description: 'List of values for the row.', required: true }
        ],
        outputSchema: [
          { name: 'spreadsheetId', type: 'string' },
          { name: 'tableRange', type: 'string' },
          { name: 'updates', type: 'object', properties: [
            { name: 'updatedRange', type: 'string' },
            { name: 'updatedRows', type: 'number' },
            { name: 'updatedColumns', type: 'number' },
            { name: 'updatedCells', type: 'number' }
          ]}
        ]
      },
      { 
        id: 'getValues', 
        name: 'Get Values', 
        description: 'Retrieves values from a specific range.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Sheets Connection', required: true },
            { 
              name: 'spreadsheetId', 
              type: 'dynamic-select', 
              label: 'Spreadsheet', 
              required: true,
              dynamicOptions: { action: 'listSpreadsheets' }
            },
            { 
              name: 'range', 
              type: 'dynamic-select', 
              label: 'Sheet', 
              required: true,
              dynamicOptions: { action: 'listSheets', dependsOn: ['spreadsheetId'] }
            },
        ],
        outputSchema: [
          { name: 'values', type: 'array', items: { name: 'row', type: 'array', items: { name: 'cell', type: 'string' } } }
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
      },
      {
        id: 'listSpreadsheets',
        name: 'List Spreadsheets',
        description: 'Lists all available spreadsheets.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'Google Sheets Connection', required: true }
        ],
        outputSchema: [
          { name: 'files', type: 'array', items: { name: 'file', type: 'object', properties: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' }
          ]}}
        ]
      },
      {
        id: 'listSheets',
        name: 'List Sheets',
        description: 'Lists all sheets in a spreadsheet.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'Google Sheets Connection', required: true },
          { name: 'spreadsheetId', type: 'string', label: 'Spreadsheet ID', required: true }
        ],
        outputSchema: [
          { name: 'sheets', type: 'array', items: { name: 'sheet', type: 'object', properties: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' }
          ]}}
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
        id: 'uploadFile', 
        name: 'Upload File', 
        description: 'Uploads a file to Google Drive.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Drive Connection', required: true },
            { name: 'filename', type: 'string', label: 'Filename', required: true },
            { name: 'content', type: 'string', label: 'Content', required: true },
            { 
              name: 'parent', 
              type: 'dynamic-select', 
              label: 'Parent Folder', 
              description: 'Optional parent folder ID.',
              dynamicOptions: { action: 'listFolders' }
            }
        ]
      },
      { 
        id: 'createFolder', 
        name: 'Create Folder', 
        description: 'Creates a new folder.', 
        type: 'action',
        parameters: [
            { name: 'connection', type: 'connection', label: 'Google Drive Connection', required: true },
            { name: 'name', type: 'string', label: 'Folder Name', description: 'Name of the new folder', required: true },
            { 
              name: 'parent', 
              type: 'dynamic-select', 
              label: 'Parent Folder', 
              description: 'Optional parent folder ID.',
              dynamicOptions: { action: 'listFolders' }
            }
        ],
        outputSchema: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' }
        ]
      },
      {
        id: 'listFolders',
        name: 'List Folders',
        description: 'Lists all available folders in Google Drive.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'Google Drive Connection', required: true }
        ],
        outputSchema: [
          { name: 'folders', type: 'array', items: { name: 'folder', type: 'object', properties: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' }
          ]}}
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
            { 
              name: 'documentId', 
              type: 'dynamic-select', 
              label: 'Document', 
              required: true,
              dynamicOptions: { action: 'listDocs' }
            },
            { name: 'text', type: 'string', label: 'Text', description: 'The text content to append', required: true }
        ],
        outputSchema: [
          { name: 'documentId', type: 'string' }
        ]
      },
      {
        id: 'listDocs',
        name: 'List Documents',
        description: 'Lists all available Google Docs.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'Google Docs Connection', required: true }
        ],
        outputSchema: [
          { name: 'docs', type: 'array', items: { name: 'doc', type: 'object', properties: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' }
          ]}}
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
          { 
            name: 'repository', 
            type: 'dynamic-select', 
            label: 'Repository', 
            description: 'The repository to use.', 
            required: true,
            dynamicOptions: { action: 'listRepos' }
          },
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
          { 
            name: 'repository', 
            type: 'dynamic-select', 
            label: 'Repository', 
            description: 'The repository to use.', 
            required: true,
            dynamicOptions: { action: 'listRepos' }
          },
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
          { 
            name: 'repository', 
            type: 'dynamic-select', 
            label: 'Repository', 
            description: 'The repository to use.', 
            required: true,
            dynamicOptions: { action: 'listRepos' }
          },
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
          { 
            name: 'repository', 
            type: 'dynamic-select', 
            label: 'Repository', 
            description: 'The repository to use.', 
            required: true,
            dynamicOptions: { action: 'listRepos' }
          },
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
          { 
            name: 'repository', 
            type: 'dynamic-select', 
            label: 'Repository', 
            description: 'The repository to use.', 
            required: true,
            dynamicOptions: { action: 'listRepos' }
          },
          { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to unlock', required: true }
        ]
      },
      {
        id: 'listRepos',
        name: 'List Repositories',
        description: 'Lists all available GitHub repositories.',
        type: 'action',
        parameters: [
          { name: 'connection', type: 'connection', label: 'GitHub Connection', required: true }
        ],
        outputSchema: [
          { name: 'repos', type: 'array', items: { name: 'repo', type: 'object', properties: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' }
          ]}}
        ]
      }
    ]
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Send and receive emails via Microsoft Outlook.',
    icon: Mail,
    category: 'app',
    actions: [
      {
        id: 'newEmail',
        name: 'New Email',
        description: 'Triggers when a new email is received.',
        type: 'trigger',
        parameters: [
          { name: 'connection', label: 'Outlook Connection', type: 'connection', required: true },
          { 
            name: 'folder', 
            label: 'Folder', 
            type: 'string', 
            default: 'Inbox',
            required: true,
            description: 'Folder name (e.g., Inbox)'
          }
        ],
        outputSchema: [
          { name: 'id', type: 'string' },
          { name: 'subject', type: 'string' },
          { name: 'from', type: 'string' },
          { name: 'snippet', type: 'string' }
        ]
      },
      {
        id: 'sendEmail',
        name: 'Send Email',
        description: 'Sends an email via Outlook.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Outlook Connection', type: 'connection', required: true },
          { name: 'to', label: 'To', type: 'string', required: true },
          { name: 'subject', label: 'Subject', type: 'string', required: true },
          { name: 'body', label: 'Body', type: 'string', required: true }
        ],
        outputSchema: [
          { name: 'success', type: 'boolean' }
        ]
      },
      {
        id: 'listMessages',
        name: 'List Messages',
        description: 'List recent emails.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Outlook Connection', type: 'connection', required: true },
          { name: 'top', label: 'Top', type: 'number', default: 10 }
        ],
        outputSchema: [
          { name: 'value', type: 'array' }
        ]
      },
      {
        id: 'getProfile',
        name: 'Get Profile',
        description: 'Get current user profile.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Outlook Connection', type: 'connection', required: true }
        ],
        outputSchema: [
          { name: 'displayName', type: 'string' },
          { name: 'mail', type: 'string' }
        ]
      }
    ]
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Manage files and folders in OneDrive.',
    icon: HardDrive,
    category: 'app',
    actions: [
      {
        id: 'newFile',
        name: 'New File',
        description: 'Triggers when a new file is added to a folder.',
        type: 'trigger',
        parameters: [
          { name: 'connection', label: 'OneDrive Connection', type: 'connection', required: true },
          { 
            name: 'folderId', 
            label: 'Folder ID', 
            type: 'string', 
            required: false,
            description: 'Folder ID in OneDrive'
          }
        ],
        outputSchema: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'webUrl', type: 'string' }
        ]
      },
      {
        id: 'listFiles',
        name: 'List Files',
        description: 'Lists files in a OneDrive folder.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'OneDrive Connection', type: 'connection', required: true },
          { 
            name: 'folderId', 
            label: 'Folder ID', 
            type: 'string', 
            required: false, 
            description: 'Leave empty for root'
          }
        ],
        outputSchema: [
          { name: 'files', type: 'array' }
        ]
      },
      {
        id: 'uploadFile',
        name: 'Upload File',
        description: 'Uploads a file to OneDrive.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'OneDrive Connection', type: 'connection', required: true },
          { name: 'fileName', label: 'File Name', type: 'string', required: true },
          { name: 'content', label: 'File Content', type: 'string', required: true },
          { 
            name: 'folderId', 
            label: 'Folder ID', 
            type: 'string', 
            required: false,
            description: 'Target Folder ID'
          },
          { name: 'contentType', label: 'Content Type', type: 'string', required: false, default: 'text/plain' }
        ]
      },
      {
        id: 'downloadFile',
        name: 'Download File',
        description: 'Downloads a file from OneDrive as base64.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'OneDrive Connection', type: 'connection', required: true },
          { 
            name: 'fileId', 
            label: 'File ID', 
            type: 'string', 
            required: true,
            description: 'ID of the file to download'
          }
        ],
        outputSchema: [
          { name: 'content', type: 'string' },
          { name: 'fileName', type: 'string' }
        ]
      },
      {
        id: 'deleteFile',
        name: 'Delete File',
        description: 'Deletes a file from OneDrive.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'OneDrive Connection', type: 'connection', required: true },
           { 
            name: 'fileId', 
            label: 'File ID', 
            type: 'string', 
            required: true,
            description: 'ID of the file to delete'
          }
        ]
      },
      {
        id: 'getProfile',
        name: 'Get Profile',
        description: 'Get user profile.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'OneDrive Connection', type: 'connection', required: true }
        ],
        outputSchema: [
          { name: 'displayName', type: 'string' }
        ]
      }
    ]
  },
  {
    id: 'excel',
    name: 'Excel',
    description: 'Manage spreadsheets in Microsoft Excel.',
    icon: FileSpreadsheet,
    category: 'app',
    actions: [
      {
        id: 'newRow',
        name: 'New Row in Table',
        description: 'Triggers when a new row is added to a table.',
        type: 'trigger',
        parameters: [
          { name: 'connection', label: 'Excel Connection', type: 'connection', required: true },
          { name: 'fileId', label: 'File ID', type: 'string', required: true, description: 'Excel Workbook ID' },
          { name: 'tableName', label: 'Table Name', type: 'string', required: true, description: 'Name of the table' }
        ],
        outputSchema: [
          { name: 'index', type: 'number' },
          { name: 'values', type: 'array' }
        ]
      },
      {
        id: 'createWorkbook',
        name: 'Create Workbook',
        description: 'Creates a new empty Excel workbook.',
        type: 'action',
        parameters: [
            { name: 'connection', label: 'Excel Connection', type: 'connection', required: true },
            { name: 'name', label: 'File Name (e.g. workbook.xlsx)', type: 'string', required: true },
            { name: 'folderId', label: 'Folder ID', type: 'string', required: false, description: 'ID of the parent folder. Defaults to root.' }
        ],
        outputSchema: [
            { name: 'id', type: 'string', description: 'The ID of the created file' },
            { name: 'name', type: 'string', description: 'The name of the created file' },
            { name: 'webUrl', type: 'string', description: 'Link to open the file' }
        ]
      },
      {
        id: 'createWorksheet',
        name: 'Create Worksheet',
        description: 'Adds a new worksheet to an existing workbook.',
        type: 'action',
        parameters: [
            { name: 'connection', label: 'Excel Connection', type: 'connection', required: true },
            { name: 'fileId', label: 'File ID', type: 'string', required: true, description: 'Excel Workbook ID' },
            { name: 'name', label: 'Sheet Name', type: 'string', required: true }
        ],
        outputSchema: [
            { name: 'id', type: 'string', description: 'Sheet ID' },
            { name: 'name', type: 'string', description: 'Sheet Name' },
            { name: 'position', type: 'number', description: 'Position index' }
        ]
      },
      {
        id: 'createTable',
        name: 'Create Table',
        description: 'Creates a table in a worksheet.',
        type: 'action',
        parameters: [
            { name: 'connection', label: 'Excel Connection', type: 'connection', required: true },
            { name: 'fileId', label: 'File ID', type: 'string', required: true, description: 'Excel Workbook ID' },
            { name: 'address', label: 'Range Address (e.g. Sheet1!A1:C5)', type: 'string', required: true },
            { name: 'hasHeaders', label: 'Has Headers', type: 'boolean', required: true, default: true }, 
            { name: 'name', label: 'Table Name', type: 'string', required: false }
        ],
        outputSchema: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'showHeaders', type: 'boolean' },
            { name: 'highlightLastColumn', type: 'boolean' }
        ]
      },
      {
        id: 'addRow',
        name: 'Add Row to Table',
        description: 'Adds a row to a specific Excel table.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Excel Connection', type: 'connection', required: true },
          { name: 'fileId', label: 'File ID', type: 'string', required: true, description: 'Excel Workbook ID' },
          { name: 'tableName', label: 'Table Name', type: 'string', required: true, description: 'Name of the table' },
          { name: 'values', label: 'Row Values (Array)', type: 'array', required: true, description: 'Array of strings/numbers' }
        ],
        outputSchema: [
          { name: 'index', type: 'number', description: 'Index of the added row' },
          { name: 'values', type: 'array', description: 'Values added' }
        ]
      },
      {
        id: 'getRange',
        name: 'Get Range',
        description: 'Gets values from a range of cells.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Excel Connection', type: 'connection', required: true },
          { name: 'fileId', label: 'File ID', type: 'string', required: true, description: 'Excel Workbook ID' },
          { name: 'sheetName', label: 'Sheet Name', type: 'string', required: true },
          { name: 'range', label: 'Range (e.g. A1:B2)', type: 'string', required: true }
        ],
        outputSchema: [
          { name: 'values', type: 'array', description: '2D array of cell values' },
          { name: 'text', type: 'array', description: '2D array of cell text' },
          { name: 'rowCount', type: 'number' },
          { name: 'columnCount', type: 'number' }
        ]
      },
      {
        id: 'updateRange',
        name: 'Update Range',
        description: 'Updates values in a range of cells.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Excel Connection', type: 'connection', required: true },
          { name: 'fileId', label: 'File ID', type: 'string', required: true, description: 'Excel Workbook ID' },
          { name: 'sheetName', label: 'Sheet Name', type: 'string', required: true },
          { name: 'range', label: 'Range (e.g. A1:B2)', type: 'string', required: true },
          { name: 'values', label: 'Values (2D Array)', type: 'array', required: true }
        ],
        outputSchema: [
            { name: 'values', type: 'array' }
        ]
      },
      {
        id: 'getProfile',
        name: 'Get Profile',
        description: 'Get user profile.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Excel Connection', type: 'connection', required: true }
        ],
        outputSchema: [
          { name: 'displayName', type: 'string' }
        ]
      }
    ]
  },
  {
    id: 'word',
    name: 'Word',
    description: 'Create and edit documents in Microsoft Word.',
    icon: FileText,
    category: 'app',
    actions: [
      {
        id: 'getContent',
        name: 'Get Content',
        description: 'Gets the text content of a Word document.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Word Connection', type: 'connection', required: true },
          { name: 'fileId', label: 'Document ID', type: 'string', required: true, description: 'ID of the file to read' }
        ],
        outputSchema: [
          { name: 'content', type: 'string', description: 'The plain text content of the document' }
        ]
      },
      {
        id: 'updateContent',
        name: 'Update Content',
        description: 'Overwrites the content of a Word document.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Word Connection', type: 'connection', required: true },
          { name: 'fileId', label: 'Document ID', type: 'string', required: true, description: 'ID of the file to update' },
          { name: 'content', label: 'Text Content', type: 'string', required: true }
        ],
        outputSchema: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' }
        ]
      },
      {
        id: 'createDocument',
        name: 'Create Document',
        description: 'Creates a new document in OneDrive.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Word Connection', type: 'connection', required: true },
          { name: 'name', label: 'File Name (e.g. document.docx)', type: 'string', required: true },
          { name: 'folderId', label: 'Folder ID', type: 'string', required: false, description: 'Parent folder. Defaults to root.' },
          { name: 'content', label: 'Initial Content', type: 'string', required: false }
        ],
        outputSchema: [
          { name: 'id', type: 'string', description: 'Created File ID' },
          { name: 'name', type: 'string' },
          { name: 'webUrl', type: 'string', description: 'Link to document' }
        ]
      },
      {
        id: 'getProfile',
        name: 'Get Profile',
        description: 'Get user profile.',
        type: 'action',
        parameters: [
          { name: 'connection', label: 'Word Connection', type: 'connection', required: true }
        ],
        outputSchema: [
          { name: 'displayName', type: 'string' },
          { name: 'mail', type: 'string' },
          { name: 'id', type: 'string' }
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
]
