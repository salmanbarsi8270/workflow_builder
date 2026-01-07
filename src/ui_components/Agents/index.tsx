import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { API_URL } from '../api/apiurl';
import { getServices } from '../api/connectionlist';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bot, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { Agent, ConnectionOption } from './types';
import { AgentCard } from './AgentCard';
import { RunAgentDialog } from './RunAgentDialog';
import { AgentInfoSheet } from './AgentInfoSheet';
import { CreateAgentDialog } from './CreateAgentDialog';

export default function Agents() {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectionOption[]>([]);
  
  // Dialog States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);

  // Selected Agents for Actions
  const [selectedRunAgent, setSelectedRunAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedInfoAgent, setSelectedInfoAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
    if (user?.id) {
      loadConnections();
    }
  }, [user?.id]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/agents`);
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

  const loadConnections = async () => {
    try {
      if (!user?.id) return;
      const data = await getServices(user.id);
      const services = data.data || [];
      const options: ConnectionOption[] = [];
      
      services.forEach((service: any) => {
        // Filter for OpenRouter services (checking id 'openrouter' or name 'AI'/'OpenRouter')
        const isOpenRouter = (service.id === 'openrouter') || 
                             (service.name && service.name.toLowerCase().includes('openrouter')) ||
                             (service.name === 'AI'); // OpenRouter uses name 'AI' in metadata

        if (isOpenRouter && service.accounts && Array.isArray(service.accounts)) {
          service.accounts.forEach((acc: any) => {
            options.push({
              id: acc.id,
              name: acc.username || acc.id,
              service: service.name // Keep original name for display
            });
          });
        }
      });
      setConnections(options);
    } catch (error) {
      console.error("Error loading connections:", error);
    }
  };

  const handleCreateSuccess = (savedAgent: Agent, isEdit: boolean) => {
      if (isEdit) {
          setAgents(agents.map(a => a.id === savedAgent.id ? savedAgent : a));
      } else {
          setAgents([savedAgent, ...agents]);
      }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;

    try {
        const response = await fetch(`${API_URL}/api/v1/agents/${agentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            setAgents(agents.filter(a => a.id !== agentId));
            toast.success("Agent deleted successfully");
        } else {
            toast.error("Failed to delete agent");
        }
    } catch (error) {
        console.error("Error deleting agent:", error);
        toast.error("Something went wrong");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Bot className="h-8 w-8" />
             </div>
             <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
                <p className="text-muted-foreground">Cancel, create, and manage your autonomous agents.</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchAgents} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button className="gap-2 shadow-lg" onClick={() => {
                setEditingAgent(null);
                setIsCreateModalOpen(true);
            }}>
                <Plus className="h-4 w-4" />
                Create Agent
            </Button>
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <Card key={i} className="bg-muted/20 border-dashed animate-pulse">
                    <CardHeader className="h-24"></CardHeader>
                    <CardContent className="h-20"></CardContent>
                </Card>
            ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-3xl border-2 border-dashed">
            <div className="bg-muted p-4 rounded-full mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No Agents Created</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                Create your first autonomous agent to start automating tasks with AI.
            </p>
            <Button variant="secondary" onClick={() => {
                setEditingAgent(null);
                setIsCreateModalOpen(true);
            }}>Create Agent</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
                <AgentCard 
                    key={agent.id} 
                    agent={agent}
                    onEdit={(a) => {
                        setEditingAgent(a);
                        setIsCreateModalOpen(true);
                    }}
                    onDelete={handleDeleteAgent}
                    onRun={(a) => {
                        setSelectedRunAgent(a);
                        setIsRunModalOpen(true);
                    }}
                    onInfo={(a) => {
                        setSelectedInfoAgent(a);
                        setIsInfoSheetOpen(true);
                    }}
                />
            ))}
        </div>
      )}

      {/* Components */}
      <CreateAgentDialog 
          open={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen}
          initialAgent={editingAgent}
          userId={user?.id}
          connections={connections}
          onSuccess={handleCreateSuccess}
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
        onRun={(a) => {
            setSelectedRunAgent(a);
            setIsRunModalOpen(true);
        }}
      />
    </div>
  );
}
