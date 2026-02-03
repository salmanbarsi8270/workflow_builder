import { Sparkles, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function RightSidebar() {
    return (
        <div className="w-[350px] shrink-0 flex flex-col gap-4 p-4 border-l border-border bg-muted/20 backdrop-blur-sm hidden xl:flex">
            {/* AI Insights Card */}
            <Card className="bg-card border-border p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="font-semibold text-foreground">AI Insights</span>
                </div>

                <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground leading-relaxed italic">
                        "Performance increased by 14% following the adjustment of the automated outreach retry logic at 14:20."
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground leading-relaxed italic">
                        "Detected 3 potential duplicate leads in the high-priority queue. Recommended action: Merge."
                    </div>
                </div>
            </Card>

            {/* Active Agents Card */}
            <Card className="bg-card border-border p-5 space-y-4 flex-1 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className="font-semibold text-foreground">Active Agents</span>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className="text-sm font-medium text-foreground">Lead Gen Bot</span>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Processing...</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-sm font-medium text-foreground">Nurture AI</span>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Idle</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

