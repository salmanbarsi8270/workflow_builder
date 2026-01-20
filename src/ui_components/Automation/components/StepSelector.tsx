import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, X, Box, Sparkles, Hammer, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePieces } from '@/context/PieceContext';
import { AppLogoMap } from '../utils/Applogo';

interface StepSelectorProps {
    onSelect: (app: any) => void;
    onClose: () => void;
    mode?: 'trigger' | 'action';
}

type TabType = 'agent' | 'app' | 'utility';

export default function StepSelector({ onSelect, onClose, mode = 'action' }: StepSelectorProps) {
    const { pieces } = usePieces();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>('app');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Normalize pieces for searching and filtering
    const allPieces = useMemo(() => {
        return pieces.filter((app: any) => {
            const isNotOpenRouter = app.id !== 'openrouter' && (app.name || '').toLowerCase() !== 'openrouter';
            return isNotOpenRouter;
        });
    }, [pieces]);

    // Filter apps based on tab and search
    const filteredApps = useMemo(() => {
        return allPieces.filter((app: any) => {
            const category = app.category || 'app';
            let matchesTab = false;

            if (activeTab === 'app') {
                matchesTab = !['utility', 'agent', 'core'].includes(category);
                if (category === 'app') matchesTab = true;
            } else if (activeTab === 'utility') {
                matchesTab = ['utility', 'core', 'logic', 'helper'].includes(category);
            } else if (activeTab === 'agent') {
                matchesTab = category === 'agent';
            }

            const matchesSearch = (app.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            // Check if app has actions for current mode
            const actions = app.actions || [];
            const hasMatchingAction = actions.some((action: any) => action.type === mode);

            return matchesTab && hasMatchingAction && (matchesSearch || searchTerm === "");
        });
    }, [allPieces, activeTab, searchTerm, mode]);

    // Automatically select the first app if none is selected or if filteredApps changed
    useEffect(() => {
        if (filteredApps.length > 0 && (!selectedAppId || !filteredApps.find(a => a.id === selectedAppId))) {
            setSelectedAppId(filteredApps[0].id);
        } else if (filteredApps.length === 0) {
            setSelectedAppId(null);
        }
    }, [filteredApps, selectedAppId]);

    const selectedApp = useMemo(() => 
        allPieces.find(a => a.id === selectedAppId), 
    [allPieces, selectedAppId]);

    const filteredActions = useMemo(() => {
        if (!selectedApp) return [];
        const actions = (selectedApp.actions || []).filter((a: any) => a.type === mode);
        
        if (!searchTerm) return actions;

        // If search term exists, we filter actions. 
        // Note: Searching might filter apps on the left, but here we filter actions on the right of the CURRENT selected app.
        return actions.filter((action: any) =>
            (action.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (action.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [selectedApp, searchTerm, mode]);

    const handleActionSelect = (action: any) => {
        if (!selectedApp) return;

        onSelect({
            name: `${selectedApp.name}_${action.id}`,
            piece: selectedApp.id,
            action: action.id,
            appName: selectedApp.name,
            description: action.description,
            icon: selectedApp.id,
            actionId: action.id,
            actionName: action.name,
            isPlaceholder: false
        });
        onClose();
    };

    const renderIcon = (app: any, size: string = "h-6 w-6") => {
        const logo = AppLogoMap[app.id] || app.icon;
        
        if (typeof logo === 'string' && logo.length > 0) {
            return (
                <img
                    src={logo}
                    alt={app.name}
                    className={cn(
                        size, "object-contain transition-all",
                        ['wait', 'delay', 'utility', 'agent'].includes(app.id) && "invert dark:invert-0"
                    )}
                />
            );
        }

        if (app.icon && typeof app.icon !== 'string') {
            const IconComp = app.icon;
            return <IconComp className={cn(size, "text-muted-foreground group-hover:text-primary")} />;
        }

        return <Box className={cn(size, "text-muted-foreground group-hover:text-primary")} />;
    };

    const tabs = ([
        { id: 'agent', label: 'AI & Agents', icon: Sparkles },
        { id: 'app', label: 'Apps', icon: Box },
        { id: 'utility', label: 'Utility', icon: Hammer },
    ] as const).filter(tab => tab.id !== 'agent' || mode !== 'trigger');

    return (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[850px] h-[600px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search apps or actions..."
                        className="pl-10 h-11 bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 rounded-2xl transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="h-10 w-10 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                >
                    <X className="h-5 w-5 text-slate-400 hover:text-red-500" />
                </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.02]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-widest transition-all relative cursor-pointer",
                            activeTab === tab.id 
                                ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-white/5" 
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.01]"
                        )}
                    >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-blue-600 dark:text-blue-400" : "text-inherit")} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: App List */}
                <div className="w-[30%] border-r border-slate-100 dark:border-white/5 overflow-y-auto bg-slate-50/50 dark:bg-white/[0.01] p-2 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-transparent">
                        Popular
                    </div>
                    {filteredApps.map(app => (
                        <div
                            key={app.id}
                            onClick={() => setSelectedAppId(app.id)}
                            onMouseEnter={() => setSelectedAppId(app.id)}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-all",
                                selectedAppId === app.id 
                                    ? "bg-white dark:bg-white/10 shadow-sm border border-slate-100 dark:border-white/10" 
                                    : "hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                                selectedAppId === app.id
                                    ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/20 shadow-sm"
                                    : "bg-white/50 dark:bg-white/5 border-slate-100 dark:border-white/5 group-hover:bg-white group-hover:border-slate-200"
                            )}>
                                {renderIcon(app, "h-6 w-6")}
                            </div>
                            <span className={cn(
                                "text-sm font-semibold truncate",
                                selectedAppId === app.id ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900"
                            )}>
                                {app.name}
                            </span>
                        </div>
                    ))}
                    {filteredApps.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs italic">
                            No apps found
                        </div>
                    )}
                </div>

                {/* Right Column: Action List */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 p-4">
                    {selectedApp ? (
                        <div className="space-y-3">

                            <div className="grid grid-cols-1 gap-2">
                                {filteredActions.map((action: any) => (
                                    <div
                                        key={action.id}
                                        onClick={() => handleActionSelect(action)}
                                        className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer group transition-all"
                                    >
                                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-white/10 border border-slate-100 dark:border-white/10 shadow-sm flex items-center justify-center shrink-0 group-hover:border-blue-500/30 group-hover:bg-blue-50/50 transition-colors">
                                            <div className={cn(
                                                "h-2.5 w-2.5 rounded-full shadow-[0_0_8px]",
                                                action.type === 'trigger' ? "bg-orange-500 shadow-orange-500/50" : "bg-blue-500 shadow-blue-500/50"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {action.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                {action.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                                {filteredActions.length === 0 && (
                                    <div className="py-20 text-center">
                                        <div className="h-16 w-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/10">
                                            <Search className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <p className="text-sm text-slate-400">No actions found matching "{searchTerm}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="h-20 w-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-slate-100 dark:border-white/10">
                                <Compass className="h-10 w-10 text-slate-200 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Select an App</h3>
                            <p className="text-sm text-slate-500 max-w-xs">
                                Choose an app from the left to see its available actions and triggers.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {allPieces.length} Integrations Available
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                    Press <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-mono shadow-sm">Esc</kbd> to close
                </div>
            </div>
        </div>
    );
}
