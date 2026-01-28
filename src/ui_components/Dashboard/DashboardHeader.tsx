import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider"
import { Plus, RefreshCcw } from "lucide-react";

interface DashboardHeaderProps {
    onRefresh: () => void;
    onNewWorkflow: () => void;
}

export function DashboardHeader({ onRefresh, onNewWorkflow }: DashboardHeaderProps) {
    const { accentColor } = useTheme();
    return (
        <div className="mb-4 animate-in fade-in slide-in-from-top duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="flex-1">
                    <div className="mb-6">
                        <div className="items-center gap-4 mb-3">
                            <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                                Workflow Dashboard
                            </h1>
                            <div 
                                className="h-1.5 w-12 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]" 
                                style={{ backgroundColor: accentColor }}
                            />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                        Monitor and manage your automations in real-time. Track performance, health, and recent activities.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={onRefresh}
                        className="h-14 w-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </Button>
                    <Button 
                        onClick={onNewWorkflow} 
                        className="h-14 px-8 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2"
                        style={{ backgroundColor: accentColor }}
                    >
                        <Plus className="h-5 w-5" />
                        New Workflow
                    </Button>
                </div>
            </div>
        </div>
    );
}
