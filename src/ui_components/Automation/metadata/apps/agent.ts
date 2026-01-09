import { Bot } from "lucide-react";
import type { AppDefinition } from "../types";

export const agent: AppDefinition = {
  id: 'agent',
  name: 'Agent',
  description: 'AI Agents can perform complex tasks, use tools, and collaborate with other agents.',
  icon: Bot,
  category: 'agent',
  actions: [
    {
      id: 'runAgent',
      name: 'Run Agent',
      description: 'Execute a pre-configured AI Agent.',
      type: 'action',
      parameters: [
        { name: 'connection', type: 'connection', label: 'AI Service Connection', required: true },
        { name: 'agentId', type: 'agent', label: 'Select Agent', required: true },
        { name: 'input', type: 'string', label: 'User Input', required: true, description: 'The prompt for the agent.' }
      ],
      outputSchema: [
        { name: 'response', type: 'string', description: 'The agent response.' }
      ]
    }
  ]
};
