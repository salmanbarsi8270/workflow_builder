import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { API_URL } from '../api/apiurl';
import apiClient from '../api/auth';
import { getServices } from '../api/connectionlist';
import { Bot, Plus, Play, Settings2, Trash2, Terminal, Sparkles, Zap, RefreshCw, Loader2, Globe } from "lucide-react";
import { CustomPagination } from "../Shared/CustomPagination"
import { toast } from 'sonner';
import { cn } from "@/lib/utils";


import type { Agent, ConnectionOption } from './types';
import { RunAgentDialog } from './RunAgentDialog';
import { AgentInfoSheet } from './AgentInfoSheet';
import { CreateAgentDialog } from './CreateAgentDialog';
import { useTheme } from "@/components/theme-provider";
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
  const hasSubagents = (agent.subagents && agent.subagents.length > 0) || (agent.sub_agents && agent.sub_agents.length > 0);
  const subagentsList = agent.subagents || agent.sub_agents || [];

  return (
    <div className={cn("flex flex-col gap-4", level > 0 && "ml-8 border-l border-slate-200 dark:border-white/5 pl-8")}>
      <div
        className="group relative"
        style={{ animationDelay: `${idx * 150}ms` }}
        onClick={() => onCardClick(agent)}
      >
        <div className="relative bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col overflow-hidden group-hover:translate-y-[-4px]">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
               <Bot className="h-6 w-6" style={{ color: '#f97316' }} />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 transparent rounded-full">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase line-clamp-1">
              {agent.name}
            </h3>
            
            <div className="inline-flex px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
               <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                 {agent.model || 'GPT-4o'}
               </span>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
              {agent.instructions || "No instructions provided for this agent."}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-8 py-6 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
               <Terminal className="h-4 w-4 text-slate-300 dark:text-slate-600" />
               <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{agent.tools?.length || 0} tools</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 dark:text-slate-500">2m ago</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => onRunClick(agent, e)}
              disabled={isOpeningRun}
              className="flex-1 h-14 bg-primary hover:bg-primary/80 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isOpeningRun ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              {isOpeningRun ? "Opening..." : "Run"}
            </button>
            <button
              onClick={(e) => onEditClick(agent, e)}
              className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            >
              <Settings2 className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => onPublishClick(agent, e)}
              className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            >
              <Globe className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => onDeleteClick(agent.id, e)}
              disabled={isDeleting}
              className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {hasSubagents && (
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
  const { accentColor } = useTheme();
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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const topLevelAgents = agents.filter(a => !a.parent_agent);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAgents = topLevelAgents.slice(startIndex, startIndex + itemsPerPage);

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
      const response = await apiClient.get(`/api/v1/agents?tree=true`);
      setAgents(Array.isArray(response.data) ? response.data : []);
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
      await apiClient.delete(`/api/v1/agents/${agentId}`);
      toast.success("Agent deleted successfully");
      await fetchAgents();
    } catch (error: any) {
      console.error("Error deleting agent:", error);
      toast.error(error.response?.data?.error || "Failed to delete agent");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateAgent = async (updates: Partial<Agent>) => {
    if (!selectedInfoAgent) return;

    try {
      const response = await apiClient.patch(`/api/v1/agents/${selectedInfoAgent.id}`, updates);
      
      const updatedAgent = response.data;
      // Update local state
      setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
      setSelectedInfoAgent(updatedAgent);
      toast.success("Agent updated");
    } catch (error: any) {
      console.error("Error updating agent:", error);
      toast.error(error.response?.data?.error || "Failed to update agent");
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

  const handleEditClick = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAgent(agent);
    setIsCreateModalOpen(true);
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
    <div className="min-h-full bg-transparent text-slate-900 dark:text-white overflow-y-auto relative animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

      <div className="relative w-full max-w-[90%] mx-auto z-10 p-8 h-full flex flex-col gap-8">
        {/* Header */}
        <div className="mb-4 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
            <div className="flex-1">
              <div className="mb-6">
                <div className="items-center gap-4 mb-3">
                  <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                    AI Agents
                  </h1>
                  <div
                    className="h-1.5 w-12 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
              <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                Create, manage, and deploy autonomous agents for your workflows. These agents can use tools and sub-agents to achieve complex objectives.
              </p>
            </div>
          
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchAgents}
                disabled={isLoading}
                className="h-14 w-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
              >
                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
              </button>
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsCreateModalOpen(true);
                }}
                className="h-14 px-8 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="h-5 w-5" />
                Create Agent
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { 
              label: 'Active Agents', 
              value: activeAgentsCount.toString(), 
              badge: '100%', 
              badgeColor: 'text-emerald-500 bg-emerald-500/10',
              trendIcon: <Zap className="h-3 w-3" />
            },
            { 
              label: 'Total Executions', 
              value: '1,247', 
              badge: 'Today', 
              badgeColor: 'text-blue-500 bg-blue-500/10',
              trendIcon: <Zap className="h-3 w-3" /> 
            },
            { 
              label: 'Success Rate', 
              value: '98.5%', 
              badge: 'Optimized', 
              badgeColor: 'text-orange-500 bg-orange-500/10',
              trendIcon: <Sparkles className="h-3 w-3" /> 
            }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="relative bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm group hover:border-slate-300 dark:hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5", stat.badgeColor)}>
                  {stat.trendIcon}
                  {stat.badge}
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading && [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="relative bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm h-[400px] animate-pulse">
                <div className="flex justify-between items-start mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5" />
                  <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-white/5" />
                </div>
                <div className="space-y-4">
                  <div className="h-8 w-3/4 rounded-lg bg-slate-100 dark:bg-white/5" />
                  <div className="h-6 w-24 rounded-lg bg-slate-100 dark:bg-white/5" />
                  <div className="h-20 w-full rounded-lg bg-slate-100 dark:bg-white/5" />
                </div>
                <div className="mt-auto pt-8 border-t border-slate-100 dark:border-white/5 flex gap-2">
                  <div className="h-14 flex-1 rounded-2xl bg-slate-100 dark:bg-white/5" />
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5" />
                </div>
            </div>
          ))}

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

          {agents.length === 0 && !isLoading && (
            <div className="flex flex-col col-span-3 items-center justify-center p-20 bg-white dark:bg-white/2 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[40px]">
              <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 mb-6">
                <Bot className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">No Agents Found</h1>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Create your first autonomous agent to get started</p>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <CustomPagination
            currentPage={currentPage}
            totalItems={topLevelAgents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
        />
        
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
        />
      </div>
    </div>
  );
}
