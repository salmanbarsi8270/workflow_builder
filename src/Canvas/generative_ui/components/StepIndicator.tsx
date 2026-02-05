import { cn } from '@/lib/utils';
import { Check, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { renderIcon } from './utils';

interface StepIndicatorProps {
    steps?: Array<{
        label: string;
        description?: string;
        status?: 'completed' | 'active' | 'pending' | 'error' | 'warning' | 'loading';
        icon?: string | ReactNode;
        time?: string;
        badge?: string | number;
    }>;
    currentStep?: any;
    className?: string;
    orientation?: 'vertical' | 'horizontal';
    size?: 'sm' | 'md' | 'lg';
    showConnectors?: boolean;
    responsive?: boolean;
    clickable?: boolean;
    onStepClick?: (index: number) => void;
    showNumbers?: boolean;
    variant?: 'default' | 'compact' | 'card';
    showTime?: boolean;
    showStatus?: boolean;
    maxSteps?: number;
    truncate?: boolean;
}

const sizeConfig = {
    sm: {
        step: 'h-6 w-6',
        icon: 'h-2.5 w-2.5',
        text: 'text-xs',
        label: 'text-sm font-semibold',
        description: 'text-xs',
        connector: 'ml-3',
        gap: 'gap-3',
        padding: 'p-4'
    },
    md: {
        step: 'h-8 w-8 sm:h-10 sm:w-10',
        icon: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
        text: 'text-sm',
        label: 'text-base font-semibold sm:text-lg',
        description: 'text-sm',
        connector: 'ml-4',
        gap: 'gap-4',
        padding: 'p-6'
    },
    lg: {
        step: 'h-10 w-10 sm:h-12 sm:w-12',
        icon: 'h-4 w-4 sm:h-5 sm:w-5',
        text: 'text-base',
        label: 'text-lg font-semibold sm:text-xl',
        description: 'text-base',
        connector: 'ml-5',
        gap: 'gap-6',
        padding: 'p-8'
    }
};

const statusIcons = {
    completed: Check,
    active: Clock,
    pending: Clock,
    error: XCircle,
    warning: AlertCircle,
    loading: Loader2
};

const statusColors = {
    completed: {
        bg: 'bg-green-500',
        border: 'border-green-500',
        text: 'text-green-600 dark:text-green-400',
        icon: 'text-white'
    },
    active: {
        bg: 'bg-primary',
        border: 'border-primary',
        text: 'text-primary',
        icon: 'text-white'
    },
    pending: {
        bg: 'bg-gray-300 dark:bg-gray-700',
        border: 'border-gray-300 dark:border-gray-700',
        text: 'text-gray-500 dark:text-gray-400',
        icon: 'text-gray-500 dark:text-gray-400'
    },
    error: {
        bg: 'bg-red-500',
        border: 'border-red-500',
        text: 'text-red-600 dark:text-red-400',
        icon: 'text-white'
    },
    warning: {
        bg: 'bg-yellow-500',
        border: 'border-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-400',
        icon: 'text-white'
    },
    loading: {
        bg: 'bg-blue-500',
        border: 'border-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-white animate-spin'
    }
};

export const StepIndicator = ({
    steps = [],
    currentStep = 0,
    className,
    orientation = 'vertical',
    size = 'md',
    showConnectors = true,
    clickable = false,
    onStepClick,
    showNumbers = true,
    variant = 'default',
    showTime = false,
    showStatus = true,
    maxSteps,
    truncate = true
}: StepIndicatorProps) => {
    const config = sizeConfig[size];
    const displaySteps = maxSteps ? steps.slice(0, maxSteps) : steps;
    const isHorizontal = orientation === 'horizontal';

    const getStepStatus = (index: number, stepStatus?: string) => {
        let status = 'pending';
        if (stepStatus) {
            status = stepStatus;
        } else if (index < currentStep) {
            status = 'completed';
        } else if (index === currentStep) {
            status = 'active';
        }

        // Validate status exists in our config, fallback to pending if not
        return (status in statusColors) ? status : 'pending';
    };

    const renderStepIcon = (index: number, step: any, status: string) => {
        const StatusIcon = statusIcons[status as keyof typeof statusIcons] || statusIcons.pending;
        const colors = statusColors[status as keyof typeof statusColors] || statusColors.pending;
        
        if (step.icon && typeof step.icon !== 'string') {
            return step.icon;
        }

        if (step.icon && typeof step.icon === 'string') {
            return renderIcon(step.icon, { className: cn(config.icon, colors.icon) });
        }

        if (status === 'loading') {
            return <Loader2 className={cn(config.icon, colors.icon, "animate-spin")} />;
        }

        if (status === 'completed' || !showNumbers) {
            return <StatusIcon className={cn(config.icon, colors.icon)} />;
        }

        return (
            <span className={cn(
                "font-bold",
                config.text,
                status === 'active' ? 'text-white' : colors.text
            )}>
                {index + 1}
            </span>
        );
    };

    const renderHorizontalLayout = () => (
        <div className={cn(
            "flex items-center justify-between",
            config.padding,
            className
        )}>
            {displaySteps.map((step, index) => {
                const status = getStepStatus(index, step.status);
                const colors = statusColors[status as keyof typeof statusColors] || statusColors.pending;
                const isClickable = clickable && index <= currentStep;

                return (
                    <div key={index} className="flex flex-col items-center relative">
                        {/* Connector line */}
                        {showConnectors && index > 0 && (
                            <div className={cn(
                                "absolute top-1/2 right-1/2 w-full h-0.5 -translate-y-1/2",
                                index <= currentStep ? "bg-primary" : "bg-border"
                            )} />
                        )}

                        {/* Step circle */}
                        <button
                            onClick={() => isClickable && onStepClick?.(index)}
                            className={cn(
                                "flex items-center justify-center rounded-full border-2 relative z-10 transition-all duration-300",
                                config.step,
                                colors.border,
                                status === 'active' && "ring-4 ring-primary/20",
                                isClickable && "hover:scale-110 active:scale-95 cursor-pointer",
                                !isClickable && "cursor-default"
                            )}
                            disabled={!isClickable}
                            type="button"
                        >
                            <div className={cn(
                                "rounded-full flex items-center justify-center",
                                config.step,
                                ['completed', 'active', 'error', 'warning', 'loading'].includes(status) 
                                    ? colors.bg 
                                    : "bg-transparent"
                            )}>
                                {renderStepIcon(index, step, status)}
                            </div>
                        </button>

                        {/* Label */}
                        <div className={cn(
                            "mt-3 text-center",
                            config.text,
                            truncate && "max-w-[100px] sm:max-w-[120px]"
                        )}>
                            <div className={cn(
                                "font-medium",
                                colors.text,
                                truncate && "truncate"
                            )}>
                                {step.label}
                            </div>
                            {showTime && step.time && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    {step.time}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderVerticalLayout = () => (
        <div className={cn(
            config.padding,
            className
        )}>
            <div className={cn(
                "flex",
                isHorizontal ? "flex-row" : "flex-col",
                config.gap
            )}>
                {displaySteps.map((step, index) => {
                    const status = getStepStatus(index, step.status);
                    const colors = statusColors[status as keyof typeof statusColors] || statusColors.pending;
                    const isClickable = clickable && index <= currentStep;

                    return (
                        <div key={index} className="flex group">
                            {/* Step circle and connector */}
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => isClickable && onStepClick?.(index)}
                                    className={cn(
                                        "flex items-center justify-center rounded-full border-2 transition-all duration-300 relative z-10",
                                        config.step,
                                        colors.border,
                                        status === 'active' && "ring-4 ring-primary/20 shadow-lg",
                                        isClickable && "hover:scale-110 active:scale-95 cursor-pointer",
                                        !isClickable && "cursor-default"
                                    )}
                                    disabled={!isClickable}
                                    type="button"
                                >
                                    <div className={cn(
                                        "rounded-full flex items-center justify-center",
                                        config.step,
                                        ['completed', 'active', 'error', 'warning', 'loading'].includes(status) 
                                            ? colors.bg 
                                            : "bg-transparent"
                                    )}>
                                        {renderStepIcon(index, step, status)}
                                    </div>
                                </button>

                                {/* Connector line */}
                                {showConnectors && index < displaySteps.length - 1 && (
                                    <div className={cn(
                                        "w-0.5 flex-1 min-h-6 mt-2 rounded-full transition-colors duration-300",
                                        index < currentStep ? "bg-primary" : "bg-border"
                                    )} />
                                )}
                            </div>

                            {/* Content */}
                            <div className={cn(
                                "flex flex-col pb-6",
                                config.connector,
                                variant === 'compact' && "pb-3"
                            )}>
                                <div className="flex items-center gap-2">
                                    <h4 className={cn(
                                        "font-semibold tracking-tight transition-colors",
                                        colors.text,
                                        config.label,
                                        truncate && "truncate max-w-[200px] sm:max-w-[300px]",
                                        variant === 'compact' && "text-sm"
                                    )}>
                                        {step.label}
                                    </h4>
                                    
                                    {showStatus && step.status && step.status !== 'pending' && (
                                        <span className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded-full",
                                            status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                            status === 'error' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                            status === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                            status === 'loading' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        )}>
                                            {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                                        </span>
                                    )}

                                    {step.badge && (
                                        <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {step.badge}
                                        </span>
                                    )}
                                </div>

                                {step.description && (
                                    <p className={cn(
                                        "text-muted-foreground leading-relaxed mt-1",
                                        config.description,
                                        truncate && "line-clamp-2"
                                    )}>
                                        {step.description}
                                    </p>
                                )}

                                {showTime && step.time && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {step.time}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Card variant wrapper
    if (variant === 'card') {
        return (
            <div className={cn(
                "rounded-xl border bg-card shadow-sm",
                className
            )}>
                {orientation === 'horizontal' ? renderHorizontalLayout() : renderVerticalLayout()}
            </div>
        );
    }

    return orientation === 'horizontal' ? renderHorizontalLayout() : renderVerticalLayout();
};

// Pre-configured variants
StepIndicator.Horizontal = (props: Omit<StepIndicatorProps, 'orientation'>) => (
    <StepIndicator orientation="horizontal" {...props} />
);

StepIndicator.Compact = (props: Omit<StepIndicatorProps, 'size' | 'variant'>) => (
    <StepIndicator 
        size="sm" 
        variant="compact" 
        showConnectors={false}
        {...props} 
    />
);

StepIndicator.Card = (props: Omit<StepIndicatorProps, 'variant'>) => (
    <StepIndicator 
        variant="card" 
        showConnectors 
        {...props} 
    />
);

StepIndicator.Wizard = ({ steps, currentStep, onStepClick, ...props }: StepIndicatorProps) => (
    <div className="space-y-6">
        <StepIndicator.Horizontal
            steps={steps}
            currentStep={currentStep}
            clickable
            onStepClick={onStepClick}
            showConnectors
            {...props}
        />
        <div className="text-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps?.length || 0}
        </div>
    </div>
);