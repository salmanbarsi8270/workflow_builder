import { Globe } from "lucide-react";
import type { AppDefinition } from "../types";

export const http: AppDefinition = {
  id: 'http',
  name: 'HTTP',
  description: 'Send HTTP requests or receive webhooks.',
  icon: Globe,
  category: 'utility',
  actions: [
    {
      id: 'webhook',
      name: 'Webhook Trigger',
      description: 'Start a workflow by sending data from an external tool.',
      type: 'trigger',
      parameters: [],
      outputSchema: [
          { name: 'body', type: 'object', description: 'Request Body' },
          { name: 'headers', type: 'object', description: 'Request Headers' },
          { name: 'query', type: 'object', description: 'Query Parameters' }
      ]
    },
    {
      id: 'request',
      name: 'Call External API',
      description: 'Make an outgoing HTTP request.',
      type: 'action',
      parameters: [
        { 
          name: 'method', 
          type: 'select', 
          label: 'Method', 
          default: 'GET', 
          required: true, 
          options: [
            { label: 'GET', value: 'GET' }, 
            { label: 'POST', value: 'POST' }, 
            { label: 'PUT', value: 'PUT' }, 
            { label: 'PATCH', value: 'PATCH' }, 
            { label: 'DELETE', value: 'DELETE' }
          ] 
        },
        { 
          name: 'url', 
          type: 'string', 
          label: 'URL', 
          description: 'The URL to send the request to', 
          required: true 
        },
        { 
          name: 'headers', 
          type: 'object', 
          label: 'Headers', 
          description: 'JSON object of request headers' 
        },
        { 
          name: 'body', 
          type: 'object', 
          label: 'Body', 
          description: 'JSON body for the request' 
        }
      ],
      outputSchema: [
        { name: 'status', type: 'number', description: 'HTTP status code' },
        { name: 'data', type: 'object', description: 'Response body' },
        { name: 'headers', type: 'object', description: 'Response headers' }
      ]
    }
  ]
};
