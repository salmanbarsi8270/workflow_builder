import { HardDrive } from "lucide-react";
import type { AppDefinition } from "../types";

export const onedrive: AppDefinition = {
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
};
