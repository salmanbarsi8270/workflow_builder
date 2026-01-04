import { FileText } from "lucide-react";
import type { AppDefinition } from "../types";

export const docs: AppDefinition = {
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
};
