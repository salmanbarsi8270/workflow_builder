import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { PlusIcon, MoreHorizontal, TrashIcon, EyeIcon, PencilIcon, PlayCircle, Sparkles, CalendarIcon, Workflow, Layers, ArrowUpDown, Plus, Search, X, RefreshCw, } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
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
  deletingId?: string | null;
}

type SortType = 'name' | 'date' | 'recent' | 'runs';

export default function AutomationList({ automations, search, setSearch, onToggleStatus, onDelete, onEditName, onOpenEditor, onCreate, isLoading = false, onRefresh, deletingId }: AutomationListProps) {
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
    <div className="space-y-6 animate-in fade-in duration-500">

      <Card className="flex flex-col h-[calc(100vh-4rem)] bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Workflow className="h-6 w-6 text-blue-500" />
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

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-none sm:w-80">
                  <Input
                    placeholder="Search automations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                  {search && (
                    <Button variant="ghost" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-slate-100 dark:hover:bg-white/5" onClick={() => setSearch('')}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4 text-slate-500", isLoading && "animate-spin")} />
                </Button>
              </div>

              <Button
                className="group relative px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                onClick={onCreate}
              >
                <div className="absolute inset-0 bg-linear-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5" />
                  Create New
                </div>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-0">
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
                                  {item.nodes?.length - 1 || 0}
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
                                      disabled={deletingId === item.id}
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2 disabled:opacity-50"
                                    >
                                      {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                      Delete
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
        </CardContent>

        {/* Footer */}
        <CustomPagination
          currentPage={currentPage}
          totalItems={filteredAutomations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />

      </Card>
    </div>
  );
}