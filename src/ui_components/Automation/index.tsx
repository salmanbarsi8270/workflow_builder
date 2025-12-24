import { useState, useEffect } from 'react';
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dialog"
import { Toaster, toast } from 'sonner';
import { type Node, type Edge } from '@xyflow/react';

import AutomationList, { type AutomationItem } from './AutomationList';
import AutomationEditor from './AutomationEditor';

// --- Initial Data ---

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

const initialAutomations: AutomationItem[] = [
//   { 
//       id: "1", 
//       name: "New Lead Email Sequence", 
//       createdDate: "2024-03-10", 
//       status: true,
//       nodes: [
//         { id: '1', position: { x: 100, y: 100 }, data: { label: 'Trigger: New Lead', icon: 'trigger' }, type: 'custom' },
//         { id: '2', position: { x: 100, y: 300 }, data: { label: 'Action: Send Email', icon: 'email' }, type: 'custom' },
//         { id: 'end', position: { x: 100, y: 500 }, data: { label: 'End' }, type: 'end' }
//       ],
//       edges: [
//           { id: 'e1-2', source: '1', target: '2', type: 'custom' },
//           { id: 'e2-end', source: '2', target: 'end', type: 'custom' }
//       ]
//   },
//   { 
//       id: "2", 
//       name: "Order Confirmation Sync", 
//       createdDate: "2024-03-12", 
//       status: false,
//       nodes: defaultStartNode,
//       edges: defaultEdges
//   },   
];

export default function AutomationIndex() {
  const { theme } = useTheme()
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [automations, setAutomations] = useState<AutomationItem[]>(initialAutomations);
  const [search, setSearch] = useState("");
  const [currentAuto, setCurrentAuto] = useState<AutomationItem | null>(null);

  // Log automations state on change
  useEffect(() => {
    console.log("Updated initialAutomations:", automations);
  }, [automations]);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAutomationName, setNewAutomationName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Handlers ---

  const handleToggleStatus = (id: string) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, status: !a.status } : a
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this automation?")) {
      setAutomations(automations.filter(a => a.id !== id));
    }
  };

  const handleOpenEditor = (automation: AutomationItem) => {
    setCurrentAuto(automation);
    setViewMode('editor');
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

  const handleSaveAutomationName = () => {
      if (!newAutomationName.trim()) return;

      if (editingId) {
          setAutomations(automations.map(a => 
              a.id === editingId ? { ...a, name: newAutomationName } : a
          ));
      } else {
          const newAuto: AutomationItem = {
              id: Math.random().toString(36).substr(2, 9),
              name: newAutomationName,
              createdDate: new Date().toISOString().split('T')[0],
              status: false,
              nodes: defaultStartNode,
              edges: defaultEdges
          };
          setAutomations([...automations, newAuto]);
          handleOpenEditor(newAuto); // Optional: Open immediate? User prompt implied just create in list.
      }
      console.log(automations);
      
      setIsCreateModalOpen(false);
      setNewAutomationName("");
      setEditingId(null);
  };

  const handleSaveWorkflow = (nodes: Node[], edges: Edge[]) => {
      if (currentAuto) {
          const updatedAuto = { ...currentAuto, nodes, edges };
          setCurrentAuto(updatedAuto); // Update local editor state
          setAutomations(automations.map(a => 
            a.id === currentAuto.id ? updatedAuto : a
          ));
      }
  };

  const handleEditorToggleStatus = () => {
      if (currentAuto) {
          const newStatus = !currentAuto.status;
          const updatedAuto = { ...currentAuto, status: newStatus };
          setCurrentAuto(updatedAuto);
          setAutomations(automations.map(a => 
            a.id === currentAuto.id ? updatedAuto : a
          ));
          toast.success(`Automation turned ${newStatus ? 'ON' : 'OFF'}`);
      }
  };

  const handlePublish = () => {
    if (!currentAuto) return;
    
    // Validation: simple check for now
    const hasEnd = currentAuto.nodes.some(n => n.type === 'end');
    if (!hasEnd) {
        toast.error("Flow must have an End node to publish.");
        return;
    }

    if (!currentAuto.status) {
        handleEditorToggleStatus(); // Turn on
    }
    toast.success("Automation Published Successfully!");
  };

  const handleRun = () => {
      // Logic to open Run Sidebar (will implement next)
      console.log("Run Test Clicked");
      toast.info("Starting Test Run...");
  };

  // --- Render ---

  if (viewMode === 'list') {
      return (
          <>
            <AutomationList 
                automations={automations}
                search={search}
                setSearch={setSearch}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                onEditName={handleEditNameClick}
                onOpenEditor={handleOpenEditor}
                onCreate={handleOpenModal}
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
          </>
      );
  }

  return (
      <>
        <AutomationEditor 
            automationName={currentAuto?.name || "Untitled"}
            initialNodes={currentAuto?.nodes || []}
            initialEdges={currentAuto?.edges || []}
            automationStatus={currentAuto?.status || false}
            onBack={() => setViewMode('list')}
            onAutoSave={handleSaveWorkflow}
            onToggleStatus={handleEditorToggleStatus}
            onPublish={handlePublish}
            onRun={handleRun}
            theme={theme === 'dark' ? 'dark' : 'light'}
        />
        <Toaster />
      </>
  );
}
