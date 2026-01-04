import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Sparkles, Check, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    SlackIcon, 
    GoogleIcon, 
    GithubIcon, 
    Mail01Icon, 
    Calendar03Icon, 
    ZapIcon, 
    MessageProgrammingIcon,
    File01Icon
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Template {
    id: string;
    name: string;
    description: string;
}

interface TemplateGalleryProps {
    userId: string;
    onSuccess?: (flowId: string) => void;
    showNameInput?: boolean; // Kept for prop compatibility, but functionality moved to modal
    headerClassName?: string;
    gridClassName?: string;
}

// Helper to determine icon based on text
const getTemplateIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('slack')) return { icon: SlackIcon, color: "text-amber-500 bg-amber-500/10" };
    if (lower.includes('google') || lower.includes('gmail') || lower.includes('sheet')) return { icon: GoogleIcon, color: "text-blue-500 bg-blue-500/10" };
    if (lower.includes('github') || lower.includes('git')) return { icon: GithubIcon, color: "text-zinc-800 dark:text-zinc-200 bg-zinc-500/10" };
    if (lower.includes('email') || lower.includes('mail')) return { icon: Mail01Icon, color: "text-indigo-500 bg-indigo-500/10" };
    if (lower.includes('schedule') || lower.includes('cron')) return { icon: Calendar03Icon, color: "text-green-500 bg-green-500/10" };
    if (lower.includes('http') || lower.includes('webhook')) return { icon: MessageProgrammingIcon, color: "text-pink-500 bg-pink-500/10" };
    return { icon: ZapIcon, color: "text-violet-500 bg-violet-500/10" };
};

export function TemplateGallery({ userId, onSuccess, headerClassName, gridClassName }: TemplateGalleryProps) {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [newAutomationName, setNewAutomationName] = useState("");
    const [isInstantiating, setIsInstantiating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/templates`, {
                withCredentials: true
            });
            if (response.data.success) {
                setTemplates(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
            toast.error("Failed to load templates");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Update name when template is selected
    useEffect(() => {
        if (selectedTemplate) {
             setNewAutomationName(`My ${selectedTemplate.name}`);
             setIsDialogOpen(true);
        }
    }, [selectedTemplate]);

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        // data.state.selectedTemplate is cleared after animation to prevent UI jump? 
        // Or just clear it:
        setSelectedTemplate(null);
        setNewAutomationName("");
    };

    const handleInstantiate = async () => {
        if (!selectedTemplate) return;
        if (!newAutomationName.trim()) {
            toast.error("Please enter a name for your automation");
            return;
        }

        setIsInstantiating(true);
        try {
            const response = await axios.post(`${API_URL}/api/templates/${selectedTemplate.id}/instantiate`, {
                name: newAutomationName || `My ${selectedTemplate.name}`,
                userId: userId
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                toast.success("Automation created successfully!");
                const newId = response.data.data?.id;
                setIsDialogOpen(false); // Close dialog immediately on success
                if (onSuccess) {
                    onSuccess(newId);
                } else if (newId) {
                    navigate(`/automation/${newId}`);
                }
            } else {
                toast.error("Failed to create automation", {
                    description: response.data.error || "Unknown error occurred"
                });
            }
        } catch (error) {
            console.error("Error instantiating template:", error);
            toast.error("Failed to create automation from template");
        } finally {
            setIsInstantiating(false);
        }
    };

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex items-center justify-between">
                    <Label className={cn("text-base font-semibold", headerClassName)}>Choose a Blueprint</Label>
                    <div className="relative w-56">
                        <Input 
                            placeholder="Search templates..." 
                            className="h-9 text-sm bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-violet-500/50 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className={cn("grid gap-4 overflow-y-auto pr-2 flex-1 min-h-0 pb-4", gridClassName || "grid-cols-1")}>
                    {isLoading ? (
                         <div className="flex flex-col items-center justify-center col-span-full py-12 gap-3 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                            <p className="text-sm font-medium animate-pulse">Loading templates...</p>
                        </div>
                    ) : filteredTemplates.length > 0 ? (
                        <AnimatePresence mode='popLayout'>
                            {filteredTemplates.map((template, idx) => {
                                const { icon: Icon, color } = getTemplateIcon(template.name);
                                const isSelected = selectedTemplate?.id === template.id;

                                return (
                                    <motion.div
                                        key={template.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                                        onClick={() => setSelectedTemplate(template)}
                                        className={cn(
                                            "relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 group overflow-hidden",
                                            isSelected 
                                                ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/10 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500" 
                                                : "border-border/60 bg-card hover:bg-accent/50 hover:border-violet-500/30 hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={cn("h-12 w-12 min-w-12 rounded-xl flex items-center justify-center transition-colors", color)}>
                                                <HugeiconsIcon icon={Icon} className="h-6 w-6" strokeWidth={2} />
                                            </div>
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <h3 className={cn("font-bold text-sm leading-none tracking-tight truncate pr-6 text-foreground")}>
                                                    {template.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                    {template.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Hover Effect specific to card */}
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-transparent via-violet-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left" />
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/10 gap-3"
                        >
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                            <span className="text-sm font-medium">No templates match your search</span>
                        </motion.div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Name your Automation</DialogTitle>
                        <DialogDescription>
                            Create a new automation from the <strong>{selectedTemplate?.name}</strong> template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Automation Name</Label>
                            <div className="relative">
                                <Input
                                    id="name"
                                    value={newAutomationName}
                                    onChange={(e) => setNewAutomationName(e.target.value)}
                                    placeholder="e.g. My Automation"
                                    className="pl-10"
                                    autoFocus
                                />
                                <div className="absolute left-3 top-2.5 text-muted-foreground/50">
                                    <HugeiconsIcon icon={File01Icon} className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end gap-2">
                        <Button variant="secondary" onClick={handleCloseDialog}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleInstantiate} 
                            disabled={isInstantiating}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {isInstantiating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Automation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
