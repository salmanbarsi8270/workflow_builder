import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { PlusIcon, MoreHorizontal, TrashIcon, EyeIcon, PencilIcon, PlayCircle, CalendarIcon, Workflow, Layers, ArrowUpDown, Plus, Search, X, RefreshCw,} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { CustomPagination } from "../../Shared/CustomPagination"
 
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
    onRefresh?: () => void;
}
 
type SortType = 'name' | 'date' | 'recent' | 'runs';
 
export default function AutomationList({ automations, search, setSearch, onToggleStatus, onDelete, onEditName, onOpenEditor, onCreate, isLoading = false, onRefresh }: AutomationListProps) {
    const { accentColor } = useTheme();
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
 
    const paginatedAutomations = filteredAutomations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
 
    return (
        <div className="min-h-full bg-transparent text-slate-900 dark:text-white overflow-y-auto relative animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />
 
            <div className="relative w-full max-w-[90%] mx-auto z-10 p-8 h-full flex flex-col gap-8">
                <div className="mb-4 animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                        <div className="flex-1">
                            <div className="mb-6">
                                <div className="items-center gap-4 mb-3">
                                    <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                                        Automation Workflows
                                    </h1>
                                    <div
                                        className="h-1.5 w-12 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                                        style={{ backgroundColor: accentColor }}
                                    />
                                </div>
                            </div>
                           
                            <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                                Manage and monitor your automated workflows. Connect different applications and services to create seamless data flows.
                            </p>
                        </div>
 
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md gap-2">
                                            <ArrowUpDown className="h-4 w-4" />
                                            <span className="font-semibold">Sort</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 rounded-xl border-slate-200 dark:border-white/10">
                                        <DropdownMenuItem onClick={() => setSortBy('name')}>By Name</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortBy('date')}>By Date Created</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortBy('recent')}>By Recent Activity</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortBy('runs')}>By Run Count</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md"
                                    onClick={onRefresh}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={cn("h-4 w-4 text-slate-500", isLoading && "animate-spin")} />
                                </Button>
                            </div>
 
                            <Button
                                className="h-11 px-6 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                                onClick={onCreate}
                            >
                                <Plus className="h-5 w-5" />
                                Create New
                            </Button>
                        </div>
                    </div>
 
                    <div className="relative group max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="SEARCH AUTOMATIONS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-11 pl-12 pr-10 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        {search && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                onClick={() => setSearch('')}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
 
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-0">
                        <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 pt-2"
                >
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 border-slate-200 dark:border-white/10">
                          <TableHead className="w-[80px] text-center font-bold text-slate-500 dark:text-slate-400">#</TableHead>
                          <TableHead className="font-bold text-slate-900 dark:text-white">Automation Name</TableHead>
                          <TableHead className="text-center font-bold text-slate-900 dark:text-white">Created</TableHead>
                          <TableHead className="text-center font-bold text-slate-900 dark:text-white">Stats</TableHead>
                          <TableHead className="text-center font-bold text-slate-900 dark:text-white">Status</TableHead>
                          <TableHead className="text-right pr-8 font-bold text-slate-900 dark:text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: itemsPerPage }).map((_, i) => (
                          <TableRow key={i} className="border-slate-100 dark:border-white/5 w-full">
                            <TableCell className="text-center">
                              <Skeleton className="h-4 w-6 mx-auto bg-slate-200 dark:bg-white/10" />
                            </TableCell>
 
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-white/10" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-40 bg-slate-200 dark:bg-white/10" />
                                  <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-white/10" />
                                </div>
                              </div>
                            </TableCell>
 
                            <TableCell className="text-center">
                              <Skeleton className="h-4 w-24 mx-auto bg-slate-200 dark:bg-white/10" />
                            </TableCell>
 
                            <TableCell className="text-center">
                              <Skeleton className="h-4 w-16 mx-auto bg-slate-200 dark:bg-white/10" />
                            </TableCell>
 
                            <TableCell className="text-center">
                              <Skeleton className="h-5 w-10 mx-auto rounded-full bg-slate-200 dark:bg-white/10" />
                            </TableCell>
 
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-white/10" />
                                <Skeleton className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-white/10" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 pt-2"
                >
                  {paginatedAutomations.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 dark:bg-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 border-slate-200 dark:border-white/10">
                            <TableHead className="w-[80px] text-center font-bold text-slate-500 dark:text-slate-400">#</TableHead>
                            <TableHead className="font-bold text-slate-900 dark:text-white">Automation Name</TableHead>
                            <TableHead className="text-center font-bold text-slate-900 dark:text-white">Created</TableHead>
                            <TableHead className="text-center font-bold text-slate-900 dark:text-white">Stats</TableHead>
                            <TableHead className="text-center font-bold text-slate-900 dark:text-white">Status</TableHead>
                            <TableHead className="text-right pr-8 font-bold text-slate-900 dark:text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedAutomations.map((item, index) => (
                            <TableRow
                              key={item.id}
                              className="group cursor-pointer border-slate-100 dark:border-white/5 hover:bg-blue-500/[0.02] dark:hover:bg-blue-500/[0.05] transition-colors"
                              onClick={() => onOpenEditor(item)}
                            >
                              <TableCell className="text-center font-mono text-xs text-slate-400">
                                {index + 1 + (currentPage - 1) * itemsPerPage}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/10">
                                    <Workflow className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                                      {item.name}
                                    </div>
                                    {item.tags && item.tags.length > 0 && (
                                      <div className="flex gap-1 mt-1">
                                        {item.tags.map(tag => (
                                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                  <CalendarIcon className="h-3.5 w-3.5 opacity-50" />
                                  {item.createdDate}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-3">
                                  <div className="flex items-center gap-1 text-xs">
                                    <Layers className="h-3 w-3 text-blue-500" />
                                    {item.nodes?.length-1 || 0}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs">
                                    <PlayCircle className="h-3 w-3 text-emerald-500" />
                                    {item.triggerCount || 0}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-3" onClick={e => e.stopPropagation()}>
                                  <Switch
                                    checked={item.status}
                                    onCheckedChange={() => onToggleStatus(item.id, item.status)}
                                    className="scale-90 data-[state=checked]:bg-emerald-500"
                                  />
                                  <div className={`
                                    w-2 h-2 rounded-full shadow-[0_0_8px]
                                    ${item.status ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-400 shadow-slate-400/50'}
                                  `} />
                                </div>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => onOpenEditor(item)}
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                                      <DropdownMenuItem onClick={() => onEditName(item)} className="gap-2">
                                        <PencilIcon className="h-4 w-4" /> Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => onDelete(item.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2"
                                      >
                                        <TrashIcon className="h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center border border-border text-muted-foreground">
                        <Workflow className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">No automations found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          {search ? "No automations match your search criteria." : "Create your first automation to start automating workflows."}
                        </p>
                      </div>
                       <Button
                        className="gap-2 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl"
                        onClick={onCreate}
                      >
                        <PlusIcon className="h-4 w-4" />
                        Get Started
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
 
        <div className="mt-8">
            <CustomPagination
                currentPage={currentPage}
                totalItems={filteredAutomations.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            />
        </div>
      </div>
    </div>
  );
}
 
 