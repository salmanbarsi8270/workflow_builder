import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';

export const ComparisonCard = ({ title, items = [], className }: any) => (
    <div className={cn("w-full bg-primary/[0.02]", className)}>
        {title && (
            <CardHeader className="border-b bg-primary/[0.03]">
                <h3 className="text-lg font-bold">{title}</h3>
            </CardHeader>
        )}
        <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="p-6 space-y-4 bg-primary/[0.01]">
                        <h4 className="font-bold text-base">{item.label}</h4>
                        <div className="text-3xl font-black text-primary">{item.value}</div>
                        {item.details && (
                            <ul className="space-y-2">
                                {item.details.map((detail: string, i: number) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                                        <LucideIcons.Check className="h-3 w-3 text-green-500" />
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </CardContent>
    </div>
);
