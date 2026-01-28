import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';

export const SummaryCard = ({ title, summary, highlights = [], className }: any) => (
    <div className={cn("w-full bg-primary/[0.04]", className)}>
        <CardHeader className="border-b bg-primary/[0.02]">
            <h3 className="text-lg font-bold">{title}</h3>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
            <p className="text-sm leading-relaxed">{summary}</p>
            {highlights.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    {highlights.map((highlight: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-xs font-medium">{highlight}</span>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
    </div>
);
