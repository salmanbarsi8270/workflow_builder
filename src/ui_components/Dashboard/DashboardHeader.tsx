import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Refresh01Icon, PlusSignIcon, Layout01Icon } from "@hugeicons/core-free-icons";

interface DashboardHeaderProps {
    onRefresh: () => void;
    onNewWorkflow: () => void;
}

export function DashboardHeader({ onRefresh, onNewWorkflow }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                    <div className="relative p-3 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl shadow-blue-500/10">
                        <HugeiconsIcon icon={Layout01Icon} className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        Workflow Dashboard
                        <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-500/30">
                            Live
                        </div>
                    </h2>
                    <p className="text-slate-500 dark:text-blue-200/70 text-sm font-medium">
                        Monitor and manage your automations in real-time
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={onRefresh}
                    className="h-11 w-11 cursor-pointer rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm"
                >
                    <HugeiconsIcon icon={Refresh01Icon} className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
                <Button 
                    onClick={onNewWorkflow} 
                    className="h-11 px-6 cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-300"
                >
                    <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                    New Workflow
                </Button>
            </div>
        </div>
    );
}
