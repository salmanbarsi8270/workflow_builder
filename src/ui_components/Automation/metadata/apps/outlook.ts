import { Mail } from "lucide-react";
import type { AppDefinition } from "../types";

export const outlook: AppDefinition = {
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
};
