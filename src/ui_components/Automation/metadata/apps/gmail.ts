import { Mail } from "lucide-react";
import type { AppDefinition } from "../types";

export const gmail: AppDefinition = {
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
};
