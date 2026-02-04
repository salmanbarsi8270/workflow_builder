import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Edit3, UserCircle, Loader2, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '@/ui_components/api/apiurl';

interface Instruction {
    id: string;
    name: string;
    system_prompt: string;
    created_at: string;
}

export default function InstructionLibrary() {
    const { user } = useUser();
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', system_prompt: '' });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
        setDeletingId(id);
        try {
            await axios.delete(`${API_URL}/api/v1/ai/personas/${id}?userId=${user?.id}`);
            setInstructions(prev => prev.filter(p => p.id !== id));
            toast.success("Instruction removed");
        } catch (e) {
            toast.error("Failed to delete instruction");
        } finally {
            setDeletingId(null);
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

    return (
        <div className="p-8 h-full flex flex-col gap-6 w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Instruction Library</h1>
                    <p className="text-slate-500 dark:text-slate-400">Define reusable system prompts for your AI agents.</p>
                </div>
                {!isAdding && (
                    <Button className="bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => setIsAdding(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Instruction
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-2 border-blue-500/50 shadow-xl animate-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-blue-500" />
                            {editingId ? 'Edit Instruction' : 'Create New Instruction'}
                        </CardTitle>
                        <CardDescription>Give your AI specific guidance and instructions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Instruction Name</label>
                            <Input
                                placeholder="e.g. Legal Expert, Senior Dev, Creative Writer"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">System Instructions</label>
                            <Textarea
                                placeholder="Describe exactly how this instruction should behave..."
                                className="h-32 font-mono text-sm"
                                value={formData.system_prompt}
                                onChange={e => setFormData({ ...formData, system_prompt: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Instruction
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
            ) : instructions.length === 0 ? (
                <div className="text-center p-20 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                    <UserCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Instructions Yet</h3>
                    <p className="text-sm text-slate-500 mb-6">Create an instruction to reuse content across multiple agents.</p>
                    <Button variant="outline" onClick={() => setIsAdding(true)}>Get Started</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {instructions.map(instruction => (
                        <Card key={instruction.id} className="group hover:shadow-lg transition-all dark:bg-slate-900/50 dark:border-slate-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                            <UserCircle className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-base truncate max-w-[150px]">{instruction.name}</CardTitle>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon-sm" variant="ghost" onClick={() => startEdit(instruction)}>
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            className="text-red-500"
                                            onClick={() => handleDelete(instruction.id)}
                                            disabled={deletingId === instruction.id}
                                        >
                                            {deletingId === instruction.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border dark:border-slate-800">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-4 italic leading-relaxed">
                                        "{instruction.system_prompt}"
                                    </p>
                                </div>
                                <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                    CREATED {new Date(instruction.created_at).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
