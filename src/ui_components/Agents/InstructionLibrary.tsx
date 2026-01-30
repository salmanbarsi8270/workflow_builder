import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Trash2, Plus, Edit3, Loader2, Save,
    Search, Clock, Cpu,
    Sparkles, Terminal, FileText, Code2, MessageSquare
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '@/ui_components/api/apiurl';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
 
interface Instruction {
    id: string;
    name: string;
    system_prompt: string;
    created_at: string;
}
 
export default function InstructionLibrary() {
    const { user } = useUser();
    const { accentColor } = useTheme();
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
 
    // Form State
    const [formData, setFormData] = useState({ name: '', system_prompt: '' });
    const [saving, setSaving] = useState(false);
 
    const fetchInstructions = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data } = await axios.get(`${API_URL}/api/v1/ai/personas?userId=${user.id}`);
            setInstructions(data);
        } catch (error) {
            toast.error("Failed to load instructions");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);
 
    useEffect(() => {
        fetchInstructions();
    }, [fetchInstructions]);
 
    const handleSave = async () => {
        if (!user?.id || !formData.name || !formData.system_prompt) return;
        setSaving(true);
        try {
            if (editingId) {
                const { data } = await axios.patch(`${API_URL}/api/v1/ai/personas/${editingId}`, {
                    ...formData,
                    userId: user.id
                });
                setInstructions(prev => prev.map(p => p.id === editingId ? data : p));
                toast.success("Instruction updated");
            } else {
                const { data } = await axios.post(`${API_URL}/api/v1/ai/personas`, {
                    ...formData,
                    userId: user.id
                });
                setInstructions(prev => [data, ...prev]);
                toast.success("Instruction created");
            }
            resetForm();
        } catch (e) {
            toast.error("Failed to save instruction");
        } finally {
            setSaving(false);
        }
    };
 
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await axios.delete(`${API_URL}/api/v1/ai/personas/${id}?userId=${user?.id}`);
            setInstructions(prev => prev.filter(p => p.id !== id));
            toast.success("Instruction removed");
        } catch (e) {
            toast.error("Failed to delete instruction");
        }
    };
 
    const startEdit = (instruction: Instruction) => {
        setEditingId(instruction.id);
        setFormData({ name: instruction.name, system_prompt: instruction.system_prompt });
        setIsAdding(true);
    };
 
    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', system_prompt: '' });
    }
 
    const filteredInstructions = instructions.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.system_prompt.toLowerCase().includes(searchQuery.toLowerCase())
    );
 
    const getIcon = (idx: number) => {
        const icons = [<Sparkles />, <Terminal />, <Code2 />, <MessageSquare />, <FileText />];
        return icons[idx % icons.length];
    };
 
    const getCategoryTag = (idx: number) => {
        const tags = [
            { label: 'RAG', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
            { label: 'FORMATTING', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
            { label: 'CREATIVE', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
            { label: 'LOGIC', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' }
        ];
        return tags[idx % tags.length];
    };
 
    return (
        <div className="min-h-full bg-transparent text-slate-900 dark:text-white overflow-y-auto relative animate-in fade-in duration-500">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />
 
            <div className="relative w-full max-w-[90%] mx-auto z-10 p-8 h-full flex flex-col gap-8">
                {/* Header Section */}
                <div className="mb-4 animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                        <div className="flex-1">
                            <div className="mb-6">
                                <div className="items-center gap-4 mb-3">
                                    <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                                        Instruction Library
                                    </h1>
                                    <div
                                        className="h-1.5 w-12 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                                        style={{ backgroundColor: accentColor }}
                                    />
                                </div>
                            </div>
                           
                            <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                                Define reusable system prompts for your AI agents. These personas can be assigned to different nodes to maintain consistency across workflows.
                            </p>
                        </div>
 
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="SEARCH INSTRUCTIONS..."
                                    className="pl-10 h-11 w-[260px] rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                           
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="h-11 w-[160px] rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="rag">RAG</SelectItem>
                                    <SelectItem value="formatting">Formatting</SelectItem>
                                    <SelectItem value="creative">Creative</SelectItem>
                                </SelectContent>
                            </Select>
 
                            <Button
                                className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all text-white border-none"
                                style={{ backgroundColor: accentColor, boxShadow: `${accentColor}33 0px 8px 24px` }}
                                onClick={() => setIsAdding(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Instruction
                            </Button>
                        </div>
                    </div>
                </div>
 
            {/* shadcn/ui Dialog */}
            <Dialog open={isAdding} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="w-full max-w-3xl rounded-[40px] border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900 p-0 overflow-hidden">
                    <div className="p-10 space-y-10">
                        <DialogHeader className="space-y-1.5 text-left">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
                                <DialogTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                                    {editingId ? 'Update Persona' : 'Create Persona'}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-5">
                                Setup your reusable system prompt
                            </DialogDescription>
                        </DialogHeader>
 
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    Instruction Name
                                </label>
                                <Input
                                    placeholder="e.g. Legal Expert, Creative Writer"
                                    className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-base font-bold px-6 focus:ring-2 focus:ring-primary-color/20 transition-all outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    System Instructions
                                </label>
                                <Textarea
                                    placeholder="Describe exactly how the AI should behave..."
                                    className="min-h-[240px] rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6 font-mono text-sm leading-relaxed resize-none focus:ring-2 focus:ring-primary-color/20 transition-all outline-none"
                                    value={formData.system_prompt}
                                    onChange={e => setFormData({ ...formData, system_prompt: e.target.value })}
                                />
                            </div>
                        </div>
 
                        <div className="flex items-center justify-end gap-4 pt-4">
                            <Button
                                variant="ghost"
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-400"
                                onClick={resetForm}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all text-white border-none"
                                style={{
                                    backgroundColor: accentColor,
                                    boxShadow: `${accentColor}40 0px 12px 32px`
                                }}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                                Save Instruction
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
 
            {/* Grid Content */}
            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-slate-300" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Placeholder Card */}
                    <div
                        className="group relative h-full min-h-[380px] rounded-[32px] border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/2 flex flex-col items-center justify-center gap-6 transition-all duration-500 cursor-pointer"
                        onClick={() => setIsAdding(true)}
                    >
                        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors shadow-sm">
                            <Plus className="h-7 w-7" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Create New System Prompt</p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                                Define a reusable set of instructions for your workflows.
                            </p>
                        </div>
                    </div>
 
                    {filteredInstructions.map((instruction, idx) => {
                        const tag = getCategoryTag(idx);
                        return (
                            <Card key={instruction.id} className="group relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 hover:shadow-2xl transition-all duration-500 flex flex-col">
                                <CardContent className="p-8 flex flex-col gap-6 h-full">
                                    {/* Action Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="h-12 w-12 rounded-[16px] flex items-center justify-center shadow-sm bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                                                style={{ color: idx % 2 === 0 ? accentColor : undefined }}
                                            >
                                                {getIcon(idx)}
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3 className="font-black text-slate-900 dark:text-white truncate text-lg tracking-tight max-w-[140px]" title={instruction.name}>
                                                    {instruction.name}
                                                </h3>
                                                <div className={cn("inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", tag.color)}>
                                                    {tag.label}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => startEdit(instruction)}>
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(instruction.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
 
                                    {/* Prompt Preview */}
                                    <div className="flex-1 min-h-[140px] p-5 rounded-[20px] bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 relative group/prompt">
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-6 font-mono">
                                            {instruction.system_prompt}
                                        </p>
                                        <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-50 dark:to-slate-950/50 opacity-10 group-hover/prompt:opacity-0 transition-opacity" />
                                    </div>
 
                                    {/* Footer Stats */}
                                    <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {new Date(instruction.created_at || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                            <Cpu className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {Math.round(instruction.system_prompt.length / 4)} tokens
                                            </span>
                                        </div>
                                    </div>
                                   
                                    {/* Decorative Accent */}
                                    <div
                                        className="absolute bottom-0 left-0 h-1 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{ backgroundColor: accentColor }}
                                    />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
}