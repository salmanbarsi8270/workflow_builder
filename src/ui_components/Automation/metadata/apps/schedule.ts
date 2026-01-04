import { Clock } from "lucide-react";
import type { AppDefinition } from "../types";

export const schedule: AppDefinition = {
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
};
