import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export const StepIndicator = ({ steps = [], activeStep = 0, title, className }: any) => (
    <div className={cn("flex flex-col gap-6 w-full p-6", className)}>
        {title && <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/50">{title}</h3>}
        <div className="flex flex-col gap-4">
            {steps.map((step: any, idx: number) => {
                const isCompleted = idx < activeStep;
                const isActive = idx === activeStep;

                return (
                    <div key={idx} className="flex gap-4 group">
                        <div className="flex flex-col items-center gap-1">
                            <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500",
                                isCompleted ? "bg-primary border-primary text-primary-foreground" :
                                    isActive ? "border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" :
                                        "border-muted text-muted-foreground"
                            )}>
                                {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={cn(
                                    "w-0.5 flex-1 min-h-[20px] rounded-full transition-colors duration-500",
                                    isCompleted ? "bg-primary" : "bg-border/30"
                                )} />
                            )}
                        </div>
                        <div className="flex flex-col pb-6">
                            <h4 className={cn(
                                "text-sm font-black tracking-tight transition-colors",
                                isActive ? "text-foreground" : isCompleted ? "text-foreground/80" : "text-muted-foreground"
                            )}>
                                {step.title}
                            </h4>
                            {step.description && (
                                <p className="text-xs text-muted-foreground/60 leading-relaxed mt-1">
                                    {step.description}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
