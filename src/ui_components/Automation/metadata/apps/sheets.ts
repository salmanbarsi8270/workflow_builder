import { FileSpreadsheet } from "lucide-react";
import type { AppDefinition } from "../types";

export const sheets: AppDefinition = {
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
};
