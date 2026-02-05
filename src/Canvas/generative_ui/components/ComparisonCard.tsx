import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import { Check, ChevronRight } from 'lucide-react';

export const ComparisonCard = ({ title, items = [], className }: any) => (
    <div className={cn("bg-card rounded-xl border shadow-sm overflow-hidden", className)}>
        {title && (
            <CardHeader className="px-6 py-5 border-b">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            </CardHeader>
        )}
        <CardContent className="p-0">
            <div className="flex flex-col md:flex-row md:divide-x divide-border">
                {items.map((item: any, idx: number) => (
                    <div 
                        key={idx} 
                        className={cn(
                            "flex-1 p-6 space-y-5",
                            idx > 0 && "border-t md:border-t-0",
                            idx === 0 && "bg-linear-to-br from-primary/5 via-transparent to-transparent",
                            idx === 1 && "bg-linear-to-bl from-secondary/5 via-transparent to-transparent"
                        )}
                    >
                        {/* Header with label and optional badge */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-base text-foreground">{item.label}</h4>
                                {item.badge && (
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full font-medium",
                                        idx === 0 
                                            ? "bg-primary/10 text-primary" 
                                            : "bg-secondary/10 text-secondary"
                                    )}>
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            
                            {/* Main Value */}
                            <div className="flex items-baseline gap-1.5">
                                {item.prefix && (
                                    <span className="text-lg font-medium text-muted-foreground">
                                        {item.prefix}
                                    </span>
                                )}
                                <span className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                    {item.value}
                                </span>
                                {item.suffix && (
                                    <span className="text-lg font-medium text-muted-foreground">
                                        {item.suffix}
                                    </span>
                                )}
                            </div>
                            
                            {/* Subtitle or description */}
                            {item.description && (
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            )}
                        </div>

                        {/* Details List */}
                        {item.details && (
                            <div className="pt-4 border-t border-border/50">
                                <h5 className="text-sm font-medium text-muted-foreground mb-3">
                                    Features
                                </h5>
                                <ul className="space-y-3">
                                    {item.details.map((detail: any, i: number) => (
                                        <li key={i} className="flex items-start gap-3">
                                            {typeof detail === 'string' ? (
                                                <>
                                                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                    <span className="text-sm text-foreground">{detail}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={cn(
                                                        "h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                        detail.available 
                                                            ? "bg-green-100 text-green-600" 
                                                            : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {detail.available ? (
                                                            <Check className="h-2.5 w-2.5" />
                                                        ) : (
                                                            <span className="text-[10px]">×</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-sm text-foreground">
                                                            {detail.label}
                                                        </span>
                                                        {detail.description && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {detail.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Call to Action */}
                        {item.cta && (
                            <div className="pt-4">
                                <a
                                    href={item.cta.link}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        "hover:shadow-md active:scale-[0.98]",
                                        idx === 0
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                    )}
                                >
                                    {item.cta.label}
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Divider for mobile */}
            {items.length > 1 && (
                <div className="flex md:hidden items-center justify-center py-4 bg-muted/30">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="h-px w-12 bg-border" />
                        VS
                        <div className="h-px w-12 bg-border" />
                    </div>
                </div>
            )}
        </CardContent>
    </div>
);