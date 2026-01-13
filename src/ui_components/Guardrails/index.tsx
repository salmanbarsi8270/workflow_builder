import { useState, useEffect } from 'react';
import { Shield, Trash2, Plus, Mail, Lock, Loader2, Phone, X, AlertTriangle, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner";
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';

interface GuardrailItem {
    type: 'email' | 'phone' | 'sensitive' | 'profanity' | 'maxlength';
    config: Record<string, any>;
}

export default function Guardrails() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bannedWords, setBannedWords] = useState<string[]>([]);
    const [newWord, setNewWord] = useState('');
    const [outputGuardrails, setOutputGuardrails] = useState<GuardrailItem[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');

    useEffect(() => {
        fetchGuardrails();
    }, []);

    const fetchGuardrails = async () => {
        try {
            console.log('📡 [Guardrails:UI] Fetching configuration from:', `${API_URL}/api/guardrails`);
            const response = await axios.get(`${API_URL}/api/guardrails`);
            const data = response.data;
            console.log('✅ [Guardrails:UI] Data received:', data);
            setBannedWords(data.inputGuardrails?.bannedWords || []);

            // Handle migration/legacy format
            const list = data.outputGuardrails?.list || [];
            if (data.outputGuardrails?.emailRedaction && !list.find((i: any) => i.type === 'email')) {
                list.push({ type: 'email', config: { replacement: '[hidden-email]' } });
            }
            setOutputGuardrails(list);
        } catch (error) {
            console.error('❌ [Guardrails:UI] Error fetching guardrails:', error);
            toast.error("Failed to load guardrails configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // UX Tweak: If there's a word in the input that wasn't "added" yet, add it now
            let finalBannedWords = [...bannedWords];
            if (newWord.trim() && !finalBannedWords.includes(newWord.trim())) {
                finalBannedWords.push(newWord.trim());
                setBannedWords(finalBannedWords);
                setNewWord('');
            }

            const newConfig = {
                inputGuardrails: { bannedWords: finalBannedWords },
                outputGuardrails: {
                    list: outputGuardrails,
                    emailRedaction: false // Deprecated flag
                }
            };

            console.log('📡 [Guardrails:UI] Saving configuration:', newConfig);
            const response = await axios.post(`${API_URL}/api/guardrails`, newConfig);
            console.log('✅ [Guardrails:UI] Save response:', response.data);

            toast.success("Guardrails saved successfully");
        } catch (error) {
            console.error('❌ [Guardrails:UI] Error saving guardrails:', error);
            toast.error("Failed to save guardrails");
        } finally {
            setSaving(false);
        }
    };

    const addBannedWord = () => {
        if (newWord.trim() && !bannedWords.includes(newWord.trim())) {
            setBannedWords([...bannedWords, newWord.trim()]);
            setNewWord('');
        }
    };

    const removeBannedWord = (word: string) => {
        setBannedWords(bannedWords.filter(w => w !== word));
    };

    const addOutputGuardrail = (type: string) => {
        if (!type) return;

        let initialConfig = {};
        switch (type) {
            case 'email': initialConfig = { replacement: '[hidden-email]' }; break;
            case 'phone': initialConfig = { replacement: '[hidden-phone]' }; break;
            case 'sensitive': initialConfig = { minimumDigits: 6, replacement: '[redacted]' }; break;
            case 'profanity': initialConfig = { mode: 'redact', replacement: '[censored]' }; break;
            case 'maxlength': initialConfig = { maxCharacters: 1000, mode: 'truncate' }; break;
        }

        setOutputGuardrails([...outputGuardrails, { type: type as any, config: initialConfig }]);
        setSelectedType('');
    };

    const removeOutputGuardrail = (index: number) => {
        const newList = [...outputGuardrails];
        newList.splice(index, 1);
        setOutputGuardrails(newList);
    };

    const updateGuardrailConfig = (index: number, key: string, value: any) => {
        const newList = [...outputGuardrails];
        newList[index] = {
            ...newList[index],
            config: { ...newList[index].config, [key]: value }
        };
        setOutputGuardrails(newList);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Agent Guardrails</h1>
                <p className="text-slate-500 dark:text-slate-400">Configure safety filters for agent inputs and outputs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Guardrails */}
                <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-blue-500" />
                            Input Guardrails
                        </CardTitle>
                        <CardDescription>Block specific words or phrases from being processed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add banned word..."
                                value={newWord}
                                onChange={(e) => setNewWord(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addBannedWord()}
                                className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                            />
                            <Button onClick={addBannedWord} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {bannedWords.map(word => (
                                <div key={word} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium animate-in zoom-in duration-300">
                                    <span>{word}</span>
                                    <button onClick={() => removeBannedWord(word)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                            {bannedWords.length === 0 && (
                                <div className="text-sm text-slate-400 italic py-4">No banned words configured.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Output Guardrails */}
                <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            Output Guardrails
                        </CardTitle>
                        <CardDescription>Filter and redact sensitive information from agent responses.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-2">
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                                    <SelectValue placeholder="Select Guardrail Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Email Redaction</SelectItem>
                                    <SelectItem value="phone">Phone Number Redaction</SelectItem>
                                    <SelectItem value="sensitive">Sensitive Number Redaction</SelectItem>
                                    <SelectItem value="profanity">Profanity Check</SelectItem>
                                    <SelectItem value="maxlength">Max Length Limit</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={() => addOutputGuardrail(selectedType)}
                                disabled={!selectedType}
                                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                            >
                                <Plus className="h-5 w-5 mr-1" /> Add
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {outputGuardrails.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative group animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {item.type === 'email' && <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Mail className="h-4 w-4" /></div>}
                                            {item.type === 'phone' && <div className="p-2 rounded-lg bg-green-500/10 text-green-500"><Phone className="h-4 w-4" /></div>}
                                            {item.type === 'sensitive' && <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500"><AlertTriangle className="h-4 w-4" /></div>}
                                            {item.type === 'profanity' && <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><MessageSquare className="h-4 w-4" /></div>}
                                            {item.type === 'maxlength' && <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><MoreHorizontal className="h-4 w-4" /></div>}

                                            <span className="font-bold text-sm capitalize">{item.type === 'maxlength' ? 'Max Length' : item.type + ' Redaction'}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeOutputGuardrail(idx)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Config Inputs */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {['email', 'phone', 'sensitive', 'profanity'].includes(item.type) && (
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Replacement Text</Label>
                                                <Input
                                                    value={item.config.replacement || ''}
                                                    onChange={(e) => updateGuardrailConfig(idx, 'replacement', e.target.value)}
                                                    className="h-8 text-xs bg-white dark:bg-slate-900/50"
                                                />
                                            </div>
                                        )}
                                        {item.type === 'sensitive' && (
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Min Digits</Label>
                                                <Input
                                                    type="number"
                                                    value={item.config.minimumDigits || 6}
                                                    onChange={(e) => updateGuardrailConfig(idx, 'minimumDigits', parseInt(e.target.value))}
                                                    className="h-8 text-xs bg-white dark:bg-slate-900/50"
                                                />
                                            </div>
                                        )}
                                        {item.type === 'maxlength' && (
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Max Characters</Label>
                                                <Input
                                                    type="number"
                                                    value={item.config.maxCharacters || 1000}
                                                    onChange={(e) => updateGuardrailConfig(idx, 'maxCharacters', parseInt(e.target.value))}
                                                    className="h-8 text-xs bg-white dark:bg-slate-900/50"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {outputGuardrails.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                                    No output guardrails active.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-10 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save All Configurations"
                    )}
                </Button>
            </div>
        </div>
    );
}
