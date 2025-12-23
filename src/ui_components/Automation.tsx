import { useState, useCallback } from 'react';
import { useTheme } from "@/components/theme-provider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog"
import { 
  PlusIcon, 
  SearchIcon, 
  MoreHorizontal, 
  TrashIcon, 
  EyeIcon, 
  ArrowLeftIcon,
  SaveIcon,
  PencilIcon
} from "lucide-react"
import { 
    ReactFlow, 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState, 
    addEdge,
    type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Types ---

interface AutomationItem {
  id: string;
  name: string;
  createdDate: string;
  status: boolean;
}

const initialAutomations: AutomationItem[] = [
  { id: "1", name: "New Lead Email Sequence", createdDate: "2024-03-10", status: true },
  { id: "2", name: "Order Confirmation Sync", createdDate: "2024-03-12", status: false },   
];

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Trigger: New Order' }, type: 'input' },
  { id: '2', position: { x: 100, y: 250 }, data: { label: 'Action: Send Email' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

// --- Component ---

export default function Automation() {
  const { theme } = useTheme()
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [automations, setAutomations] = useState<AutomationItem[]>(initialAutomations);
  const [search, setSearch] = useState("");
  const [currentAuto, setCurrentAuto] = useState<AutomationItem | null>(null);

  // Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Create/Edit Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAutomationName, setNewAutomationName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- List View Logic ---

  const filteredAutomations = automations.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

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
    // In a real app, load specific workflow data here
    setViewMode('editor');
  };

  const handleOpenModal = () => {
      setNewAutomationName("");
      setEditingId(null);
      setIsCreateModalOpen(true);
  };

  const handleEditClick = (automation: AutomationItem) => {
      setNewAutomationName(automation.name);
      setEditingId(automation.id);
      setIsCreateModalOpen(true);
  };

  const handleSaveAutomation = () => {
      if (!newAutomationName.trim()) return;

      if (editingId) {
          // Update existing
          setAutomations(automations.map(a => 
              a.id === editingId ? { ...a, name: newAutomationName } : a
          ));
      } else {
          // Create new
          const newAuto: AutomationItem = {
              id: Math.random().toString(36).substr(2, 9),
              name: newAutomationName,
              createdDate: new Date().toISOString().split('T')[0],
              status: false
          };
          setAutomations([...automations, newAuto]);
          handleOpenEditor(newAuto);
      }
      
      setIsCreateModalOpen(false);
      setNewAutomationName("");
      setEditingId(null);
  };

  // --- Editor View Logic ---

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = (_event: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
  };

  const onPaneClick = () => {
      setSelectedNodeId(null);
  }

  const handleUpdateNode = (label: string, connection?: string) => {
      setNodes((nds) => 
        nds.map((node) => {
            if (node.id === selectedNodeId) {
                return {
                    ...node,
                    data: { 
                        ...node.data, 
                        label: label,
                        connection: connection 
                    }
                };
            }
            return node;
        })
      );
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // --- Render ---

  if (viewMode === 'list') {
    return (
      <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl font-bold">Automations</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-[200px] pl-8 md:w-[300px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleOpenModal}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Automation Name</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.createdDate}</TableCell>
                  <TableCell>
                    <Switch 
                        checked={item.status} 
                        onCheckedChange={() => handleToggleStatus(item.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditor(item)}>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View / Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(item)}>
                          <PencilIcon className="mr-2 h-4 w-4" />
                          Edit Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600 focus:text-red-500">
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                    <Input 
                        id="name" 
                        value={newAutomationName} 
                        onChange={(e) => setNewAutomationName(e.target.value)}
                        placeholder="e.g., Order Confirmation Flow"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveAutomation}>{editingId ? "Save Changes" : "Create"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    );
  }

  // Editor View
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}>
                    <ArrowLeftIcon className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold">{currentAuto?.name || "New Automation"}</h2>
                    <p className="text-xs text-muted-foreground">Workflow Editor</p>
                </div>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
                 <Button onClick={() => setViewMode('list')}><SaveIcon className="mr-2 h-4 w-4"/> Save</Button>
            </div>
        </div>

        <div className="flex flex-1 border rounded-lg overflow-hidden bg-background">
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    fitView
                    colorMode={theme === 'dark' ? 'dark' : 'light'}
                >
                    <Controls />
                    {/* <MiniMap /> */}
                    <Background gap={12} size={1} />
                </ReactFlow>
            </div>
            
            {/* Right Sidebar */}
            {selectedNodeId && (
                <div className="w-80 border-l bg-card p-4 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Edit Node</h3>
                        <p className="text-sm text-muted-foreground">Configure the selected step.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label>Label</Label>
                        <Input 
                            value={(selectedNode?.data as { label: string }).label || ''} 
                            onChange={(e) => handleUpdateNode(e.target.value, (selectedNode?.data as { connection?: string }).connection)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Integration</Label>
                        <Select 
                            value={(selectedNode?.data as { connection?: string }).connection || ''} 
                            onValueChange={(val) => handleUpdateNode((selectedNode?.data as { label: string }).label, val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select app..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gmail">Gmail</SelectItem>
                                <SelectItem value="google-sheets">Google Sheets</SelectItem>
                                <SelectItem value="google-forms">Google Forms</SelectItem>
                                <SelectItem value="slack">Slack</SelectItem>
                                <SelectItem value="google-drive">Google Drive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mt-auto">
                        <Button variant="destructive" className="w-full" onClick={() => {
                            setNodes(nodes.filter(n => n.id !== selectedNodeId));
                            setSelectedNodeId(null);
                        }}>
                            Delete Node
                        </Button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
