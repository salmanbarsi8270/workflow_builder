import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip"
import { PlusIcon, SearchIcon, MoreHorizontal, TrashIcon, EyeIcon, PencilIcon, PlayCircle, CopyIcon, Sparkles, CalendarIcon, CheckCircle2, XCircle, Workflow, DownloadIcon, Layers, ArrowUpDown, ChevronLeft, ChevronRight,} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface AutomationItem {
  id: string;
  name: string;
  createdDate: string;
  status: boolean;
  nodes: any[];
  edges: any[];
  triggerCount?: number;
  lastRun?: string;
  successRate?: number;
  type?: 'scheduled' | 'triggered' | 'manual';
  tags?: string[];
}

interface AutomationListProps {
    automations: AutomationItem[];
    search: string;
    setSearch: (val: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
    onEditName: (item: AutomationItem) => void;
    onOpenEditor: (item: AutomationItem) => void;
    onCreate: () => void;
    onDuplicate?: (item: AutomationItem) => void;
    onExport?: (item: AutomationItem) => void;
    onImport?: () => void;
    isLoading?: boolean;
}

type SortType = 'name' | 'date' | 'recent' | 'runs';

export default function AutomationList({ automations, search, setSearch, onToggleStatus, onDelete, onEditName, onOpenEditor, onCreate, onDuplicate, onExport, isLoading = false
}: AutomationListProps) {
    const [sortBy, setSortBy] = useState<SortType>('name');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredAutomations = automations
        .filter(a => {
            return a.name.toLowerCase().includes(search.toLowerCase());
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'date':
                    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
                case 'recent':
                    return new Date(b.lastRun || b.createdDate).getTime() - new Date(a.lastRun || a.createdDate).getTime();
                case 'runs':
                    return (b.triggerCount || 0) - (a.triggerCount || 0);
                default:
                    return 0;
            }

        });

    const totalPages = Math.ceil(filteredAutomations.length / itemsPerPage);
    const paginatedAutomations = filteredAutomations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-500">

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Workflow className="h-6 w-6 text-violet-500" />
                  Automation Workflows
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  Manage and monitor your automated workflows
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSortBy('name')}>
                        By Name
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('date')}>
                        By Date Created
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('recent')}>
                        By Recent Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('runs')}>
                        By Run Count
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search automations..."
                    className="pl-9 w-full sm:w-[200px] lg:w-[250px] bg-background/50 backdrop-blur-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                </div>
                
                <Button 
                  className="bg-linear-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/20 gap-2"
                  onClick={onCreate}
                >
                  <PlusIcon className="h-4 w-4" />
                  Create New
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 space-y-3"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border animate-pulse">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                <div className="overflow-x-auto">
                    <Table>
                      {/* ✅ FIXED HEADER */}
                      <TableHeader className="sticky top-0 z-20 bg-background">
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[40px] text-center">#</TableHead>
                          <TableHead className="w-[270px] pl-10">Automation Name</TableHead>
                          <TableHead className="w-[150px] text-center">Created</TableHead>
                          <TableHead className="w-[150px] text-center">Status</TableHead>
                          <TableHead className="w-[150px] text-right pr-8">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>

                    {/* ✅ SCROLLABLE BODY */}
                    <div className="max-h-[calc(84vh-260px)] overflow-y-auto">
                      <Table>
                        <TableBody>
                        {paginatedAutomations.length > 0 ? (
                          paginatedAutomations.map((item, index) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border-b hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium text-muted-foreground text-center">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div 
                                  className="flex items-center gap-3 cursor-pointer group" 
                                  onClick={() => onOpenEditor(item)}
                                >
                                  <div className="p-2 rounded-lg bg-linear-to-br from-violet-500/10 to-violet-500/5 group-hover:from-violet-500/20 group-hover:to-violet-500/10 transition-colors">
                                    <Workflow className="h-5 w-5 text-violet-500" />
                                  </div>
                                  <div>
                                    <div className="font-medium flex items-center gap-2 group-hover:text-violet-600 transition-colors">
                                      {item.name}
                                      {item.tags?.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center justify-center gap-1 text-sm">
                                  <CalendarIcon className="h-3 w-3" />
                                  {item.createdDate}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                  <Switch
                                    checked={item.status}
                                    onCheckedChange={() => onToggleStatus(item.id, item.status)}
                                    className="cursor-pointer data-[state=checked]:bg-violet-500"
                                  />
                                  <Badge 
                                    variant={item.status ? "default" : "secondary"} 
                                    className={`gap-1 ${
                                      item.status 
                                        ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30' 
                                        : ''
                                    }`}
                                  >
                                    {item.status ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        Active
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3" />
                                        Inactive
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-8 w-8 hover:bg-violet-100 hover:text-violet-600"
                                          onClick={() => onOpenEditor(item)}
                                        >
                                          <EyeIcon className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>View/Edit</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => onOpenEditor(item)}>
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        Open Editor
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => onEditName(item)}>
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Rename
                                      </DropdownMenuItem>
                                      {onDuplicate && (
                                        <DropdownMenuItem onClick={() => onDuplicate(item)}>
                                          <CopyIcon className="mr-2 h-4 w-4" />
                                          Duplicate
                                        </DropdownMenuItem>
                                      )}
                                      {onExport && (
                                        <DropdownMenuItem onClick={() => onExport(item)}>
                                          <DownloadIcon className="mr-2 h-4 w-4" />
                                          Export
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => onDelete(item.id)}
                                        className="text-red-600 focus:text-red-500 focus:bg-red-50"
                                      >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center">
                              <div className="flex flex-col items-center justify-center py-8">
                                <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                                  <Workflow className="h-8 w-8 text-violet-500" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No automations found</h3>
                                <p className="text-muted-foreground text-sm mb-4 max-w-md">
                                  {search ? "No automations match your search criteria. Try adjusting your search terms." : "Create your first automation to start automating workflows."}
                                </p>
                                <Button 
                                  className="gap-2 bg-linear-to-r from-violet-500 to-violet-600"
                                  onClick={onCreate}
                                >
                                  <PlusIcon className="h-4 w-4" />
                                  Create Your First Automation
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>

                      </Table>
                    </div>
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Footer */}
          {filteredAutomations.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t sticky bottom-0 z-10">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-[70px]">
                        {itemsPerPage}
                        <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {[5, 10, 20, 50].map((pageSize) => (
                        <DropdownMenuItem
                          key={pageSize}
                          onClick={() => {
                            setItemsPerPage(pageSize);
                            setCurrentPage(1);
                          }}
                        >
                          {pageSize}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAutomations.length)} of {filteredAutomations.length} automations
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
}