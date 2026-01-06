import { Github } from "lucide-react";
import type { AppDefinition } from "../types";

export const github: AppDefinition = {
  id: 'github',
  name: 'GitHub',
  description: 'Interact with GitHub repositories.',
  icon: Github,
  category: 'app',
  actions: [
    { 
      id: 'createRepository', 
      name: 'Create Repository', 
      description: 'Creates a new GitHub repository.', 
      type: 'action',
      parameters: [
           { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true },
           { name: 'name', type: 'string', label: 'Name', description: 'Name of the new repository', required: true },
           { name: 'description', type: 'string', label: 'Description', description: 'Optional description' },
           { name: 'private', type: 'boolean', label: 'Private', default: false }
      ]
    },
    {
      id: 'delete_repository',
      name: 'Delete Repository',
      description: 'Permanently deletes a GitHub repository.',
      type: 'action',
      parameters: [
        { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true },
        { 
          name: 'repository', 
          type: 'dynamic-select', 
          label: 'Repository', 
          description: 'The repository to use.', 
          required: true,
          dynamicOptions: { action: 'listRepos' }
        },
      ]
    },
    {
      id: 'createIssue',
      name: 'Create Issue',
      description: 'Creates a new GitHub issue.',
      type: 'action',
      parameters: [
        { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true },
        { name: 'repository', type: 'string', label: 'Repository', description: 'Name of the repository', required: true },
        { name: 'title', type: 'string', label: 'Title', description: 'Title of the new issue', required: true },
        { name: 'body', type: 'string', label: 'Body', description: 'Body of the new issue', required: true }
      ]
    },
    {
      id: 'updateIssue',
      name: 'Update Issue',
      description: 'Updates a GitHub issue.',
      type: 'action',
      parameters: [
        { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true },
        { name: 'repository', type: 'string', label: 'Repository', description: 'Name of the repository', required: true },
        { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to update', required: true },
        { name: 'title', type: 'string', label: 'Title', description: 'Title of the issue', required: true },
        { name: 'body', type: 'string', label: 'Body', description: 'Body of the issue', required: true },
        { 
          name: 'state', 
          type: 'select', 
          label: 'State', 
          default: 'open',
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' }
          ]
        }
      ]
    },
    {
      id : 'closeIssue',
      name: 'Close Issue',
      description: 'Closes a GitHub issue.',
      type: 'action',
      parameters: [
        { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true },
        { 
          name: 'repository', 
          type: 'dynamic-select', 
          label: 'Repository', 
          description: 'The repository to use.', 
          required: true,
          dynamicOptions: { action: 'listRepos' }
        },
        { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to close', required: true }
      ]
    },
    {
      id : 'reOpenIssue',
      name: 'Reopen Issue',
      description: 'Reopens a GitHub issue.',
      type: 'action',
      parameters: [
        { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true },
        { 
          name: 'repository', 
          type: 'dynamic-select', 
          label: 'Repository', 
          description: 'The repository to use.', 
          required: true,
          dynamicOptions: { action: 'listRepos' }
        },
        { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to reopen', required: true }
      ]
    },
    {
      id: 'lock_issue',
      name: 'Lock Issue',
      description: 'Locks a GitHub issue.',
      type: 'action',
      parameters: [
        { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true },
        { 
          name: 'repository', 
          type: 'dynamic-select', 
          label: 'Repository', 
          description: 'The repository to use.', 
          required: true,
          dynamicOptions: { action: 'listRepos' }
        },
        { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to lock', required: true }
      ]
    },
    {
      id: 'unlock_issue',
      name: 'Unlock Issue',
      description: 'Unlocks a GitHub issue.',
      type: 'action',
      parameters: [
        { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true },
        { 
          name: 'repository', 
          type: 'dynamic-select', 
          label: 'Repository', 
          description: 'The repository to use.', 
          required: true,
          dynamicOptions: { action: 'listRepos' }
        },
        { name: 'issueNumber', type: 'number', label: 'Issue Number', description: 'Number of the issue to unlock', required: true }
      ]
    },
    {
      id: 'listRepos',
      name: 'List Repositories',
      description: 'Lists all available GitHub repositories.',
      type: 'action',
      parameters: [
        { name: 'authId', type: 'connection', label: 'GitHub Connection', required: true }
      ],
      outputSchema: [
        { name: 'repos', type: 'array', items: { name: 'repo', type: 'object', properties: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' }
        ]}}
      ]
    }
  ]
};
