# Dynamic Chat Design System - User Access Guide

## Overview

This document explains how the dynamic chat design system works and how users can access agents with their custom-designed UIs.

---

## 1. Creating a Dynamic UI Design

When creating an agent, you can design a custom chat interface through the **UI Designer** component integrated into the `CreateAgentDialog`.

### UI Designer Features

The UI Designer allows you to:

- **Choose a Template**: Select from pre-built templates (chat, form, dashboard, etc.)
- **Customize Colors**: Configure primary, secondary, background, and text colors
- **Customize Typography**: Select fonts for headings and body text
- **Add Custom CSS**: Apply additional styling if needed
- **Live Preview**: See changes in real-time across different device sizes

### UI Configuration Storage

The UI configuration is stored in the `ui_config` field of the agent record:

```typescript
{
  template_id: string,
  colors: {
    primary: string,
    secondary: string,
    background: string,
    text: string
  },
  fonts: {
    heading: string,
    body: string
  },
  customCss?: string
}
```

---

## 2. How Users Access the Agent's Custom UI

There are **two primary approaches** to enable user access to custom-designed agent interfaces:

### Option A: Dynamic Route (Recommended)

Create a dedicated route for each agent that renders their custom UI.

**Route Pattern:**
```
/agent/:agentId/chat
```

**Workflow:**

1. User navigates to `/agent/123/chat`
2. Application fetches the agent's data including `ui_config`
3. Dynamic chat component loads and applies styles from `ui_config`
4. Chat interface renders with the agent's custom design

**Benefits:**
- Direct access via URL
- Easy sharing and bookmarking
- SEO-friendly
- Full control over the experience

### Option B: Embeddable Chat Widget

Generate an embeddable widget that users can add to external websites.

**Widget Code:**
```html
<iframe 
  src="https://your-app.com/widget/:agentId" 
  width="400" 
  height="600"
  frameborder="0">
</iframe>
```

**Benefits:**
- Can be embedded anywhere
- Isolated from parent page
- Portable across platforms
- White-label capability

---

## 3. Implementation Architecture

### Frontend Route Implementation

**Dynamic Chat Route** (`/agent/:agentId/chat`):

```typescript
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

function AgentChatPage() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  
  useEffect(() => {
    // Fetch agent configuration
    fetch(`${API_URL}/api/v1/agents/${agentId}`)
      .then(res => res.json())
      .then(data => setAgent(data));
  }, [agentId]);
  
  if (!agent) return <div>Loading...</div>;
  
  return (
    <ChatInterface 
      agentId={agentId}
      uiConfig={agent.ui_config}
    />
  );
}
```

### Dynamic Styling Application

**CSS Variables Approach:**

```typescript
function ChatInterface({ agentId, uiConfig }) {
  return (
    <div 
      className="chat-container"
      style={{
        '--primary-color': uiConfig.colors.primary,
        '--secondary-color': uiConfig.colors.secondary,
        '--background-color': uiConfig.colors.background,
        '--text-color': uiConfig.colors.text,
        '--font-heading': uiConfig.fonts.heading,
        '--font-body': uiConfig.fonts.body,
      }}
    >
      {uiConfig.customCss && (
        <style>{uiConfig.customCss}</style>
      )}
      
      {/* Chat UI components */}
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </div>
  );
}
```

### Template-Based Rendering

**Template Loader:**

```typescript
const TEMPLATES = {
  'chat': ChatTemplate,
  'form': FormTemplate,
  'dashboard': DashboardTemplate,
};

function DynamicUIRenderer({ templateId, uiConfig, agentId }) {
  const TemplateComponent = TEMPLATES[templateId] || ChatTemplate;
  
  return (
    <TemplateComponent 
      uiConfig={uiConfig}
      agentId={agentId}
    />
  );
}
```

---

## 4. Current Implementation Status

### ✅ Completed Components

- **UI Designer Component**: Visual interface for customizing agent UIs
- **Backend API**: `/api/v1/ui-designs` endpoints for CRUD operations
- **Database Schema**: `ui_designs` table with proper structure
- **Agent Integration**: `ui_config` field in agents table
- **Admin Interface**: UI Designer integrated into agent creation flow

### ❌ Missing Components

- **Public-facing route**: Users cannot currently access custom-designed agent UIs
- **Dynamic chat component**: No component exists to render `ui_config` styles at runtime
- **Widget generator**: No embeddable widget option available
- **Public access control**: Need to determine authentication/authorization for agent access

---

## 5. Implementation Roadmap

### Phase 1: Basic Dynamic Route

1. Create `/agent/:agentId/chat` route
2. Build `DynamicChatInterface` component
3. Implement CSS variable injection for styling
4. Test with existing agent configurations

### Phase 2: Template System

1. Create base template components (Chat, Form, Dashboard)
2. Implement template selector logic
3. Add template-specific styling and layouts
4. Test all templates with various configurations

### Phase 3: Widget System

1. Create `/widget/:agentId` route
2. Build lightweight widget version
3. Implement iframe embed code generator
4. Add widget customization options

### Phase 4: Advanced Features

1. Add public/private agent settings
2. Implement access controls and permissions
3. Add analytics and usage tracking
4. Enable custom domain mapping

---

## 6. Access Control Strategies

### Public Agents
- No authentication required
- Accessible via direct URL or widget
- Ideal for customer support, lead generation

### Private Agents
- Require user authentication
- Accessible only to authorized users
- Ideal for internal tools, team collaboration

### Authenticated Agents
- Optional authentication
- Different experience for logged-in vs anonymous users
- Ideal for SaaS applications

---

## 7. Example User Flows

### Flow 1: Admin Creates Agent with Custom UI

1. Admin navigates to "Create Agent" dialog
2. Configures agent settings (name, model, prompts)
3. Opens "Design" tab in the dialog
4. Uses UI Designer to customize appearance
5. Saves agent (including `ui_config`)

### Flow 2: End User Accesses Agent

1. End user receives URL: `https://app.com/agent/123/chat`
2. Browser loads the dynamic chat route
3. Application fetches agent configuration
4. Custom UI renders with configured colors/fonts/template
5. User interacts with the agent through custom interface

### Flow 3: Website Embed

1. Admin copies embed code from agent settings
2. Pastes code into their website
3. Widget loads in iframe with custom design
4. Visitors interact with agent without leaving the site

---

## 8. Next Steps

To make the dynamic UI system fully functional, you should:

1. **Implement the dynamic chat route** that renders custom UIs
2. **Create a reusable chat component** that applies `ui_config` styles
3. **Build an embeddable widget** for external websites (optional)
4. **Add access control** to determine who can use which agents
5. **Test thoroughly** with various configurations and templates

---

## Technical Stack Reference

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (dual-database setup)
- **Styling**: CSS Variables + Custom CSS injection
- **Routing**: React Router v6

---

## Additional Resources

- UI Designer Component: `src/ui_components/UIDesigner/`
- Agent Creation Dialog: `src/ui_components/Agents/CreateAgentDialog.tsx`
- Backend Controllers: `workflow_builder_backend-/src/Voltagent/controllers/UIDesignController.ts`
- Database Migrations: `workflow_builder_backend-/src/migrations/`

---

**Last Updated**: January 15, 2026
