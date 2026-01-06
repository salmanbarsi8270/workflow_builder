import { useState, useEffect, useCallback } from 'react';
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster, toast } from 'sonner';
import { type Node, type Edge } from '@xyflow/react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import AutomationList, { type AutomationItem } from '@/ui_components/Automation/components/AutomationList';
import AutomationEditor from '@/ui_components/Automation/components/AutomationEditor';
import { TemplateGallery } from '@/ui_components/Automation/components/TemplateGallery';
import { ResizableSheetContent } from '../Utility/ResizableSheet';

import { API_URL } from '@/ui_components/api/apiurl';
import { useUser } from '@/context/UserContext';
import { io, type Socket } from 'socket.io-client';
import Editorloading from '@/ui_components/Utility/Editorloading';
import { Loader2, Plus, FilePlus, Layout, Save, Sparkles, Wand2 } from 'lucide-react';

const defaultStartNode: Node[] = [
    {
        id: '1',
        position: { x: 100, y: 100 },
        data: { label: 'Select Trigger', subLabel: 'Empty Trigger', icon: 'trigger', isPlaceholder: true },
        type: 'custom'
    },
    {
        id: 'end',
        position: { x: 210, y: 300 },
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
    const location = useLocation();

    const [automations, setAutomations] = useState<AutomationItem[]>([]);
    const [search, setSearch] = useState("");
    const [currentAuto, setCurrentAuto] = useState<AutomationItem | null>(null);
    const [isListLoading, setIsListLoading] = useState(true);
    const [isEditorLoading, setIsEditorLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [createsutomationloading, setcreatesutomationloading] = useState(false)

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


    // Fetch Automations Function
    const fetchAutomations = useCallback(async (showLoading = true) => {
        if (!user?.id || !socket) {
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
    }, [user?.id, socket]);

    // Initial Fetch & Polling
    useEffect(() => {
        // Only fetch if we are in list mode (no ID)
        if (!id) {
            fetchAutomations();
        }

        const intervalId = setInterval(() => {
            // Poll regardless? Or only if !id?
            // If we are in editor, we don't strictly need to poll the list, but it keeps cache fresh.
            if (!id) fetchAutomations(false);
        }, 30000);

        return () => clearInterval(intervalId);
    }, [fetchAutomations, id, location.pathname]); // Re-run when ID changes (navigating back to list)

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
        try {
            setNewAutomationName("");
            setEditingId(null);
            setIsCreateModalOpen(true);
        } catch (error) {
            console.error("Error opening modal:", error);
            toast.error("Failed to open modal");
        }
    };

    // Check for openNew state from navigation
    useEffect(() => {
        if (location.state?.openNew) {
            handleOpenModal();
            // Clear state to prevent reopening on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const handleEditNameClick = (automation: AutomationItem) => {
        setNewAutomationName(automation.name);
        setEditingId(automation.id);
        setIsCreateModalOpen(true);
    };

    const handleSaveAutomationName = async () => {
        if (!newAutomationName.trim()) return;
        setcreatesutomationloading(true);

        try {
            if (editingId) {
                // Rename Mode (stays on list mostly)
                const oldName = automations.find(a => a.id === editingId)?.name;
                setAutomations(automations.map(a => a.id === editingId ? { ...a, name: newAutomationName } : a));

                if (socket) {
                    socket.emit('update-flow', { flowId: editingId, name: newAutomationName }, (response: any) => {
                        setcreatesutomationloading(false);
                        setIsCreateModalOpen(false);
                        setNewAutomationName("");
                        setEditingId(null);

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
                    setcreatesutomationloading(false);
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
                        setcreatesutomationloading(false);

                        if (response.error) {
                            console.error("Error creating automation:", response.error);
                            toast.error("Failed to create automation. Please try again.");
                        } else if (response.success && response.flow) {
                            const createdFlow = response.flow;
                            const newId = createdFlow.id || (createdFlow.flow && createdFlow.flow.id) || (createdFlow.flow && createdFlow.flow._id) || createdFlow._id;

                            // Refresh list so it's there when we come back
                            fetchAutomations(false);

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
                    setcreatesutomationloading(false);
                    toast.error("Connection lost. Cannot create automation.");
                }
            }
        } catch (error) {
            console.error("Error creating automation:", error);
            toast.error("Failed to create automation. Please try again.");
            setcreatesutomationloading(false);
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

            const uiDefinition = {
                nodes: nodes.map(n => ({
                    ...n,
                    data: {
                        ...n.data,
                        status: undefined,
                        duration: undefined
                    }
                })),
                edges
            };
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

                <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <ResizableSheetContent 
                        side="right" 
                        storageKey="create-automation-width" 
                        defaultWidth={480} 
                        className="sm:max-w-none border-l-0 shadow-2xl p-0"
                    >
                        <div className="h-full flex flex-col">
                            <div className="p-6 pb-4 border-b bg-linear-to-b from-primary/5 to-transparent">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
                                        {editingId ? (
                                            <Save className="h-6 w-6 text-primary" />
                                        ) : (
                                            <Plus className="h-6 w-6 text-primary" />
                                        )}
                                    </div>
                                    <SheetHeader className="text-left space-y-0.5">
                                        <SheetTitle className="text-2xl font-bold tracking-tight">
                                            {editingId ? "Rename Flow" : "New Automation"}
                                        </SheetTitle>
                                        <SheetDescription className="text-sm font-medium text-muted-foreground/80 lowercase first-letter:uppercase">
                                            {editingId ? "Update your automation identity" : "Start building your next workflow"}
                                        </SheetDescription>
                                    </SheetHeader>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 pt-4">
                                {editingId ? (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="name" className="text-sm font-semibold ml-1">Flow Name</Label>
                                            <div className="relative group">
                                                <Input 
                                                    id="name" 
                                                    value={newAutomationName} 
                                                    onChange={(e) => setNewAutomationName(e.target.value)} 
                                                    placeholder="e.g., Order Confirmation Flow" 
                                                    className="h-12 px-4 bg-muted/30 focus:bg-background transition-all border-border/50 group-hover:border-primary/50 text-base"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-primary/30 transition-colors">
                                                    <Save className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 pt-2">
                                            <Button variant="outline" className="flex-1 h-12 text-base font-medium" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                            <Button 
                                                disabled={createsutomationloading} 
                                                onClick={handleSaveAutomationName}
                                                className="flex-2 h-12 text-base font-bold bg-linear-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                                            >
                                                {createsutomationloading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</> : "Update Name"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Tabs defaultValue="blank" className="w-full h-full flex flex-col">
                                        <TabsList className="grid w-full grid-cols-2 p-1.5 h-14 bg-muted/40 rounded-2xl mb-6">
                                            <TabsTrigger value="blank" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 text-sm font-bold">
                                                <FilePlus className="h-4 w-4" /> Blank Flow
                                            </TabsTrigger>
                                            <TabsTrigger value="templates" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 text-sm font-bold">
                                                <Layout className="h-4 w-4" /> Templates
                                            </TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="blank" className="space-y-6 mt-0">
                                            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-2">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Sparkles className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-bold leading-none">Fresh Start</h4>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                            Start with a clean canvas and build your logic from scratch.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="blank-name" className="text-sm font-semibold ml-1">What should we call this?</Label>
                                                <Input 
                                                    id="blank-name" 
                                                    value={newAutomationName} 
                                                    onChange={(e) => setNewAutomationName(e.target.value)} 
                                                    placeholder="e.g., Sync LinkedIn to Sheets" 
                                                    className="h-12 px-4 bg-muted/30 focus:bg-background transition-all border-border/50 focus:ring-2 focus:ring-primary/10 text-base"
                                                />
                                            </div>

                                            <Button 
                                                className="w-full h-12 text-lg font-bold bg-linear-to-br from-primary to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl" 
                                                disabled={createsutomationloading || !newAutomationName.trim()} 
                                                onClick={handleSaveAutomationName}
                                            >
                                                {createsutomationloading ? (
                                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Architecting...</>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        Create Automation <Wand2 className="h-5 w-5 opacity-50" />
                                                    </span>
                                                )}
                                            </Button>
                                            
                                            <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                                               Automate anything in seconds
                                            </p>
                                        </TabsContent>

                                        <TabsContent value="templates" className="flex-1 min-h-0 pt-0">
                                            <div className="h-full overflow-hidden border border-border/40 rounded-2xl shadow-inner bg-muted/5">
                                                <TemplateGallery 
                                                    userId={user?.id || ""} 
                                                    onSuccess={(newId) => {
                                                        fetchAutomations(false); 
                                                        setIsCreateModalOpen(false);
                                                        if (newId) {
                                                            navigate(`/automation/${newId}`);
                                                        }
                                                    }}
                                                    hideTitle={true}
                                                />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                )}
                            </div>
                        </div>
                    </ResizableSheetContent>
                </Sheet>
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
