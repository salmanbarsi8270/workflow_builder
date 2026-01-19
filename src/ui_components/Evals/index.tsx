import { useState, useEffect } from 'react';
import { RunEvaluationDialog } from './RunEvaluationDialog';
import { EvaluationDetailsSheet } from './EvaluationDetailsSheet';
import { CustomPagination } from '../Shared/CustomPagination';
import { 
  Play, Trash2, BarChart3, 
  RefreshCcw, Loader2, 
  Brain, Zap, Eye, 
  RefreshCw, ChevronDown, X, Sparkles,
  Search, Filter, 
  TrendingUp, Clock,
  User
} from 'lucide-react';
import { AI_URL } from '../api/apiurl';
import { useUser } from '@/context/UserContext';
import { cn } from "@/lib/utils";
import { Toaster, toast } from 'sonner';

interface Evaluation {
  eval_id: string;
  name: string;
  description: string;
  agent_name: string;
  agent_id?: string;
  agent_model?: string;
  score: number;
  status: string;
  created_at: string;
  model: string;
  test_count: number;
  duration?: number;
  output?: string;
  scores?: any;
  scores_reason?: string;
  result?: {
    input: string;
    output: string;
    score: number;
    reason: string;
  };
}

export default function Evals() {
  const { user } = useUser();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingEvals, setLoadingEvals] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [selectedEvalForDetails, setSelectedEvalForDetails] = useState<Evaluation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryInput, setRetryInput] = useState<any>("");
  const [retryEvaluationData, setRetryEvaluationData] = useState<Evaluation | null>(null);
  
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<string>('all');

  const fetchEvaluations = async () => {
    try {
      setLoadingEvals(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        status: statusFilter === 'all' ? '' : statusFilter,
        agentId: agentFilter === 'all' ? '' : agentFilter,
        userId: user?.id || ''
      });

      const res = await fetch(`${AI_URL}/api/v1/agents/eval/list?${params}`);
      const data = await res.json();

      if (data.success) {
        setEvaluations(data.evaluations);
        setFilteredEvaluations(data.evaluations);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || data.total || data.totalRuns || data.count || data.evaluations.length || 0);
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      toast.error('Failed to load evaluations');
    } finally {
      setLoadingEvals(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        userId: user?.id || ''
      });
      const res = await fetch(`${AI_URL}/api/v1/agents/eval/stats?${params}`);
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  useEffect(() => {
    fetchEvaluations();
  }, [page, itemsPerPage, user?.id]);

  useEffect(() => {
    let filtered = [...evaluations];

    if (agentFilter !== 'all') {
      filtered = filtered.filter(item  => item.agent_name === agentFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item  => item.status === statusFilter);
    }

    filtered = filtered.filter(item  => 
      item.score >= scoreRange[0] && item.score <= scoreRange[1]
    );

    if (dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const evalDate = new Date(item.created_at);
        const diffTime = Math.abs(now.getTime() - evalDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (dateRange) {
          case 'today': return diffDays <= 1;
          case 'week': return diffDays <= 7;
          case 'month': return diffDays <= 30;
          default: return true;
        }
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.agent_name.toLowerCase().includes(term)
      );
    }

    setFilteredEvaluations(filtered);
  }, [agentFilter, statusFilter, scoreRange, dateRange, searchTerm, evaluations]);

  const resetFilters = () => {
    setAgentFilter('all');
    setStatusFilter('all');
    setScoreRange([0, 100]);
    setDateRange('all');
    setSearchTerm('');
    setFilteredEvaluations(evaluations);
    setShowFilters(false);
  };

  const retryEvaluation = async (evaluation: Evaluation, newInput: string) => {
    try {
      const newRunId = `run_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const res = await fetch(`${AI_URL}/api/v1/agents/eval/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: evaluation.agent_id || "", 
          input: newInput,
          name: evaluation.name + " (Retry)",
          description: evaluation.description,
          testCount: evaluation.test_count || 1,
          runId: newRunId,
          userId: user?.id || ''
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Retry failed");

      toast.success("Retry evaluation completed!");
      await Promise.all([fetchEvaluations(), fetchStats()]);
      
    } catch (err) {
      console.error(err);
      toast.error("Retry failed");
    }
  };

  const deleteEvaluation = async (evalId: string) => {
    if (!confirm('Are you sure you want to delete this evaluation?')) return;

    try {
      const params = new URLSearchParams({
        userId: user?.id || ''
      });
      const res = await fetch(`${AI_URL}/api/v1/agents/eval/${evalId}?${params}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success("Evaluation deleted");
        await Promise.all([fetchEvaluations(), fetchStats()]);
      } else {
        toast.error('Failed to delete evaluation');
      }
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      toast.error('Failed to delete evaluation');
    }
  };



  const uniqueAgentNames = Array.from(new Set(evaluations.map(item => item.agent_name)));

  return (
    <div className="min-h-full bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-y-scroll relative">
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(59,130,246,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.03)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 w-full flex flex-col min-h-full">
        
        {/* Header Section - Improved with better spacing */}
        <div className="mb-8 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-20" />
                <div className="relative bg-linear-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-xl">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-1">
                  Agent Evaluations
                </h1>
                <p className="text-sm text-slate-600 dark:text-blue-200/70 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  Evaluate, benchmark, and score your AI agents
                </p>
              </div>
            </div>
            
            {/* Header Stats & Button */}
            <div className="flex items-center gap-4">
              {stats && (
                <div className="hidden md:flex items-center gap-4 text-sm">
                  <div className="text-right border-r border-slate-200 dark:border-white/10 pr-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Runs</p>
                    <p className="font-bold text-base">{stats.totalRuns || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Avg Score</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">{Number(stats.avgScore || 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsRunDialogOpen(true)}
                className="group relative px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 overflow-hidden flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-linear-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2 text-white">
                  <Play className="h-4 w-4" />
                  <span className="text-sm font-semibold">Test Evaluation</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Panel - Wider */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">

              {/* Search and Filters Bar - Improved */}
              <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 w-full sm:w-auto sm:min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search evaluations by name, agent, or description..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border transition-all duration-200 flex items-center gap-2 text-sm font-medium",
                        showFilters 
                          ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" 
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                      {showFilters && <ChevronDown className="w-3 h-3 transform rotate-180 ml-1" />}
                    </button>
                    
                    <button 
                      onClick={fetchEvaluations} 
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      disabled={loadingEvals}
                    >
                      <RefreshCcw className={cn("w-4 h-4", loadingEvals && "animate-spin")} />
                    </button>
                  </div>
                </div>

                {/* Expanded Filter Panel - Improved layout */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Status</label>
                        <select 
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="all">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Agent</label>
                        <select 
                          value={agentFilter} 
                          onChange={(e) => setAgentFilter(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="all">All Agents</option>
                          {uniqueAgentNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Date Range</label>
                        <select 
                          value={dateRange} 
                          onChange={(e) => setDateRange(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">Last 7 Days</option>
                          <option value="month">Last 30 Days</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <button 
                          onClick={resetFilters}
                          className="w-full py-2.5 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/30 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Evaluation Results
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                    ({filteredEvaluations.length} {filteredEvaluations.length === 1 ? 'result' : 'results'})
                  </span>
                </h2>
              </div>

              {/* Results List - Improved cards */}
              <div className="space-y-3">
                {loadingEvals ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                    <p className="text-slate-500 text-sm">Loading evaluations...</p>
                  </div>
                ) : filteredEvaluations.length === 0 ? (
                  <div className="text-center py-16 bg-white/50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                    <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 mb-2">No evaluations found</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
                      Try adjusting your filters or create a new evaluation
                    </p>
                    <button
                      onClick={() => setIsRunDialogOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      Run First Evaluation
                    </button>
                  </div>
                ) : (
                  filteredEvaluations.map((ev) => (
                    <div 
                      key={ev.eval_id} 
                      className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
                    >
                      {/* Left Status Stripe */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1",
                        ev.status === 'completed' ? "bg-emerald-500" :
                        ev.status === 'failed' ? "bg-rose-500" :
                        "bg-blue-500"
                      )} />

                      <div className="flex flex-col md:flex-row gap-6 pl-2">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header: Status & Title */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                  ev.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                                  ev.status === 'failed' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" :
                                  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                )}>
                                  {ev.status}
                                </span>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                                  {ev.name}
                                </h3>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {ev.description}
                              </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setSelectedEvalForDetails(ev);
                                  setIsDetailsOpen(true);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  setRetryEvaluationData(ev); 
                                  setRetryInput(ev.scores?.helpfulness?.input || "");  
                                  setShowRetryModal(true);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                title="Retry evaluation"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteEvaluation(ev.eval_id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete evaluation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Metadata Row */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span>{ev.agent_name}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                              <span className="text-slate-400">{new Date(ev.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-1.5">
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>{ev.test_count} tests</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Score Progress */}
                        <div className="w-full md:w-64 flex flex-col justify-end">
                          <div className="flex items-end justify-between mb-2">
                             <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Score</span>
                             <div className={cn(
                               "text-2xl font-black",
                               ev.score >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                               ev.score >= 50 ? "text-amber-600 dark:text-amber-400" :
                               "text-rose-600 dark:text-rose-400"
                             )}>
                               {ev.score}<span className="text-sm text-slate-400 dark:text-slate-500 font-medium">/100</span>
                             </div>
                          </div>
                          
                          <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                             <div 
                               className={cn(
                                 "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
                                 ev.score >= 80 ? "bg-emerald-500" :
                                 ev.score >= 50 ? "bg-amber-500" :
                                 "bg-rose-500"
                               )}
                               style={{ width: `${ev.score}%` }}
                             />
                          </div>
                          
                          <div className="flex justify-end mt-2">
                             <div className={cn(
                               "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border",
                               ev.score >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" :
                               ev.score >= 50 ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" :
                               "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20"
                             )}>
                               {ev.score}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Section */}
              {totalPages > 1 && (
              <CustomPagination 
                currentPage={page}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
                onItemsPerPageChange={setItemsPerPage}
                className="mt-8 border-t border-slate-100 dark:border-white/5 pt-8"
              />
              )}
            </div>
          </div>

          {/* Right Panel - Sidebar Stats */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-lg mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> 
                Performance Overview
              </h3>
              
              {stats ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Global Avg Score</span>
                      <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                        {Number(stats.avgScore || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
                      <div 
                        className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                        style={{ width: `${Math.min(100, stats.avgScore || 0)}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-white/5 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-500 mb-1">Total Runs</p>
                      <p className="font-bold text-2xl text-slate-900 dark:text-white">{stats.totalRuns || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-500 mb-1">Active Agents</p>
                      <p className="font-bold text-2xl text-slate-900 dark:text-white">{stats.agents || 0}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Run Status Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Completed</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{stats.completedCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Failed</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{stats.failedCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)] animate-pulse" />
                          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Running</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{stats.runningCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Quick Action Card */}
            <div className="bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
              <div className="mb-4 bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Quick Evaluation</h3>
              <p className="text-white/80 text-sm mb-4">
                Run a standard quality check on your most active agent in minutes.
              </p>
              <button 
                onClick={() => { 
                  setIsRunDialogOpen(true); 
                  toast.info("Select an agent to begin standard check"); 
                }}
                className="w-full py-2.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-md"
              >
                Run Standard Check
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Retry Modal - Improved */}
      {showRetryModal && retryEvaluationData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                  <RefreshCw className="w-5 h-5 text-blue-500" /> 
                  Retry Evaluation
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Running new test for "{retryEvaluationData.name}"
                </p>
              </div>
              <button 
                onClick={() => setShowRetryModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                New Input Prompt
              </label>
              <textarea 
                value={retryInput}
                onChange={(e) => setRetryInput(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none text-sm transition-all"
                placeholder="Enter your new test prompt here..."
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                This will create a new evaluation with updated input
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRetryModal(false)}
                className="flex-1 py-2.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if(retryEvaluationData) {
                    await retryEvaluation(retryEvaluationData, retryInput);
                    setShowRetryModal(false);
                  }
                }}
                className="flex-1 py-2.5 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/25 flex justify-center items-center gap-2 transition-colors"
              >
                {false ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run Retry"}
              </button>
            </div>
          </div>
        </div>
      )}

      <RunEvaluationDialog 
        open={isRunDialogOpen}
        onOpenChange={setIsRunDialogOpen}
        userId={user?.id}
        onSuccess={() => {
          fetchEvaluations();
          fetchStats();
        }}
      />

      <EvaluationDetailsSheet 
        evaluation={selectedEvalForDetails} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
      />
      
      <Toaster position="bottom-right" />
    </div>
  );
}