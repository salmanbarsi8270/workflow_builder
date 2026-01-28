import { useState, useCallback, useEffect, useRef } from 'react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Zap, Settings, ChevronRight, Info, ExternalLink, Code2, RotateCcw, Copy, Check, Bolt, Globe, Shield, Clock, Activity, Search, Star, TrendingUp, PlusIcon, RefreshCw, } from "lucide-react";
import type { IntegrationApp } from './types';
import { categoryColors, } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConnectorInfoSliderProps {
    app: IntegrationApp | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConnect: (app: IntegrationApp) => void;
    onAction: (type: 'trigger' | 'action', initialData?: any) => void;
    isLoading?: boolean;
    onEditConnection?: (account: any) => void;
    onSyncCatalog?: (account: any) => void;
}

const LoadingSkeleton = () => (
    <div className="flex-1 flex flex-col min-h-0">
        <div className="pt-12 px-8 pb-6 border-b border-border/50">
            <div className="flex items-start gap-6">
                <Skeleton className="h-20 w-20 rounded-2xl bg-slate-800/50" />
                <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48 bg-slate-800/50 rounded-lg" />
                        <Skeleton className="h-4 w-full max-w-lg bg-slate-800/50 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-16 rounded-xl bg-slate-800/50" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <div className="px-8 pt-6">
            <Skeleton className="h-12 w-full rounded-2xl bg-slate-800/50" />
        </div>
        <div className="flex-1 px-8 pt-8 space-y-4">
            <Skeleton className="h-8 w-48 bg-slate-800/50 rounded-lg" />
            {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl bg-slate-800/50" />
            ))}
        </div>
    </div>
);

export function ConnectorInfoSlider({ app, open, onOpenChange, onConnect, onAction, isLoading, onEditConnection, onSyncCatalog }: ConnectorInfoSliderProps) {
    const [activeTab, setActiveTab] = useState<'triggers' | 'actions'>('triggers');
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [showDefinition, setShowDefinition] = useState<string | null>(null);
    const [width, setWidth] = useState<number>(window.innerWidth * 0.42);
    const [isResizing, setIsResizing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const sliderRef = useRef<HTMLDivElement>(null);


    // Reset on app change
    useEffect(() => {
        if (app) {
            setSelectedItem(null);
            setActiveTab('triggers');
            setSearchQuery('');
        }
    }, [app]);

    // Resize logic with improved constraints
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
            const minWidth = window.innerWidth * 0.25;
            const maxWidth = window.innerWidth * 0.9;

            if (newWidth > minWidth && newWidth < maxWidth) {
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

    // Handle reset
    const handleReset = () => {
        setSelectedItem(null);
        setActiveTab('triggers');
        setSearchQuery('');
        setWidth(window.innerWidth * 0.42);
    };

    if (!app) return null;

    const colors = categoryColors[app.category || 'default'] || categoryColors.default;
    const CategoryIcon = Globe;
    const metadata = app.metadata;
    const fullMetadata = metadata?.fullMetadata?.[activeTab === 'triggers' ? 'triggers' : 'actions'] || {};
    // Use fullMetadata keys as the source to ensure all items (including _ ones) are shown
    const items = Object.keys(fullMetadata);

    // Filter and search items
    const filteredItems = items.filter(itemName => {
        const detail = fullMetadata[itemName];
        const matchesSearch = searchQuery === '' ||
            itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            detail?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            detail?.description?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const handleItemClick = (name: string) => {
        setSelectedItem(selectedItem === name ? null : name);
    };

    // Animation variants
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        hover: { scale: 1.02, transition: { duration: 0.2 } }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent
                ref={sliderRef}
                className={cn(
                    "p-0 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/95 backdrop-blur-xl flex flex-col h-full overflow-hidden shadow-2xl shadow-blue-500/5 rounded-l-2xl max-w-none!",
                    isResizing ? "transition-none" : "transition-[width] duration-300 ease-out"
                )}
                style={{ width: `${width}px` }}
            >
                {/* Resize Handle with Visual Feedback */}
                <div
                    className={cn(
                        "absolute left-0 top-0 w-3 h-full z-[100] group transition-all duration-200",
                        isResizing ? "bg-blue-500/30 cursor-ew-resize" : "hover:bg-blue-500/10 cursor-ew-resize"
                    )}
                    onMouseDown={startResizing}
                >
                    <div className={cn(
                        "absolute left-1 top-1/2 -translate-y-1/2 w-1 h-16 rounded-full transition-all",
                        isResizing ? "bg-blue-400 scale-110" : "bg-muted-foreground/20 group-hover:bg-blue-400 group-hover:scale-110"
                    )} />
                </div>

                {/* Floating Control Panel */}
                <div className="absolute top-0 left-0 z-[110] flex items-center gap-2 p-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all"
                        onClick={handleReset}
                        title="Reset View"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>

                {/* Main Content */}
                {isLoading ? (
                    <LoadingSkeleton />
                ) : app ? (
                    <div className={cn(
                        "flex-1 flex flex-col min-h-0",
                        isResizing && "pointer-events-none opacity-80"
                    )}>
                        {/* Enhanced Header with linear */}
                        <div className="pt-12 px-8 pb-6 relative overflow-hidden border-b border-slate-200 dark:border-white/5">
                            {/* Background linear */}
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5" />

                            <div className="relative flex items-start gap-6">
                                {/* Animated Icon Container */}
                                <motion.div
                                    className="relative group"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="p-4 rounded-2xl bg-linear-to-br from-white/5 to-white/10 border border-white/10 shadow-2xl backdrop-blur-sm">
                                        <img src={app.icon} alt={app.name} className="w-14 h-14 object-contain" />
                                    </div>
                                    {app.connected && (
                                        <motion.div
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 border-2 border-background shadow-lg shadow-emerald-500/30 flex items-center justify-center"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Check className="h-3 w-3 text-white" />
                                        </motion.div>
                                    )}
                                    <div className="absolute -inset-4 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                                </motion.div>

                                {/* Title & Stats */}
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <DrawerTitle className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                                {app.name}
                                            </DrawerTitle>
                                            <Badge className={cn(
                                                "px-3 py-1 text-xs font-bold uppercase tracking-wider",
                                                colors.bg, colors.text, "border-0 shadow-md"
                                            )}>
                                                <CategoryIcon className="h-3 w-3 mr-2" />
                                                {app.category}
                                            </Badge>
                                        </div>
                                        <DrawerDescription className="text-muted-foreground/70 text-sm font-medium leading-relaxed max-w-lg">
                                            {app.description}
                                        </DrawerDescription>
                                    </div>

                                    {/* Connected Accounts */}
                                    {app.connected && app.accounts && app.accounts.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            {app.accounts.map((account) => (
                                                <div key={account.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 backdrop-blur-sm group/account transition-all hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 hover:border-emerald-500/30">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden shrink-0">
                                                            {account.avatarUrl ? (
                                                                <img src={account.avatarUrl} alt={account.username} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                                    {account.username?.charAt(0).toUpperCase() || '?'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0 pr-1">
                                                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300 truncate">
                                                                {account.username}
                                                            </span>
                                                            {account.externalId && account.externalId !== account.username && (
                                                                <span className="text-[9px] font-medium text-emerald-600/50 dark:text-emerald-400/50 truncate">
                                                                    {account.externalId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/account:opacity-100 transition-opacity">
                                                        {onSyncCatalog && (app.id === 'postgres' || app.id === 'mysql') && (
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/20"
                                                                onClick={(e) => { e.stopPropagation(); onSyncCatalog(account); }}
                                                                title="Refresh Schema"
                                                            >
                                                                <RefreshCw className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        {onEditConnection && (
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/20"
                                                                onClick={(e) => { e.stopPropagation(); onEditConnection(account); }}
                                                                title="Edit Connection"
                                                            >
                                                                <Settings className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-center gap-2">
                                                <Bolt className="h-4 w-4 text-blue-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    Triggers
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-foreground mt-1">
                                                {metadata?.triggers?.length || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4 text-indigo-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    Actions
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-foreground mt-1">
                                                {metadata?.actions?.length || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-emerald-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    Status
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-emerald-400 mt-1">
                                                {app.connected ? 'Connected' : 'Ready'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Controls Section */}
                        <div className='px-8 py-4'>
                            <div className="flex items-center gap-4">
                                {/* Search Bar */}
                                <div className="relative flex-1 items-center">
                                    <Search className="absolute left-3 top-3 h-5 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab}...`}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:border-white/10 bg-white/5 border border-slate-800/5 text-sm focus:outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    <Button className={cn("h-10 px-6 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all", app.connected ? "bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" : "bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700")}
                                        onClick={() => onConnect(app)}
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2 text-white" />
                                        {app.connected ? "Add Account" : "Connect Now"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <Tabs defaultValue="triggers" className="flex-1 flex flex-col overflow-hidden" value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSelectedItem(null); }}>
                            {/* Animated Tab Bar */}
                            <div className="px-8 pt-6">
                                <TabsList className="inline-flex h-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-1 gap-1 w-full">
                                    <TabsTrigger value="triggers" className="w-full px-6 rounded-xl font-bold text-xs uppercase tracking-wider data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-blue-500/20 transition-all">
                                        <Zap className="h-4 w-4 mr-2" />
                                        Triggers
                                        <Badge variant="outline" className="ml-2 px-2 py-0.5 text-[10px] data-[state=active]:text-white">
                                            {metadata?.triggers?.length || 0}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="actions" className="w-full px-6 rounded-xl font-bold text-xs uppercase tracking-wider data-[state=active]:bg-linear-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-indigo-500/20 transition-all">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Actions
                                        <Badge variant="outline" className="ml-2 px-2 py-0.5 text-[10px] data-[state=active]:text-white">
                                            {metadata?.actions?.length || 0}
                                        </Badge>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value={activeTab} className="flex-1 min-h-0 mt-6 flex flex-col outline-none">
                                <ScrollArea className="flex-1 h-full">
                                    <div className="px-8 pb-12">
                                        {/* Header with Action */}
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">
                                                    Available {activeTab}
                                                </h3>
                                                <p className="text-sm text-muted-foreground/60 mt-1">
                                                    {filteredItems?.length} of {items?.length} items shown
                                                </p>
                                            </div>
                                            <Button className="h-10 px-5 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs uppercase tracking-wider" onClick={() => onAction(activeTab === 'triggers' ? 'trigger' : 'action')}>
                                                <Plus className="h-4 w-4 mr-2" /> Add {activeTab === 'triggers' ? 'Trigger' : 'Action'}
                                            </Button>
                                        </div>

                                        {/* List View */}
                                        <div className="space-y-3">
                                            {filteredItems?.length ? (
                                                filteredItems.map((itemName, index) => {
                                                    const detail = fullMetadata[itemName];
                                                    const isSelected = selectedItem === itemName;

                                                    return (
                                                        <motion.div key={itemName} variants={itemVariants} initial="hidden" animate="visible" transition={{ duration: 0.3, delay: index * 0.05 }} whileHover="hover">
                                                            <Card className={cn("group cursor-pointer border-2 transition-all duration-300", isSelected ? "border-blue-500/30 bg-linear-to-br from-blue-500/5 to-blue-500/5 " : "border-slate-200 dark:border-white/10 hover:border-blue-500/20 hover:bg-white/5")} onClick={() => handleItemClick(itemName)}>
                                                                <CardContent className="p-5">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex items-start gap-4">
                                                                            <div className={cn("p-3 rounded-xl transition-all duration-300", activeTab === 'triggers' ? "bg-emerald-500/10 group-hover:bg-emerald-500/15" : "bg-indigo-500/10 group-hover:bg-indigo-500/15")}>
                                                                                {activeTab === 'triggers' ? (
                                                                                    <Zap className="h-5 w-5 text-emerald-400" />
                                                                                ) : (
                                                                                    <Settings className="h-5 w-5 text-indigo-400" />
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <h4 className="text-base font-bold text-foreground truncate">
                                                                                        {detail?.label || itemName}
                                                                                    </h4>
                                                                                    {detail?.premium && (
                                                                                        <Badge className="bg-linear-to-r from-amber-500/10 to-amber-600/10 text-amber-400 border-amber-500/20 px-2 py-0.5 text-[10px]">
                                                                                            <Star className="h-3 w-3 mr-1" />
                                                                                            Premium
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-sm text-muted-foreground/70 line-clamp-2 mb-3">
                                                                                    {detail?.description}
                                                                                </p>

                                                                                {/* Quick Stats */}
                                                                                {detail?.usage && (
                                                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground/50">
                                                                                        <span className="flex items-center gap-1">
                                                                                            <TrendingUp className="h-3 w-3" />
                                                                                            {detail.usage} uses
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Clock className="h-3 w-3" />
                                                                                            {detail.latency || 'Fast'}
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Shield className="h-3 w-3" />
                                                                                            {detail.security || 'Secure'}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <ChevronRight className={cn("h-5 w-5 text-muted-foreground/40 transition-transform duration-300", isSelected && "rotate-90 text-blue-400")} />
                                                                        </div>
                                                                    </div>

                                                                    {/* Expanded Details */}
                                                                    <AnimatePresence>
                                                                        {isSelected && (
                                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                                                                                <div className="pt-6 mt-6 border-t border-border/50 space-y-6">
                                                                                    {/* Documentation */}
                                                                                    <div className="space-y-3">
                                                                                        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                                                                                            <Info className="h-4 w-4 text-blue-400" />
                                                                                            Description
                                                                                        </h5>
                                                                                        <p className="text-sm text-foreground/80 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                                                                                            {detail?.description || "No description available."}
                                                                                        </p>
                                                                                    </div>

                                                                                    {/* Parameters */}
                                                                                    {detail?.parameters && detail.parameters.length > 0 && (
                                                                                        <div className="space-y-3">
                                                                                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                                                                                                Configuration Parameters
                                                                                            </h5>
                                                                                            <div className="grid gap-2">
                                                                                                {detail.parameters.map((param: any) => (
                                                                                                    <div key={param.name} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/20 transition-all group/param">
                                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <span className="text-sm font-bold text-foreground/90">
                                                                                                                    {param.label}
                                                                                                                </span>
                                                                                                                {param.required && (
                                                                                                                    <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                                                                                                                        Required
                                                                                                                    </Badge>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                                                                                {param.type}
                                                                                                            </Badge>
                                                                                                        </div>
                                                                                                        {param.description && (
                                                                                                            <p className="text-sm text-muted-foreground/70">
                                                                                                                {param.description}
                                                                                                            </p>
                                                                                                        )}
                                                                                                        <div className="mt-2 text-[10px] font-mono text-muted-foreground/50">
                                                                                                            {param.name}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Definition Toggle */}
                                                                                    <div className="space-y-3">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                                                                                                <Code2 className="h-4 w-4 text-blue-400" />
                                                                                                Technical Definition
                                                                                            </h5>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium hover:bg-blue-500/10 hover:text-blue-400" onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setShowDefinition(showDefinition === itemName ? null : itemName);
                                                                                                }}>
                                                                                                    {showDefinition === itemName ? 'Hide JSON' : 'Show JSON'}
                                                                                                </Button>
                                                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
                                                                                                        setCopied(itemName);
                                                                                                        setTimeout(() => setCopied(null), 2000);
                                                                                                    }}>
                                                                                                    {copied === itemName ? (
                                                                                                        <Check className="h-4 w-4 text-emerald-400" />
                                                                                                    ) : (
                                                                                                        <Copy className="h-4 w-4" />
                                                                                                    )}
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>

                                                                                        <AnimatePresence>
                                                                                            {showDefinition === itemName && (
                                                                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                                                                    <pre className="p-4 rounded-xl bg-black border border-white/10 text-xs font-mono text-blue-400 overflow-x-auto max-h-[300px]">
                                                                                                        {JSON.stringify(detail, null, 2)}
                                                                                                    </pre>
                                                                                                </motion.div>
                                                                                            )}
                                                                                        </AnimatePresence>
                                                                                    </div>

                                                                                    {/* Action Button */}
                                                                                    <Button className="w-full h-11 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onAction(activeTab === 'triggers' ? 'trigger' : 'action', {
                                                                                                name: itemName,
                                                                                                definition: detail
                                                                                            });
                                                                                        }}
                                                                                    >
                                                                                        Update {activeTab === 'triggers' ? 'Trigger' : 'Action'}
                                                                                        <ExternalLink className="h-4 w-4 ml-2" />
                                                                                    </Button>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </CardContent>
                                                            </Card>
                                                        </motion.div>
                                                    );
                                                })
                                            ) : (
                                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-20 text-center space-y-6">
                                                    <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 flex items-center justify-center mx-auto">
                                                        <Code2 className="h-10 w-10 text-muted-foreground/40" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-lg font-bold text-muted-foreground/60">No {activeTab} found</p>
                                                        <p className="text-sm text-muted-foreground/40">{searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your filters or search"}</p>
                                                    </div>
                                                    <Button variant="outline" className="h-10 px-6 rounded-xl border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5" onClick={() => setSearchQuery('')}>Clear Filters</Button>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : null}
            </DrawerContent>
        </Drawer>
    );
}