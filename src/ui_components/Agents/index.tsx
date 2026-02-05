import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { API_URL } from '../api/apiurl';
import { getServices } from '../api/connectionlist';
import { Bot, Plus, Play, Settings2, Trash2, Terminal, Sparkles, Zap, ChevronRight, Star, RefreshCw, Loader2, Globe } from "lucide-react";
import { CustomPagination } from "../Shared/CustomPagination"
import { Toaster, toast } from 'sonner';
import { cn } from "@/lib/utils";


import type { Agent, ConnectionOption } from './types';
import { RunAgentDialog } from './RunAgentDialog';
import { AgentInfoSheet } from './AgentInfoSheet';
import { CreateAgentDialog } from './CreateAgentDialog';
import { AgentConnectionDialog } from './AgentConnectionDialog';
import { ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/skeleton';
import { type AutomationItem } from '@/ui_components/Automation/components/AutomationList';


interface AgentTreeNodeProps {
  agent: Agent;
  idx: number;
  onCardClick: (agent: Agent) => void;
  onRunClick: (agent: Agent, e: React.MouseEvent) => void;
  onEditClick: (agent: Agent, e: React.MouseEvent) => void;
  onPublishClick: (agent: Agent, e: React.MouseEvent) => void;
  onDeleteClick: (agentId: string, e: React.MouseEvent) => void;
  isDeleting?: boolean;
  isOpeningRun?: boolean;
  level?: number;
}

function AgentTreeNode({ agent, idx, onCardClick, onRunClick, onEditClick, onPublishClick, onDeleteClick, isDeleting, isOpeningRun, level = 0 }: AgentTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubagents = (agent.subagents && agent.subagents.length > 0) || (agent.sub_agents && agent.sub_agents.length > 0);
  const subagentsList = agent.subagents || agent.sub_agents || [];
  const isPublic = agent.visibility === 'public' || (agent as any).is_public;

  return (
    <div className={cn("flex flex-col gap-4", level > 0 && "ml-8 border-l-2 border-slate-200 dark:border-white/5 pl-8")}>
      <div
        className="group relative cursor-pointer"
        style={{ animationDelay: `${idx * 150}ms` }}
        onClick={() => onCardClick(agent)}
      >
        <div className={cn(
          "absolute -inset-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-all duration-500"
        )} />

        <div className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl dark:shadow-2xl group-hover:border-blue-500/30 transition-all duration-300 h-full flex flex-col justify-between overflow-hidden">
          {/* Subtle gradient overlay for public agents in dark mode */}
          {isPublic && <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-fuchsia-500/5 dark:from-purple-500/10 dark:to-fuchsia-500/10 pointer-events-none" />}

          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            {hasSubagents && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            <div className={cn(
              "w-3 h-3 rounded-full shadow-lg",
              isPublic ? "bg-fuchsia-500 shadow-fuchsia-500/50" : "bg-emerald-500"
            )} />
          </div>

          <div className="relative mb-4 shrink-0">
            <div className="relative bg-linear-to-br from-blue-600 to-indigo-600 p-3 rounded-xl w-fit shadow-lg shadow-blue-500/20">
              {isPublic ? <Globe className="h-6 w-6 text-white" /> : <Bot className="h-6 w-6 text-white" />}
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300 line-clamp-1">
            {agent.name}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-xs font-mono text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 truncate max-w-full">
              {agent.model}
            </div>
            {(agent.visibility === 'public' || (agent as any).is_public) && (
              <div className="px-2 py-1 bg-purple-100 dark:bg-purple-500/10 rounded-lg text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 uppercase tracking-tighter flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Public
              </div>
            )}
            {agent.parent_agent && (
              <div className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 uppercase tracking-tighter">
                Sub-Agent
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300 flex-1">
            {agent.instructions}
          </p>

          <div className="flex items-center justify-between mb-4 mt-auto">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Terminal className="h-3 w-3" />
              <span>{agent.tools?.length || 0} tools</span>
            </div>
            {hasSubagents && (
              <div className="flex items-center gap-2 text-xs text-blue-500 font-bold">
                <Bot className="h-3 w-3" />
                <span>{subagentsList.length} sub-agents</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 relative z-20">
            <button
              onClick={(e) => onRunClick(agent, e)}
              disabled={isOpeningRun}
              className="flex-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isOpeningRun ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isOpeningRun ? "Opening..." : "Run"}
            </button>
            <button
              onClick={(e) => onEditClick(agent, e)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 px-3 py-2 rounded-lg transition-all duration-300 hover:border-blue-500/30 text-slate-600 dark:text-white"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onPublishClick(agent, e)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 px-3 py-2 rounded-lg transition-all duration-300 hover:border-blue-500/30 text-blue-600 dark:text-blue-400"
              title="Publish Settings"
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onDeleteClick(agent.id, e)}
              disabled={isDeleting}
              className="bg-slate-100 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/20 border border-slate-200 dark:border-white/10 hover:border-red-500/30 px-3 py-2 rounded-lg transition-all duration-300 text-red-500 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && hasSubagents && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {subagentsList.map((sub, sidx) => (
            <AgentTreeNode
              key={sub.id}
              agent={sub}
              idx={sidx}
              level={level + 1}
              onCardClick={onCardClick}
              onRunClick={onRunClick}
              onEditClick={onEditClick}
              onPublishClick={onPublishClick}
              onDeleteClick={onDeleteClick}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Agents() {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [aiConnections, setAiConnections] = useState<ConnectionOption[]>([]);
  const [allConnections, setAllConnections] = useState<ConnectionOption[]>([]);
  const [workflows, setWorkflows] = useState<AutomationItem[]>([]);

  // Dialog States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);

  // Selected Agents for Actions
  const [selectedRunAgent, setSelectedRunAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedInfoAgent, setSelectedInfoAgent] = useState<Agent | null>(null);
  const [infoSheetTab, setInfoSheetTab] = useState<'details' | 'publish'>('details');
  const [isOpeningRun, setIsOpeningRun] = useState<string | null>(null);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'public'>('all');

  const filteredAgents = agents.filter(a => {
    if (a.parent_agent) return false; // Filter out subagents from main list
    if (activeTab === 'all') return true;
    const isPublic = a.visibility === 'public' || (a as any).is_public;
    if (activeTab === 'public') return isPublic;
    if (activeTab === 'private') return !isPublic;
    return true;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

  // console.log("agents", agents);
  useEffect(() => {
    fetchAgents();
    if (user?.id) {
      loadConnections();
      fetchWorkflows();
    }
  }, [user?.id]);


  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/agents?userId=${user?.id}&tree=true`);
      if (response.ok) {
        const data = await response.json();
        setAgents(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch agents");
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/workflows/tools?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        // console.log("raw workflows data", data);
        const fetchedWorkflows = Array.isArray(data) ? data : data.workflows || [];
        // Normalize status field if it's coming as is_active from backend
        const normalized = fetchedWorkflows.map((wf: any) => ({
          ...wf,
          status: wf.status !== undefined ? wf.status : (wf.is_active !== undefined ? wf.is_active : true)
        }));
        setWorkflows(normalized);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const loadConnections = async (showToast = false) => {
    if (showToast) toast.success("Refreshing connections...");
    try {
      if (!user?.id) return;
      const data = await getServices(user.id);
      const services = data.data || [];
      const aiOptions: ConnectionOption[] = [];
      const allOptions: ConnectionOption[] = [];

      services.forEach((service: any) => {
        const isOpenRouter = (service.id === 'openrouter') ||
          (service.name && service.name.toLowerCase().includes('openrouter')) ||
          (service.name === 'AI');

        if (service.accounts && Array.isArray(service.accounts)) {
          service.accounts.forEach((acc: any) => {
            const option = {
              id: acc.id,
              name: acc.username || acc.id,
              service: service.id
            };
            allOptions.push(option);
            if (isOpenRouter) {
              aiOptions.push(option);
            }
          });
        }
      });
      setAiConnections(aiOptions);
      setAllConnections(allOptions);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast.error("Failed to load connections");
    }
  };

  const handleCreateSuccess = (savedAgent: Agent, isEdit: boolean) => {
    if (isEdit) {
      setAgents(agents.map(a => a.id === savedAgent.id ? savedAgent : a));
    } else {
      setAgents([savedAgent, ...agents]);
    }
  };

  const handleDeleteAgent = async (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;

    setDeletingId(agentId);
    try {
      const response = await fetch(`${API_URL}/api/v1/agents/${agentId}?userId=${user?.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: user?.id }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success("Agent deleted successfully");
        await fetchAgents();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to delete agent");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateAgent = async (updates: Partial<Agent>) => {
    if (!selectedInfoAgent) return;
    setIsUpdatingAgent(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/agents/${selectedInfoAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId: user?.id })
      });

      if (response.ok) {
        const updatedAgent = await response.json();
        // Update local state
        setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
        setSelectedInfoAgent(updatedAgent);
        toast.success("Agent updated");
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to update agent");
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Failed to update agent");
    } finally {
      setIsUpdatingAgent(false);
    }
  };

  const handleRunClick = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpeningRun(agent.id);

    try {
      // 1. Filter workflow tools
      const workflowTools = (agent.tools || []).filter(
        (tool: any) => tool.type === "workflow"
      );

      // 2. Validate each workflow
      for (const tool of workflowTools) {
        const workflowId = tool.workflowId || (tool as any).workflow_id;

        const workflow = workflows.find(
          (w) => String(w.id) === String(workflowId)
        );

        // We normalized status in fetchWorkflows, so it's our source of truth
        const isActive = workflow?.status;

        // ❌ Workflow missing or inactive
        if (!workflow || isActive === false) {
          toast.error("This agent uses an inactive workflow. Please activate it first.");
          return;
        }
      }

      // ✅ All workflows are active
      setSelectedRunAgent(agent);
      setIsRunModalOpen(true);

    } catch (error: any) {
      console.error("Agent run blocked:", error);
      toast.error(error.message || "Unable to run agent");

    } finally {
      setIsOpeningRun(null);
    }
  };

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configAgent, setConfigAgent] = useState<Agent | null>(null);

  const handleEditClick = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if user is owner
    const isOwner = user?.id && (agent.userId === user.id || (agent as any).user_id === user.id);

    if (!isOwner && (agent.visibility === 'public' || (agent as any).is_public)) {
      // Open Config Dialog for Public Agents not owned by user
      setConfigAgent(agent);
      setIsConfigModalOpen(true);
    } else {
      // Standard Edit for Owner
      setEditingAgent(agent);
      setIsCreateModalOpen(true);
    }
  };

  const handleCardClick = (agent: Agent) => {
    setSelectedInfoAgent(agent);
    setInfoSheetTab('details');
    setIsInfoSheetOpen(true);
  };

  const handlePublishClick = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInfoAgent(agent);
    setInfoSheetTab('publish');
    setIsInfoSheetOpen(true);
  };

  // Mock stats - in real app calculate from data
  // Using active agent count from real data for the first stat
  const activeAgentsCount = agents.length; // Assuming all listed are "active" for now

  return (
    <div className="min-h-full bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-y-scroll relative">

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(59,130,246,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.03)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 container mx-auto p-8 w-full flex flex-col min-h-full">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center justify-between mb-6">
            {/* ... header content ... */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-20" />
                <div className="relative bg-linear-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-xl">
                  <Bot className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black bg-linear-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-2">
                  AI Agents
                </h1>
                <p className="text-lg text-slate-600 dark:text-blue-200/70 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create, manage, and deploy autonomous agents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAgents}
                disabled={isLoading}
                className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 group"
              >
                <RefreshCw className={cn("h-5 w-5 text-blue-600 dark:text-blue-400", isLoading && "animate-spin")} />
              </button>
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsCreateModalOpen(true);
                }}
                className="group relative px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5" />
                  Create Agent
                </div>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10">
              {(['all', 'public', 'private'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize",
                    activeTab === tab
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {tab} Agents
                </button>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Active Agents', value: activeAgentsCount.toString(), icon: Zap, color: 'from-blue-500 to-indigo-500' },
              { label: 'Total Executions', value: '1,247', icon: Terminal, color: 'from-blue-500 to-cyan-500' },
              { label: 'Success Rate', value: '98.5%', icon: Star, color: 'from-emerald-500 to-teal-500' }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="relative group cursor-pointer"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-linear-to-r ${stat.color} rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                <div className="relative bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-blue-300 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500 dark:text-blue-200/70">{stat.label}</span>
                    <stat.icon className={`h-4 w-4 bg-linear-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="group relative">
              <div className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl 
                  border border-slate-200 dark:border-white/10 rounded-2xl p-6 
                  shadow-xl h-full flex flex-col justify-between min-h-[300px]">

                {/* Status dot */}
                <div className="absolute top-4 right-4">
                  <Skeleton className="h-3 w-3 rounded-full bg-slate-200 dark:bg-white/10" />
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <Skeleton className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-white/10" />
                </div>

                {/* Title */}
                <Skeleton className="h-6 w-3/4 mb-2 bg-slate-200 dark:bg-white/10" />

                {/* Model tag */}
                <Skeleton className="h-5 w-24 rounded-lg mb-3 bg-slate-200 dark:bg-white/10" />

                {/* Description */}
                <Skeleton className="h-4 w-full mb-2 bg-slate-200 dark:bg-white/10" />
                <Skeleton className="h-4 w-5/6 mb-6 bg-slate-200 dark:bg-white/10" />

                {/* Footer */}
                <div className="flex justify-between items-center mt-auto mb-4">
                  <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-white/10" />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-lg bg-slate-200 dark:bg-white/10" />
                  <Skeleton className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-white/10" />
                  <Skeleton className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            </div>
          ))}

          {agents.length === 0 && !isLoading && (
            <div className="flex flex-col col-span-3 items-center justify-center h-[300px]">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">No Agents Found</h1>
              <p className="text-slate-500 dark:text-blue-200/70">Create an agent to get started</p>
            </div>
          )}

          {!isLoading && paginatedAgents.map((agent, idx) => (
            <AgentTreeNode
              key={agent.id}
              agent={agent}
              idx={idx}
              onCardClick={handleCardClick}
              onRunClick={handleRunClick}
              onEditClick={handleEditClick}
              onPublishClick={handlePublishClick}
              onDeleteClick={handleDeleteAgent}
              isDeleting={deletingId === agent.id}
              isOpeningRun={isOpeningRun === agent.id}
            />
          ))}

          {/* Add New Card */}
          {/* <div 
            className="group relative cursor-pointer" 
            style={{ animationDelay: '450ms' }}
            onClick={() => {
                setEditingAgent(null);
                setIsCreateModalOpen(true);
            }}
          >
            <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-all duration-500" />
            <div className="relative h-full bg-slate-50/50 dark:bg-linear-to-br dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-xl border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] group-hover:border-blue-500/30 transition-all duration-300">
              <div className="relative mb-4">
                <div className="relative bg-linear-to-br from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg shadow-blue-500/20">
                  <Plus className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Create New Agent</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Build a custom AI agent with specific capabilities
              </p>
            </div>
          </div> */}
        </div>
      </div>

      {/* Cursor Glow */}
      {/* <div 
        className="pointer-events-none fixed w-96 h-96 rounded-full bg-purple-500/10 blur-3xl transition-all duration-300 ease-out z-0"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      /> */}

      {/* Components */}
      <CreateAgentDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        initialAgent={editingAgent}
        userId={user?.id}
        connections={aiConnections}
        mcpConnections={allConnections.filter(c => c.service === 'mcp')}
        onSuccess={handleCreateSuccess}
        availableAgents={agents}
        availableWorkflows={workflows}
        onRefreshConnections={() => loadConnections(true)}
      />

      {configAgent && (
        <AgentConnectionDialog
          open={isConfigModalOpen}
          onOpenChange={(val) => {
            setIsConfigModalOpen(val);
            if (!val) setConfigAgent(null);
          }}
          agent={configAgent}
          onSaved={() => {
            setIsConfigModalOpen(false);
            setConfigAgent(null);
            toast.success("Connection configuration saved");
          }}
        />
      )}

      <RunAgentDialog
        agent={selectedRunAgent}
        open={isRunModalOpen}
        onOpenChange={setIsRunModalOpen}
        userId={user?.id}
      />

      <AgentInfoSheet
        agent={selectedInfoAgent}
        open={isInfoSheetOpen}
        onOpenChange={setIsInfoSheetOpen}
        initialTab={infoSheetTab}
        connections={allConnections}
        onRun={(a) => {
          setSelectedRunAgent(a);
          setIsRunModalOpen(true);
        }}
        onUpdate={handleUpdateAgent}
        isUpdating={isUpdatingAgent}
      />

      {/* Pagination Footer */}
      <CustomPagination
        currentPage={currentPage}
        totalItems={filteredAgents.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <Toaster />
    </div>
  );
}
