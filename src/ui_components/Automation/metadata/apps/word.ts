import { FileText } from "lucide-react";
import type { AppDefinition } from "../types";

export const word: AppDefinition = {
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
};
