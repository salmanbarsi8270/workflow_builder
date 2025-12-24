import { useState, useEffect, useCallback } from 'react';
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dialog"
import { Toaster, toast } from 'sonner';
import { type Node, type Edge } from '@xyflow/react';
import { useParams, useNavigate } from 'react-router-dom';

import AutomationList, { type AutomationItem } from './AutomationList';
import AutomationEditor from './AutomationEditor';
import axios from 'axios';
import { API_URL } from '../api/apiurl';
import { useUser } from '@/context/UserContext';

const defaultStartNode: Node[] = [
    { 
        id: '1', 
        position: { x: 100, y: 100 }, 
        data: { label: 'Select Trigger', subLabel: 'Empty Trigger', icon: 'trigger', isPlaceholder: true }, 
        type: 'custom' 
    },
    {
        id: 'end',
        position: { x: 100, y: 300 },
        data: { label: 'End' },
        type: 'end'
    }
];

const defaultEdges: Edge[] = [
    { id: 'e1-end', source: '1', target: 'end', type: 'custom' }
];

export default function AutomationIndex() {
  const { theme } = useTheme()
  const { user } = useUser();
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();

  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentAuto, setCurrentAuto] = useState<AutomationItem | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Automations on Load (List View)
  useEffect(() => {
    // Only fetch list if we are in list mode (no ID) OR if we want to keep sidebar updated? 
    // Usually fetching list is fine.
    const fetchAutomations = async () => {
        if (!user?.id) return;
        setIsListLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/flows?userId=${user.id}`);
            if (res.data && res.data.success) {
                const mappedFlows: AutomationItem[] = res.data.flows.map((flow: any) => ({
                    id: flow.id,
                    name: flow.name,
                    createdDate: new Date(flow.created_at).toISOString().split('T')[0],
                    status: flow.is_active,
                    nodes: [], 
                    edges: [] 
                }));
                setAutomations(mappedFlows);
            }
        } catch (error) {
            console.error("Failed to fetch automations:", error);
            toast.error("Could not load automations.");
        } finally {
            setIsListLoading(false);
        }
    };

    fetchAutomations();
  }, [user?.id]);

  // Handle URL Change / Editor Loading
  useEffect(() => {
    const loadFlow = async () => {
        if (id) {
             // We are in editor mode
             // Check if we already have it loaded?
             if (currentAuto?.id === id) return;
             setIsEditorLoading(true);

             try {
                // Fetch specific flow details - only owned flows
                const res = await axios.get(`${API_URL}/api/flows/${id}${user?.id ? `?userId=${user.id}` : ''}`);
                if (res.data && res.data.success) {
                     const flow = res.data.flow;
                     const uiDef = flow.ui_definition || { nodes: [], edges: [] };
                     const fullAuto = {
                         id: flow.id,
                         name: flow.name,
                         createdDate: new Date(flow.created_at).toISOString().split('T')[0],
                         status: flow.is_active,
                         nodes: uiDef.nodes || [],
                         edges: uiDef.edges || []
                     };
                     setCurrentAuto(fullAuto);
                } else {
                     toast.error("Flow not found");
                     navigate('/automation');
                }
             } catch (error) {
                console.error("Error loading flow", error);
                toast.error("Failed to load automation");
                navigate('/automation');
             } finally {
                 setIsEditorLoading(false);
             }
        } else {
            // List mode
            setCurrentAuto(null);
        }
    };

    loadFlow();
  }, [id, user?.id]); // Re-run if ID changes

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAutomationName, setNewAutomationName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Handlers ---
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
      // Optimistic update
      setAutomations(autos => autos.map(a => a.id === id ? { ...a, status: !currentStatus } : a));
      
      try {
          await axios.patch(`${API_URL}/api/flows/${id}`, { is_active: !currentStatus });
          toast.success("Status updated");
      } catch(error) {
          console.error("Failed to update status:", error);
          toast.error("Failed to update status");
          // Revert
          setAutomations(autos => autos.map(a => a.id === id ? { ...a, status: currentStatus } : a));
      }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this automation?")) {
        // Optimistic update
        setAutomations(autos => autos.filter(a => a.id !== id));

        try {
            await axios.delete(`${API_URL}/api/flows/${id}`);
            toast.success("Automation deleted");
        } catch(error) {
            console.error("Failed to delete flow:", error);
            toast.error("Failed to delete automation");
        }
    }
  };

  const handleOpenEditor = (automation: AutomationItem) => {
      // Navigate to URL
      navigate(`/automation/${automation.id}`);
  };

  const handleOpenModal = () => {
      setNewAutomationName("");
      setEditingId(null);
      setIsCreateModalOpen(true);
  };

  const handleEditNameClick = (automation: AutomationItem) => {
      setNewAutomationName(automation.name);
      setEditingId(automation.id);
      setIsCreateModalOpen(true);
  };

  const handleSaveAutomationName = async () => {
      if (!newAutomationName.trim()) return;

      if (editingId) {
          // Rename Mode (stays on list mostly)
          const oldName = automations.find(a => a.id === editingId)?.name;
          setAutomations(automations.map(a => 
              a.id === editingId ? { ...a, name: newAutomationName } : a
          ));
          setIsCreateModalOpen(false);
          setNewAutomationName("");
          setEditingId(null);

          try {
              await axios.patch(`${API_URL}/api/flows/${editingId}`, { name: newAutomationName });
              toast.success("Name updated successfully");
          } catch(error) {
              console.error("Failed to update name:", error);
              toast.error("Failed to update name");
              // Revert
              if (oldName) {
                    setAutomations(prev => prev.map(a => a.id === editingId ? { ...a, name: oldName } : a));
              }
          }

      } else {
          // Create Mode
          const newUiDefinition = {
            nodes: defaultStartNode,
            edges: defaultEdges
          };

          try {
             const userId = user?.id || "anonymous"; 
             
             const createRes = await axios.post(`${API_URL}/api/flows`, {
                userId: userId, 
                name: newAutomationName,
                ui_definition: newUiDefinition
             });

             const createdFlow = createRes.data;
             const newId = createdFlow.id || (createdFlow.flow && createdFlow.flow.id) || (createdFlow.flow && createdFlow.flow._id) || createdFlow._id;

             // Navigate to new flow
             setIsCreateModalOpen(false);
             setNewAutomationName("");
             
             if (newId) {
                 navigate(`/automation/${newId}`);
                 toast.success("Automation created!");
             } else {
                 // Fallback if ID parsing fails?
                 toast.error("Created but failed to retrieve ID");
                 // Refresh list?
             }

          } catch (error) {
              console.error("Error creating automation:", error);
              toast.error("Failed to create automation. Please try again.");
          }
      }
  };

  const handleSaveWorkflow = useCallback(async (nodes: Node[], edges: Edge[]) => {
      if (currentAuto && user?.id) {
          setIsSaving(true);
          const updatedAuto = { ...currentAuto, nodes, edges };
          setCurrentAuto(updatedAuto); // Update local editor state
          // Also update list state if we want persistence there
          setAutomations(automations => automations.map(a => 
            a.id === currentAuto.id ? updatedAuto : a
          ));

          try {
             const uiDefinition = { nodes, edges };
             await axios.patch(`${API_URL}/api/flows/${currentAuto.id}`, {
                name: currentAuto.name,
                ui_definition: uiDefinition,
                is_active: currentAuto.status
             });
             console.log("Auto-saved flow:", currentAuto.id);
          } catch (error) {
              console.error("Failed to auto-save flow:", error);
              toast.error("Could not auto-save changes");
          } finally {
              setIsSaving(false);
          }
      }
  }, [currentAuto, user?.id]);

  const handleEditorToggleStatus = useCallback(async () => {
      if (currentAuto) {
          const newStatus = !currentAuto.status;
          const updatedAuto = { ...currentAuto, status: newStatus };
          setCurrentAuto(updatedAuto);
          
          try {
              await axios.patch(`${API_URL}/api/flows/${currentAuto.id}`, { is_active: newStatus });
              toast.success(`Automation turned ${newStatus ? 'ON' : 'OFF'}`);
          } catch(error) {
              console.error("Failed to update status:", error);
              toast.error("Failed to update status");
                setCurrentAuto({ ...currentAuto, status: !newStatus });
          }
      }
  }, [currentAuto]);

  const handlePublish = () => {
    if (!currentAuto) return;
    const hasEnd = currentAuto.nodes.some(n => n.type === 'end');
    if (!hasEnd) {
        toast.error("Flow must have an End node to publish.");
        return;
    }
    if (!currentAuto.status) {
        handleEditorToggleStatus(); 
    }
    toast.success("Automation Published Successfully!");
  };

  const handleRun = () => {
      console.log("Run Test Clicked");
      toast.info("Starting Test Run...");
  };

  // --- Render based on ID presence ---
  if (!id) {
      // List Mode
      return (
          <>
            <AutomationList 
                automations={automations}
                search={search}
                setSearch={setSearch}
                onToggleStatus={(id, current) => handleToggleStatus(id, !!current)} // Fix signature mismatch if needed
                onDelete={handleDelete}
                onEditName={handleEditNameClick}
                onOpenEditor={handleOpenEditor}
                onCreate={handleOpenModal}
                isLoading={isListLoading}
            />

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Automation" : "Create New Automation"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Update the name of your automation." : "Enter a name for your new automation workflow."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={newAutomationName} onChange={(e) => setNewAutomationName(e.target.value)} placeholder="e.g., Order Confirmation Flow" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAutomationName}>{editingId ? "Save Changes" : "Create"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Toaster />
          </>
      );
  }

  // Editor Mode
  if (!currentAuto) {
      // Loading or Error state for Editor
      return <div className="p-10 flex justify-center">Loading editor...</div>;
  }

  return (
      <>
        <AutomationEditor 
            automationName={currentAuto.name}
            initialNodes={currentAuto.nodes}
            initialEdges={currentAuto.edges}
            automationStatus={currentAuto.status}
            onBack={() => navigate('/automation')}
            onAutoSave={handleSaveWorkflow}
            onToggleStatus={handleEditorToggleStatus}
            onPublish={handlePublish}
            onRun={handleRun}
            theme={theme === 'dark' ? 'dark' : 'light'}
            isLoading={isEditorLoading || isSaving}
        />
        <Toaster />
      </>
  );
}
