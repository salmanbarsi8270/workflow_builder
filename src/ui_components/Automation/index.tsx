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

import { API_URL } from '../api/apiurl';
import { useUser } from '@/context/UserContext';
import { io, type Socket } from 'socket.io-client';
import Editorloading from '../Utility/Editorloading';

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
  const { user, isLoading: isUserLoading } = useUser();
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();

  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentAuto, setCurrentAuto] = useState<AutomationItem | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize Socket
  useEffect(() => {
      if (user?.id) {
          const newSocket = io(API_URL, {
              withCredentials: true,
          });

          newSocket.on('connect', () => {
              console.log('Connected to socket server:', newSocket.id);
          });

          setSocket(newSocket);

          return () => {
              newSocket.disconnect();
          };
      }
  }, [user?.id]);

  // Join Flow Room & Listen for Updates
  useEffect(() => {
      if (socket && id) {
          socket.emit('join-flow', id);

          const handleRemoteUpdate = (updatedFlow: any) => {
              console.log("Received remote update:", updatedFlow);
              if (updatedFlow && updatedFlow.id === id) {
                 const uiDef = updatedFlow.ui_definition || { nodes: [], edges: [] };
                 const mappedFlow = {
                    id: updatedFlow.id,
                    name: updatedFlow.name,
                    createdDate: new Date(updatedFlow.created_at).toISOString().split('T')[0],
                    status: updatedFlow.is_active,
                    nodes: uiDef.nodes || [],
                    edges: uiDef.edges || []
                 };
                 // Only update if it's different to avoid loops? 
                 // For now, trust the server state
                 setCurrentAuto(mappedFlow);
              }
          };

          socket.on('flow-updated', handleRemoteUpdate);

          return () => {
              socket.off('flow-updated', handleRemoteUpdate);
          };
      }
  }, [socket, id]);


  // Fetch Automations on Load (List View)
  useEffect(() => {
    const fetchAutomations = async (showLoading = true) => {
        if (!user?.id || !socket) {
            // Wait for socket
            return;
        }

        if (showLoading) setIsListLoading(true);
        
        socket.emit('list-flows', user.id, (response: any) => {
             if (showLoading) setIsListLoading(false);
             if (response.error) {
                 console.error("Failed to fetch automations:", response.error);
             } else if (response.success && response.flows) {
                 const mappedFlows: AutomationItem[] = response.flows.map((flow: any) => ({
                    id: flow.id,
                    name: flow.name,
                    createdDate: new Date(flow.created_at).toISOString().split('T')[0],
                    status: flow.is_active,
                    nodes: [], 
                    edges: [] 
                }));
                setAutomations(mappedFlows);
             }
        });
    };

    fetchAutomations();

    // Background polling every 30 seconds
    const intervalId = setInterval(() => {
        fetchAutomations(false); // Fetch silently in background
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user?.id, isUserLoading, id, socket]); // Re-run when navigation happens or socket connects

  // Handle URL Change / Editor Loading
  useEffect(() => {
    const loadFlow = async () => {
        if (!id) {
            setCurrentAuto(null);
            return;
        }

        // Wait for user context and socket to be ready
        if (isUserLoading || !socket) return;

        // Check if we already have it loaded?
        if (currentAuto?.id === id) return;
        setIsEditorLoading(true);

        socket.emit('get-flow', id, (response: any) => {
             setIsEditorLoading(false);
             if (response.error) {
                 console.error("Error loading flow", response.error);
                 toast.error("Failed to load automation");
                 navigate('/automation');
             } else if (response.success && response.flow) {
                 const flow = response.flow;
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
             }
        });
    };

    loadFlow();
  }, [id, user?.id, isUserLoading, socket]); // Re-run if ID or User or Socket changes

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAutomationName, setNewAutomationName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Handlers ---
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
      const targetAuto = automations.find(a => a.id === id);
      const autoName = targetAuto?.name || "Automation";

      // Optimistic update
      setAutomations(autos => autos.map(a => a.id === id ? { ...a, status: !currentStatus } : a));
      
      if (socket) {
          socket.emit('update-flow', { flowId: id, is_active: !currentStatus }, (response: any) => {
              if (response.error) {
                  console.error("Socket status update failed:", response.error);
                  toast.error("Failed to update status");
                  // Revert
                  setAutomations(autos => autos.map(a => a.id === id ? { ...a, status: currentStatus } : a));
              } else {
                  toast.success(!currentStatus ? `Automation ${autoName} started` : `Automation ${autoName} stopped`);
              }
          });
      } else {
          toast.error("Connection lost. Cannot update status.");
          setAutomations(autos => autos.map(a => a.id === id ? { ...a, status: currentStatus } : a));
      }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this automation?")) {
        // Optimistic update
        setAutomations(autos => autos.filter(a => a.id !== id));

        if (socket) {
            socket.emit('delete-flow', id, (response: any) => {
                if (response.error) {
                    console.error("Failed to delete flow:", response.error);
                    toast.error("Failed to delete automation");
                } else {
                    toast.success("Automation deleted");
                }
            });
        } else {
            toast.error("Connection lost. Cannot delete flow.");
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

          if (socket) {
              socket.emit('update-flow', { flowId: editingId, name: newAutomationName }, (response: any) => {
                  if (response.error) {
                      console.error("Socket rename failed:", response.error);
                      toast.error("Failed to update name");
                      // Revert
                      if (oldName) {
                          setAutomations(prev => prev.map(a => a.id === editingId ? { ...a, name: oldName } : a));
                      }
                  } else {
                      toast.success("Name updated successfully");
                  }
              });
          } else {
               toast.error("Connection lost. Cannot update name.");
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

          const userId = user?.id || "anonymous";
          
          if (socket) {
              const payload = {
                  userId: userId,
                  name: newAutomationName,
                  ui_definition: newUiDefinition
              };
              
              socket.emit('create-flow', payload, (response: any) => {
                   if (response.error) {
                       console.error("Error creating automation:", response.error);
                       toast.error("Failed to create automation. Please try again.");
                   } else if (response.success && response.flow) {
                        const createdFlow = response.flow;
                        const newId = createdFlow.id || (createdFlow.flow && createdFlow.flow.id) || (createdFlow.flow && createdFlow.flow._id) || createdFlow._id;

                         // Navigate to new flow
                        setIsCreateModalOpen(false);
                        setNewAutomationName("");
                        
                        if (newId) {
                            navigate(`/automation/${newId}`);
                            toast.success("Automation created!");
                        } else {
                            toast.error("Created but failed to retrieve ID");
                        }
                   }
              });
          } else {
              toast.error("Connection lost. Cannot create automation.");
          }
      }
  };

  const handleSaveWorkflow = useCallback(async (nodes: Node[], edges: Edge[]) => {
      if (currentAuto && user?.id) {
          setIsSaving(true);
          const updatedAuto = { ...currentAuto, nodes, edges };
          setCurrentAuto(updatedAuto); // Optimistic local update
           
           // Update list state too
          setAutomations(automations => automations.map(a => 
            a.id === currentAuto.id ? updatedAuto : a
          ));

          const uiDefinition = { nodes, edges };
          const payload = {
            flowId: currentAuto.id,
            name: currentAuto.name,
            ui_definition: uiDefinition,
            is_active: currentAuto.status
          };

          if (socket) {
              socket.emit('update-flow', payload, (response: any) => {
                  setIsSaving(false);
                  if (response.error) {
                      console.error("Socket update failed:", response.error);
                      toast.error("Failed to save via socket");
                  } else {
                      console.log("Socket update success");
                  }
              });
          } else {
              setIsSaving(false);
              toast.error("Connection lost. cannot save.");
          }
      }
  }, [currentAuto, user?.id, socket]);

  const handleEditorToggleStatus = useCallback(async () => {
      if (currentAuto) {
          const newStatus = !currentAuto.status;
          const updatedAuto = { ...currentAuto, status: newStatus };
          setCurrentAuto(updatedAuto); // Optimistic update
          
          const payload = {
            flowId: currentAuto.id,
            is_active: newStatus
          };

          if (socket) {
              socket.emit('update-flow', payload, (response: any) => {
                if (response.error) {
                    console.error("Socket status update failed:", response.error);
                    toast.error("Failed to update status");
                    setCurrentAuto({ ...currentAuto, status: !newStatus }); // Revert
                } else {
                     toast.success(newStatus ? `Automation ${currentAuto.name} started` : `Automation ${currentAuto.name} stopped`);
                }
              });
          } else {
               toast.error("Connection lost. Cannot update status.");
               setCurrentAuto({ ...currentAuto, status: !newStatus });
          }
      }
  }, [currentAuto, socket]);

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
      return (
          <Editorloading />
      );
  }

  return (
      <>
        <AutomationEditor 
            key={id}
            automationName={currentAuto.name}
            initialNodes={currentAuto.nodes}
            initialEdges={currentAuto.edges}
            automationStatus={currentAuto.status}
            onBack={() => navigate('/automation')}
            onAutoSave={handleSaveWorkflow}
            onToggleStatus={handleEditorToggleStatus}
            onPublish={handlePublish}
            theme={theme === 'dark' ? 'dark' : 'light'}
            isLoading={isEditorLoading || isSaving}
            socket={socket}
            flowId={id}
        />
        <Toaster />
      </>
  );
}
