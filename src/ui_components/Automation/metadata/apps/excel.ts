import { FileSpreadsheet } from "lucide-react";
import type { AppDefinition } from "../types";

export const excel: AppDefinition = {
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
};
