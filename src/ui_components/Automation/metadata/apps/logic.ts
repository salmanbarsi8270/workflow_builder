import { HardDrive } from "lucide-react";
import type { AppDefinition } from "../types";

export const logic: AppDefinition = {
  id: 'logic',
  name: 'Logic',
  description: 'Control flow logic.',
  icon: HardDrive,
  category: 'utility',
  actions: [
    { 
      id: 'condition', 
      name: 'Condition', 
      description: 'Branch the flow based on a condition.', 
      type: 'action',
      parameters: [
           { 
             name: 'condition', 
             type: 'string', 
             label: 'Expression', 
             description: 'e.g. {{step.1.output}} == "true"',
             required: true 
           }
      ]
    },
    { 
      id: 'parallel', 
      name: 'Parallel', 
      description: 'Execute multiple branches in parallel.', 
      type: 'action',
      parameters: [
           { 
             name: 'branches', 
             type: 'array', 
             label: 'Branches', 
             description: 'Define the branches to execute.',
             required: true,
             default: ['Branch 1', 'Branch 2']
           }
      ]
    },
    {
      id: 'loop',
      name: 'Loop on Items',
      description: 'Iterate over a list of items.',
      type: 'action',
      parameters: [
           { 
             name: 'items', 
             type: 'string',
             label: 'Items', 
             description: 'List of items to iterate over (e.g. {{trigger.body.items}} or ["a", "b"])',
             required: true
           }
      ]
    },
  ]
};
