import { Sparkles } from "lucide-react";
import type { AppDefinition } from "../types";

export const openrouter: AppDefinition = {
  id: 'openrouter',
  name: 'AI',
  description: 'AI, Agents, and Tools work together to understand inputs, make decisions, and take actions automatically.They power intelligent workflows by combining reasoning, planning, and real-world execution.',
  icon: Sparkles,
  category: 'app',
  actions: [
    {
      id: 'chat',
      name: 'Ask with AI',
      description: 'Generate a chat completion using an LLM.',
      type: 'action',
      parameters: [
        { name: 'connection', type: 'connection', label: 'OpenRouter Connection', required: true },
        { 
            name: 'model', 
            type: 'string', 
            label: 'Model', 
            default: 'openai/gpt-3.5-turbo',
            description: 'The model ID (e.g., anthropic/claude-3-opus, google/gemini-pro)',
            required: true 
        },
        { 
            name: 'messages', 
            type: 'string', // Using string for now, could be improved to array/json editor? Or is it prompt?
            label: 'Messages / Prompt', 
            description: 'The system/user messages or prompt.',
            required: true 
        },
        { name: 'temperature', type: 'number', label: 'Temperature', default: 0.7 },
        { name: 'max_tokens', type: 'number', label: 'Max Tokens' }
      ],
      outputSchema: [
        { name: 'response', type: 'string', description: 'The generated response text.' },
        { name: 'usage', type: 'object', properties: [
            { name: 'prompt_tokens', type: 'number' },
            { name: 'completion_tokens', type: 'number' },
            { name: 'total_tokens', type: 'number' }
        ]}
      ]
    },
    {
      id: 'listModels',
      name: 'List Models',
      description: 'Fetch available models from OpenRouter.',
      type: 'action',
      parameters: [
        { name: 'connection', type: 'connection', label: 'OpenRouter Connection', required: true }
      ],
      outputSchema: [
        { name: 'models', type: 'array', description: 'List of model objects.' }
      ]
    }
  ]
};
