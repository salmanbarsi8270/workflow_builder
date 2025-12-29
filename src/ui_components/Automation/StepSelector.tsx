import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, ArrowLeft } from "lucide-react";
import { APP_DEFINITIONS, type AppDefinition, type ActionDefinition } from './ActionDefinitions';
import { cn } from "@/lib/utils";
import { AppLogoMap } from './Applogo';

interface StepSelectorProps {
    onSelect: (app: any) => void;
    onClose: () => void;
    mode?: 'trigger' | 'action';
}

export default function StepSelector({ onSelect, onClose, mode = 'action' }: StepSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'app' | 'utility'>('app');
    const [selectedApp, setSelectedApp] = useState<AppDefinition | null>(null);

    // Filter apps that have at least one action matching the mode
    const filteredApps = APP_DEFINITIONS.filter(app => {
        const hasMatchingAction = app.actions.some(action => action.type === mode);
        const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             app.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        return app.category === activeTab && hasMatchingAction && matchesSearch;
    });

    // Actions Filter: If App Selected
    const filteredActions = selectedApp?.actions.filter(action => 
        action.type === mode &&
        action.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const handleAppClick = (app: AppDefinition) => {
        setSelectedApp(app);
        setSearchTerm(""); // Reset search for actions
    };

    const handleActionClick = (action: ActionDefinition) => {
        if (!selectedApp) return;
        
        // Construct the node data
        onSelect({
            name: `${selectedApp.name}_${action.id}`, // Combined name (e.g. Google Sheets_appendRowSmart)
            piece: selectedApp.id, // e.g. sheets
            action: action.id, // e.g. appendRowSmart
            appName: selectedApp.name,
            description: action.description,
            icon: selectedApp.id, 
            actionId: action.id,
            actionName: action.name, 
            isPlaceholder: false 
        });
        onClose();
    };

    const handleBack = () => {
        setSelectedApp(null);
        setSearchTerm("");
    };

    return (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-popover border shadow-2xl rounded-xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
                {selectedApp && (
                    <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 -ml-2">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={selectedApp ? `Search ${selectedApp.name} actions...` : "Search apps..."}
                        className="pl-9 bg-muted/50 border-none focus-visible:ring-1" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Tabs (Only if no app selected) */}
            {!selectedApp && (
                <div className="flex border-b">
                    <button 
                        onClick={() => setActiveTab('app')}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                            activeTab === 'app' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Apps
                    </button>
                    <button 
                        onClick={() => setActiveTab('utility')}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                            activeTab === 'utility' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Utility
                    </button>
                </div>
            )}

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-2">
                {!selectedApp ? (
                    <div className="grid grid-cols-1 gap-1">
                        {filteredApps.map(app => (
                            <div 
                                key={app.id}
                                onClick={() => handleAppClick(app)}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer group transition-colors"
                            >
                                <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center shrink-0 overflow-hidden">
                                    {AppLogoMap[app.id] ? (
                                        <img src={AppLogoMap[app.id]} alt={app.name} className="h-7 w-7 object-contain" />
                                    ) : (
                                        <app.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium leading-none mb-1">{app.name}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{app.description}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                        ))}
                        {filteredApps.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No apps found.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Actions / Triggers
                        </div>
                        {filteredActions?.map(action => (
                            <div 
                                key={action.id}
                                onClick={() => handleActionClick(action)}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer group transition-colors"
                            >
                                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                    {/* Small icon for action type? */}
                                    <div className={cn("h-2 w-2 rounded-full", action.type === 'trigger' ? "bg-orange-500" : "bg-blue-500")} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium leading-none mb-1">{action.name}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
                                </div>
                            </div>
                        ))}
                         {filteredActions?.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No actions found matching your search.
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="p-2 border-t bg-muted/20 text-xs text-center text-muted-foreground">
                Press <kbd className="px-1 py-0.5 rounded bg-background border font-mono">Esc</kbd> to close
            </div>
        </div>
    );
}
