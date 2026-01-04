import { HardDrive } from "lucide-react";
import type { AppDefinition } from "../types";

export const drive: AppDefinition = {
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
};
