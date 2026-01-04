import { HardDrive } from "lucide-react";
import type { AppDefinition } from "../types";

export const utility: AppDefinition = {
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
              type: 'string',
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
};
