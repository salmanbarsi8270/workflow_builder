import { useState, useCallback, useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Plus,
    UserCircle,
    Zap,
    Settings,
    ChevronRight,
    Info,
    ExternalLink,
    Code2,
    RotateCcw,
    Copy,
    Check
} from "lucide-react";
import type { IntegrationApp } from './types';
import { categoryColors } from './constants';
import { motion, AnimatePresence } from 'framer-motion';

interface IntegrationDetailSheetProps {
    app: IntegrationApp | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConnect: (app: IntegrationApp) => void;
    onAction: (type: 'trigger' | 'action', initialData?: any) => void;
}

export function IntegrationDetailSheet({ app, open, onOpenChange, onConnect, onAction }: IntegrationDetailSheetProps) {
    const [activeTab, setActiveTab] = useState<'triggers' | 'actions'>('triggers');
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [showDefinition, setShowDefinition] = useState<string | null>(null);
    const [width, setWidth] = useState<number>(window.innerWidth * 0.4); // Initial size 40%
    const [isResizing, setIsResizing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Reset width if window is resized manually (optional but good for responsiveness)
    useEffect(() => {
        const handleWindowResize = () => {
            if (!isResizing && width > window.innerWidth) {
                setWidth(window.innerWidth * 0.4);
            }
        };
        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, [isResizing, width]);

    // Resize Logic
    const startResizing = useCallback((e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            // Constraints: 20% to 90% of screen width
            if (newWidth > window.innerWidth * 0.2 && newWidth < window.innerWidth * 0.95) {
                setWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    // Handle Reset
    const handleReset = () => {
        setSelectedItem(null);
        setActiveTab('triggers');
        setWidth(window.innerWidth * 0.4); // Reset size to 40%
    };

    if (!app) return null;

    const colors = categoryColors[app.category || 'default'] || categoryColors.default;
    const metadata = app.metadata;
    const items = activeTab === 'triggers' ? metadata?.triggers : metadata?.actions;
    const fullMetadata = metadata?.fullMetadata?.[activeTab === 'triggers' ? 'triggers' : 'actions'] || {};

    const handleItemClick = (name: string) => {
        setSelectedItem(selectedItem === name ? null : name);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className={`p-0 border-l border-border bg-background flex flex-col h-full overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-none !max-w-none ${isResizing ? 'transition-none' : 'transition-all duration-300 ease-out'}`}
                style={{ width: `${width}px` }}
            >
                {/* Resize Handle - More Visible and Interactive */}
                <div
                    className={`absolute left-0 top-0 w-2 h-full cursor-ew-resize z-[100] group transition-colors ${isResizing ? 'bg-blue-500/20' : 'hover:bg-blue-500/10'}`}
                    onMouseDown={startResizing}
                >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full transition-colors ${isResizing ? 'bg-blue-400' : 'bg-muted group-hover:bg-blue-400/50'}`} />
                </div>

                {/* Reset Button - Top Left - Higher Priority Z-Index */}
                <div className="absolute top-4 left-6 z-[110]">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                        }}
                        title="Reset Sidebar"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>

                {/* Main Content Container - Pointer Events None during resize */}
                <div className={`flex-1 flex flex-col min-h-0 ${isResizing ? 'pointer-events-none opacity-80' : ''}`}>
                    {/* Header Section - Horizontal Layout */}
                    <div className="pt-8 px-10 pb-6 space-y-6 relative border-b border-border bg-linear-to-b from-blue-500/[0.02] to-transparent shrink-0">
                        <div className="flex items-start gap-6 ml-6"> {/* Space for Reset button */}
                            {/* Icon Container */}
                            <div className="p-4 rounded-xl bg-muted/30 border border-border shadow-2xl relative shrink-0 group transition-all duration-500 hover:scale-105">
                                <img src={app.icon} alt={app.name} className="w-12 h-12 object-contain" />
                                {app.connected && (
                                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-lg shadow-emerald-500/20" />
                                )}
                            </div>

                            {/* Title & Info */}
                            <div className="flex-1 space-y-2.5 pt-0.5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-3">
                                            <SheetTitle className="text-2xl font-bold tracking-tight text-foreground leading-none">
                                                {app.name}
                                            </SheetTitle>
                                            <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border} border-opacity-30 text-[8px] uppercase font-bold tracking-[0.1em] px-2 py-0.5 rounded-md`}>
                                                {app.category}
                                            </Badge>
                                        </div>
                                        <SheetDescription className="text-muted-foreground/60 font-medium text-xs leading-relaxed max-w-md line-clamp-1">
                                            {app.description}
                                        </SheetDescription>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <Button
                                        className="h-9 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                                        onClick={() => onConnect(app)}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-2" />
                                        {app.connected ? "Add Account" : "Connect Now"}
                                    </Button>
                                    {app.connected && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                                            <UserCircle className="h-4 w-4 text-blue-400" />
                                            <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest">Connected</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <Tabs defaultValue="triggers" className="flex-1 flex flex-col overflow-hidden" onValueChange={(v) => {
                        setActiveTab(v as any);
                        setSelectedItem(null);
                    }}>
                        <div className="px-10 pt-5">
                            <TabsList className="inline-flex h-10 bg-muted/50 rounded-lg border border-border p-1 gap-1">
                                <TabsTrigger value="triggers" className="px-6 rounded-md font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-blue-400 dark:data-[state=active]:bg-white/10 transition-all">
                                    <Zap className="h-3 w-3 mr-2" />
                                    Triggers
                                </TabsTrigger>
                                <TabsTrigger value="actions" className="px-6 rounded-md font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-indigo-400 dark:data-[state=active]:bg-white/10 transition-all">
                                    <Settings className="h-3 w-3 mr-2" />
                                    Actions
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value={activeTab} className="flex-1 min-h-0 mt-6 flex flex-col outline-none">
                            <ScrollArea className="flex-1 h-full">
                                <div className="px-12 pb-12">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                                            Available {activeTab}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-[9px] font-bold uppercase tracking-wider text-blue-400 hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                            onClick={() => onAction(activeTab === 'triggers' ? 'trigger' : 'action')}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-2" />
                                            Add {activeTab === 'triggers' ? 'Trigger' : 'Action'}
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {items?.length ? (
                                            items.map((itemName) => {
                                                const detail = fullMetadata[itemName];
                                                const isSelected = selectedItem === itemName;

                                                return (
                                                    <div key={itemName} className="group">
                                                        <div
                                                            className={`
                                                            p-5 rounded-xl border transition-all duration-300 cursor-pointer
                                                            ${isSelected
                                                                    ? 'bg-blue-500/[0.03] border-blue-500/30'
                                                                    : 'bg-muted/30 border-border/50 hover:border-border hover:bg-muted'
                                                                }
                                                        `}
                                                            onClick={() => handleItemClick(itemName)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`p-2.5 rounded-lg ${activeTab === 'triggers' ? 'bg-emerald-500/10' : 'bg-indigo-500/10'} group-hover:scale-105 transition-transform duration-300`}>
                                                                        {activeTab === 'triggers' ? (
                                                                            <Zap className={`h-4 w-4 ${isSelected ? 'text-emerald-400' : 'text-muted-foreground group-hover:text-emerald-400'} transition-colors duration-300`} />
                                                                        ) : (
                                                                            <Settings className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-indigo-400'} transition-colors duration-300`} />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className={`text-sm font-bold tracking-tight ${isSelected ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground'}`}>
                                                                            {detail?.label || itemName}
                                                                        </h4>
                                                                        <p className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-widest mt-0.5">{itemName}</p>
                                                                    </div>
                                                                </div>
                                                                <ChevronRight className={`h-4 w-4 text-muted-foreground/40 transition-all duration-300 ${isSelected ? 'rotate-90 text-blue-400 scale-110' : 'group-hover:text-muted-foreground'}`} />
                                                            </div>

                                                            <AnimatePresence>
                                                                {isSelected && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="pt-6 mt-6 border-t border-border space-y-6">
                                                                            <div className="space-y-3">
                                                                                <h5 className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 flex items-center gap-2">
                                                                                    <Info className="h-3.5 w-3.5 text-blue-400" />
                                                                                    Documentation
                                                                                </h5>
                                                                                <p className="text-sm text-foreground/60 leading-relaxed font-medium bg-muted/30 p-4 rounded-xl border border-border">
                                                                                    {detail?.description || "No description available for this item."}
                                                                                </p>
                                                                            </div>

                                                                            {/* Definition View Toggle */}
                                                                            <div className="space-y-3">
                                                                                <div className="flex items-center justify-between">
                                                                                    <h5 className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 flex items-center gap-2">
                                                                                        <Code2 className="h-3.5 w-3.5 text-blue-400" />
                                                                                        Definition
                                                                                    </h5>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-7 px-3 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setShowDefinition(showDefinition === itemName ? null : itemName);
                                                                                        }}
                                                                                    >
                                                                                        {showDefinition === itemName ? 'Hide Definition' : 'Show Definition'}
                                                                                    </Button>
                                                                                </div>

                                                                                <AnimatePresence>
                                                                                    {showDefinition === itemName && (
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, height: 0 }}
                                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                                            exit={{ opacity: 0, height: 0 }}
                                                                                            className="relative group overflow-hidden"
                                                                                        >
                                                                                            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                <Button
                                                                                                    variant="outline"
                                                                                                    size="icon"
                                                                                                    className="h-8 w-8 rounded-lg bg-background/50 backdrop-blur-md border border-border hover:bg-muted"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
                                                                                                        setCopied(itemName);
                                                                                                        setTimeout(() => setCopied(null), 2000);
                                                                                                    }}
                                                                                                >
                                                                                                    {copied === itemName ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                                                                </Button>
                                                                                            </div>
                                                                                            <pre className="p-5 rounded-xl bg-slate-50 dark:bg-black/40 border border-border text-[11px] font-mono text-slate-800 dark:text-blue-200/70 overflow-x-auto custom-scrollbar shadow-inner max-h-[400px]">
                                                                                                {JSON.stringify(detail, null, 2)}
                                                                                            </pre>
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>


                                                                            {detail?.parameters && detail.parameters.length > 0 && (
                                                                                <div className="space-y-3">
                                                                                    <h5 className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
                                                                                        Required Configuration
                                                                                    </h5>
                                                                                    <div className="grid grid-cols-1 gap-2">
                                                                                        {detail.parameters.map((param: any) => (
                                                                                            <div key={param.name} className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between group/param hover:border-blue-500/20 transition-all duration-200">
                                                                                                <div className="min-w-0">
                                                                                                    <p className="text-xs font-bold text-foreground/80 truncate">
                                                                                                        {param.label || param.name}
                                                                                                        {param.required && <span className="text-red-400/80 ml-1 font-bold">*</span>}
                                                                                                    </p>
                                                                                                    <span className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-tighter mt-0.5 block">
                                                                                                        {param.type} • {param.name}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <Badge variant="ghost" className="text-[8px] font-bold px-2 py-0.5 bg-muted text-muted-foreground uppercase tracking-widest group-hover/param:text-blue-400 transition-all">
                                                                                                    {param.type}
                                                                                                </Badge>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            <Button
                                                                                className="w-full h-11 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onAction(activeTab === 'triggers' ? 'trigger' : 'action', {
                                                                                        name: itemName,
                                                                                        definition: detail
                                                                                    });
                                                                                }}
                                                                            >
                                                                                Activate {activeTab === 'triggers' ? 'Trigger' : 'Action'}
                                                                                <ExternalLink className="h-3.5 w-3.5 ml-2.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="py-24 text-center space-y-6 bg-muted/20 rounded-2xl border border-dashed border-border">
                                                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto opacity-50">
                                                    <Code2 className="h-8 w-8 text-muted-foreground/40" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-base font-bold text-muted-foreground/60 tracking-tight">No {activeTab} found</p>
                                                    <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">Connect an account to see available options</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="h-10 rounded-xl border-border bg-muted/50 font-bold text-[9px] uppercase tracking-widest px-8 hover:bg-muted transition-all"
                                                    onClick={() => onAction(activeTab === 'triggers' ? 'trigger' : 'action')}
                                                >
                                                    <Plus className="h-3.5 w-3.5 mr-2" />
                                                    Define Custom
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
