import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, CheckCircle, Clock, Loader2, AlertCircle, Sparkles, Zap, Brain, Target, Shield, Lightbulb, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL, AI_URL } from '../api/apiurl';
import { toast } from 'sonner';

// Enhanced test cases with more details and icons
const mockTestCases = [
  { 
    id: 1, 
    name: 'Reasoning Test', 
    category: 'Reasoning', 
    difficulty: 'Hard',
    difficultyLevel: 3,
    description: 'Tests logical reasoning and analytical thinking through complex scenarios.',
    detailedDescription: 'Focuses on identifying patterns, evaluating arguments, and drawing accurate conclusions. Designed to measure structured problem-solving ability under time constraints.',
    icon: '🧠',
    iconComponent: <Brain className="w-5 h-5" />,
    timeEstimate: '2-3 min',
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-500/30',
    metrics: ['Logical reasoning', 'Pattern recognition', 'Analytical thinking']
  },
  { 
    id: 2, 
    name: 'Code Generation', 
    category: 'Programming', 
    difficulty: 'Medium',
    difficultyLevel: 2,
    description: 'Evaluates ability to generate clean, efficient, and correct code.',
    detailedDescription: 'Includes logic implementation, debugging, and syntax accuracy. Emphasizes readability, correctness, and problem-solving skills.',
    icon: '💻',
    iconComponent: <Sparkles className="w-5 h-5" />,
    timeEstimate: '1-2 min',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-500/30',
    metrics: ['Code quality', 'Syntax accuracy', 'Problem solving']
  },
  { 
    id: 3, 
    name: 'Creative Writing', 
    category: 'Writing', 
    difficulty: 'Easy',
    difficultyLevel: 1,
    description: 'Assesses creativity, imagination, and expressive language skills.',
    detailedDescription: 'Focuses on tone, clarity, and originality of ideas. Encourages engaging and well-structured written responses.',
    icon: '✍️',
    iconComponent: <Wand2 className="w-5 h-5" />,
    timeEstimate: '1 min',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
    metrics: ['Creativity', 'Clarity', 'Originality']
  },
  { 
    id: 4, 
    name: 'Math Problem', 
    category: 'Mathematics', 
    difficulty: 'Hard',
    difficultyLevel: 3,
    description: 'Tests mathematical reasoning, accuracy, and calculation skills.',
    detailedDescription: 'Covers problem-solving using formulas, patterns, and numerical analysis. Designed to evaluate precision and step-by-step thinking.',
    icon: '📐',
    iconComponent: <Target className="w-5 h-5" />,
    timeEstimate: '3-4 min',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    borderColor: 'border-rose-200 dark:border-rose-500/30',
    metrics: ['Precision', 'Step-by-step logic', 'Numerical analysis']
  },
  { 
    id: 5, 
    name: 'Translation', 
    category: 'Language', 
    difficulty: 'Medium',
    difficultyLevel: 2,
    description: 'Evaluates accurate translation while preserving meaning and tone.',
    detailedDescription: 'Focuses on preserving meaning, tone, and context. Measures grammatical correctness and linguistic understanding.',
    icon: '🌐',
    iconComponent: <Shield className="w-5 h-5" />,
    timeEstimate: '1-2 min',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-500/30',
    metrics: ['Accuracy', 'Context preservation', 'Grammar']
  },
  {
    id: 6,
    name: 'Context Understanding',
    category: 'Comprehension',
    difficulty: 'Medium',
    difficultyLevel: 2,
    description: 'Tests understanding of context, intent, and subtle nuances.',
    detailedDescription: 'Focuses on interpreting meaning beyond literal words. Evaluates comprehension, inference, and situational awareness.',
    icon: '📚',
    iconComponent: <Lightbulb className="w-5 h-5" />,
    timeEstimate: '2 min',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-500/30',
    metrics: ['Comprehension', 'Inference', 'Situational awareness']
  }
];

interface RunEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onSuccess: () => void;
}

export function RunEvaluationDialog({ open, onOpenChange, userId, onSuccess }: RunEvaluationDialogProps) {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [evaluationMessage, setEvaluationMessage] = useState('');
  const [evaluationName, setEvaluationName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [activeStep, setActiveStep] = useState<'agent' | 'tests' | 'settings'>('agent');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const res = await fetch(`${API_URL}/api/v1/agents?userId=${userId}&tree=true`);
      
      if (res.ok) {
        const data = await res.json();
        setAgents(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to load agents');
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      toast.error('Failed to load agents');
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchAgents();
      setSelectedAgent(null);
      setSelectedTests([]);
      setEvaluationName('');
      setEvaluationMessage('');
      setActiveStep('agent');
      setSearchTerm('');
      setSelectedCategory('all');
    }
  }, [open, userId]);

  const startEvaluation = async () => {
    if (!selectedAgent || selectedTests.length === 0) {
      toast.error("Please select an agent and at least one test case");
      return;
    }

    if (!evaluationName.trim()) {
      toast.error("Please enter an evaluation name");
      return;
    }

    setIsRunning(true);
    toast.loading('Starting evaluation...');

    try {
      const selectedTestDescriptions = mockTestCases
        .filter(test => selectedTests.includes(test.id))
        .map(test => `${test.name} (${test.category}): ${test.detailedDescription}`)
        .join('\n\n');

      const inputMessage = evaluationMessage || "You are a helpful assistant so read the instructions and respond clearly and helpfully to demonstrate your capabilities.";

      const res = await fetch(`${AI_URL}/api/v1/agents/eval/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          input: inputMessage,
          name: evaluationName,
          description: selectedTestDescriptions,
          testCount: selectedTests.length,
          runId: `run_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          userId: userId || ''
        }),
      });

      const data = await res.json();
      toast.dismiss();
      
      if (!data.success) {
        throw new Error(data.error || "Evaluation failed");
      }

      toast.success("Evaluation started successfully!", {
        description: "Results will appear shortly in your dashboard"
      });
      onSuccess();
      onOpenChange(false);

    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsRunning(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      case 'Hard': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-white/10';
    }
  };

  const getDifficultyIcon = (level: number) => {
    return '•'.repeat(level) + '○'.repeat(3 - level);
  };

  const categories = ['all', ...Array.from(new Set(mockTestCases.map(test => test.category)))];

  const filteredTests = mockTestCases.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getProgress = () => {
    let progress = 0;
    if (selectedAgent) progress += 33;
    if (selectedTests.length > 0) progress += 33;
    if (evaluationName.trim()) progress += 34;
    return progress;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[950px] border-slate-200 dark:border-white/10 shadow-2xl p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 min-h-[90vh] max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-slate-200 dark:border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-white/[0.02] bg-[size:20px_20px]" />
          <div className="relative z-10">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white mb-2">
              <div className="p-2.5 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div>
                Start New Evaluation
                <span className="block text-sm font-normal text-slate-600 dark:text-slate-400 mt-1">
                  Configure comprehensive benchmarks for your AI agents
                </span>
              </div>
            </DialogTitle>
            
            {/* Progress Bar */}
            <div className="mt-6 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveStep('agent')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      activeStep === 'agent'
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                      selectedAgent 
                        ? "bg-emerald-500 text-white" 
                        : activeStep === 'agent' 
                          ? "bg-blue-500 text-white" 
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    )}>
                      {selectedAgent ? '✓' : '1'}
                    </div>
                    Agent
                  </button>
                  
                  <button
                    onClick={() => selectedAgent && setActiveStep('tests')}
                    disabled={!selectedAgent}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      activeStep === 'tests'
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        : !selectedAgent
                        ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                      selectedTests.length > 0
                        ? "bg-emerald-500 text-white"
                        : activeStep === 'tests'
                          ? "bg-blue-500 text-white"
                          : !selectedAgent
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    )}>
                      {selectedTests.length > 0 ? '✓' : '2'}
                    </div>
                    Tests
                  </button>
                  
                  <button
                    onClick={() => selectedAgent && selectedTests.length > 0 && setActiveStep('settings')}
                    disabled={!selectedAgent || selectedTests.length === 0}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      activeStep === 'settings'
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        : !selectedAgent || selectedTests.length === 0
                        ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                      evaluationName.trim()
                        ? "bg-emerald-500 text-white"
                        : activeStep === 'settings'
                          ? "bg-blue-500 text-white"
                          : !selectedAgent || selectedTests.length === 0
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    )}>
                      {evaluationName.trim() ? '✓' : '3'}
                    </div>
                    Settings
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {getProgress()}% Complete
                  </span>
                </div>
              </div>
              
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* AGENT SELECTION STEP */}
          {activeStep === 'agent' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Select Agent to Evaluate
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {agents.length} agent{agents.length !== 1 ? 's' : ''} available
                </div>
              </div>
              
              <div className="relative">
                {loadingAgents ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">Loading your agents...</p>
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                    <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400 mb-2">No agents found</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                      Create an agent first to run evaluations
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {agents.map(agent => (
                      <div 
                        key={agent.id} 
                        onClick={() => setSelectedAgent(agent)}
                        className={cn(
                          "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group hover:scale-[1.01] relative overflow-hidden",
                          selectedAgent?.id === agent.id 
                            ? "border-blue-500 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 shadow-lg shadow-blue-500/10"
                            : "border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 bg-white dark:bg-slate-800/50 hover:shadow-md"
                        )}
                      >
                        {selectedAgent?.id === agent.id && (
                          <div className="absolute top-3 right-3 z-10">
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/40" />
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-3 rounded-lg shrink-0 transition-all duration-300",
                            selectedAgent?.id === agent.id
                              ? "bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30"
                              : "bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"
                          )}>
                            <span className={cn(
                              "font-bold text-lg",
                              selectedAgent?.id === agent.id ? "text-white" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {agent.name.substring(0,2).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm mb-1">
                              {agent.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                              {agent.description || "No description"}
                            </p>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                                {agent.model || "Unknown model"}
                              </span>
                              {agent.created_at && (
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  Created {new Date(agent.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedAgent && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setActiveStep('tests')}
                    className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
                  >
                    Continue to Tests
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TEST SELECTION STEP */}
          {activeStep === 'tests' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Select Test Cases
                </h3>
                <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search test cases..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                  <span className="text-xs font-bold bg-linear-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                    {selectedTests.length} Selected
                  </span>
                </div>
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                        selectedCategory === category
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {category === 'all' ? 'All Categories' : category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTests.map(test => (
                  <div 
                    key={test.id}
                    onClick={() => setSelectedTests(prev => 
                      prev.includes(test.id) 
                        ? prev.filter(id => id !== test.id) 
                        : [...prev, test.id]
                    )}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group hover:scale-[1.01] relative overflow-hidden h-full",
                      selectedTests.includes(test.id)
                        ? `${test.borderColor} ${test.bgColor} shadow-lg shadow-current/10`
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-slate-800/50"
                    )}
                  >
                    {selectedTests.includes(test.id) && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-900/40" />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-linear-to-br ${test.color} text-white`}>
                          {test.iconComponent}
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full border",
                          getDifficultyColor(test.difficulty)
                        )}>
                          {getDifficultyIcon(test.difficultyLevel)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                      {test.name}
                    </h3>
                    
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                      {test.description}
                    </p>
                    
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-500 mb-3">
                      <Clock className="w-3 h-3" />
                      <span>{test.timeEstimate}</span>
                      <span className="mx-1">•</span>
                      <span>{test.category}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {test.metrics.map((metric, idx) => (
                        <span 
                          key={idx}
                          className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredTests.length === 0 && (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                  <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No test cases found</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Try a different search term or category
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  onClick={() => setActiveStep('agent')}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 font-medium flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to Agent
                </button>
                
                {selectedTests.length > 0 && (
                  <button
                    onClick={() => setActiveStep('settings')}
                    className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
                  >
                    Continue to Settings
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS STEP */}
          {activeStep === 'settings' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500" />
                  Configure Evaluation
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Configuration */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 p-5">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Evaluation Details</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Evaluation Name *
                          <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                            Give this evaluation a descriptive name
                          </span>
                        </label>
                        <input 
                          type="text" 
                          value={evaluationName}
                          onChange={(e) => setEvaluationName(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="e.g. Weekly Performance Benchmark - March 2024"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Custom Prompt (Optional)
                          <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                            Override the default test prompts
                          </span>
                        </label>
                        <textarea 
                          value={evaluationMessage}
                          onChange={(e) => setEvaluationMessage(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-y transition-all"
                          placeholder="Enter a specific scenario or instructions for the agent..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Summary */}
                <div className="space-y-6">
                  <div className="bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl border border-slate-200 dark:border-white/10 p-5">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Evaluation Summary</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Selected Agent:</span>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          {selectedAgent?.name || 'None'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Test Cases:</span>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          {selectedTests.length} selected
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Estimated Time:</span>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          ~{selectedTests.length * 2} minutes
                        </span>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Selected Tests:</div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {mockTestCases
                            .filter(test => selectedTests.includes(test.id))
                            .map(test => (
                              <div key={test.id} className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full bg-linear-to-r ${test.color}`} />
                                <span className="text-slate-700 dark:text-slate-300">{test.name}</span>
                                <span className="ml-auto text-slate-500 dark:text-slate-500">{test.timeEstimate}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-500/30 p-5">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">Ready to Run</h4>
                    <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mb-4">
                      All requirements are satisfied. Click Run Evaluation to begin.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  onClick={() => setActiveStep('tests')}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 font-medium flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to Tests
                </button>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onOpenChange(false)}
                    className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={startEvaluation}
                    disabled={isRunning || !evaluationName.trim()}
                    className="px-6 py-2.5 text-white font-medium rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting Evaluation...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Evaluation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ready</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Advanced</span>
              </div>
            </div>
            <div>
              Total estimated time: ~{selectedTests.length * 2} minutes
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add missing icon imports
const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Search = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);