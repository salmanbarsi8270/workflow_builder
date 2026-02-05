import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, XCircle, ChevronRight, Calendar, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { renderIcon } from './utils';

interface TimelineCardProps {
    title?: string;
    events?: Array<{
        title: string;
        description?: string;
        time?: string;
        status?: 'completed' | 'active' | 'pending' | 'warning' | 'error' | 'upcoming';
        icon?: string | ReactNode;
        badge?: string | number;
        color?: string;
        people?: string[];
        duration?: string;
        onClick?: () => void;
        link?: string;
    }>;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'compact' | 'detailed' | 'card';
    orientation?: 'vertical' | 'horizontal';
    showConnectors?: boolean;
    showDates?: boolean;
    showAvatars?: boolean;
    responsive?: boolean;
    loading?: boolean;
    emptyState?: ReactNode;
    maxEvents?: number;
    truncate?: boolean;
    interactive?: boolean;
    onEventClick?: (event: any, index: number) => void;
    headerAction?: ReactNode;
}

const sizeConfig = {
    sm: {
        padding: 'p-4',
        titleSize: 'text-sm font-semibold',
        eventTitle: 'text-xs font-medium',
        description: 'text-xs',
        time: 'text-[10px]',
        icon: 'h-3 w-3',
        dot: 'h-2 w-2',
        connector: 'w-0.5',
        gap: 'gap-3',
        spacing: 'space-y-4'
    },
    md: {
        padding: 'p-5 sm:p-6',
        titleSize: 'text-base font-semibold sm:text-lg',
        eventTitle: 'text-sm font-medium',
        description: 'text-sm',
        time: 'text-xs',
        icon: 'h-4 w-4 sm:h-5 sm:w-5',
        dot: 'h-3 w-3',
        connector: 'w-0.5 sm:w-px',
        gap: 'gap-4',
        spacing: 'space-y-5'
    },
    lg: {
        padding: 'p-6 sm:p-8',
        titleSize: 'text-lg font-semibold sm:text-xl',
        eventTitle: 'text-base font-medium',
        description: 'text-base',
        time: 'text-sm',
        icon: 'h-5 w-5 sm:h-6 sm:w-6',
        dot: 'h-4 w-4',
        connector: 'w-px',
        gap: 'gap-5',
        spacing: 'space-y-6'
    }
};

const statusConfig = {
    completed: {
        dot: 'bg-green-500',
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-950/20',
        text: 'text-green-700 dark:text-green-400'
    },
    active: {
        dot: 'bg-primary',
        icon: Clock,
        iconColor: 'text-primary',
        bg: 'bg-primary/10',
        text: 'text-primary'
    },
    pending: {
        dot: 'bg-gray-400',
        icon: Clock,
        iconColor: 'text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400'
    },
    warning: {
        dot: 'bg-yellow-500',
        icon: AlertCircle,
        iconColor: 'text-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        text: 'text-yellow-700 dark:text-yellow-400'
    },
    error: {
        dot: 'bg-red-500',
        icon: XCircle,
        iconColor: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-400'
    },
    upcoming: {
        dot: 'bg-blue-500',
        icon: Calendar,
        iconColor: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-400'
    }
};

export const TimelineCard = ({
    title,
    events = [],
    className,
    size = 'md',
    variant = 'default',
    orientation = 'vertical',
    showConnectors = true,
    showDates = true,
    showAvatars = false,
    responsive = true,
    loading = false,
    emptyState,
    maxEvents,
    truncate = true,
    interactive = false,
    onEventClick,
    headerAction
}: TimelineCardProps) => {
    const config = sizeConfig[size];
    const displayedEvents = maxEvents ? events.slice(0, maxEvents) : events;
    const isCompact = variant === 'compact';
    const isDetailed = variant === 'detailed';
    const isCard = variant === 'card';

    const renderLoading = () => (
        <div className="animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={cn("rounded-full bg-muted", config.dot)} />
                        {idx < 2 && <div className={cn("flex-1 mt-1 rounded bg-muted", config.connector)} />}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted/50 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderEmptyState = () => {
        if (emptyState) return emptyState;
        
        return (
            <div className="text-center py-8">
                <div className="mx-auto max-w-sm space-y-2">
                    <div className="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center">
                        📅
                    </div>
                    <p className="text-sm text-muted-foreground">No timeline events</p>
                </div>
            </div>
        );
    };

    const renderStatusIcon = (status: keyof typeof statusConfig = 'pending') => {
        const config = statusConfig[status] || statusConfig.pending;
        const StatusIcon = config.icon;
        return <StatusIcon className={cn(sizeConfig[size].icon, config.iconColor)} />;
    };

    const renderEvent = (event: any, index: number, isLast: boolean) => {
        const status = (event.status || 'pending') as keyof typeof statusConfig;
        const statusStyle = statusConfig[status];
        const isClickable = interactive || event.onClick || event.link || onEventClick;
        
        const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            if (event.onClick) event.onClick();
            if (onEventClick) onEventClick(event, index);
        };

        const content = (
            <>
                {/* Connector line */}
                {showConnectors && !isLast && (
                    <div className={cn(
                        "absolute top-full left-1/2 -translate-x-1/2",
                        config.connector,
                        "h-6",
                        status === 'completed' ? "bg-green-500" : "bg-border"
                    )} />
                )}

                {/* Status indicator */}
                <div className={cn(
                    "relative z-10 rounded-full border-2 border-background flex items-center justify-center",
                    config.dot,
                    statusStyle.dot,
                    isClickable && "cursor-pointer hover:scale-110 transition-transform"
                )}>
                    {event.icon ? (
                        typeof event.icon === 'string' ? (
                            renderIcon(event.icon, { className: cn(config.icon, "text-background") })
                        ) : (
                            event.icon
                        )
                    ) : (
                        renderStatusIcon(status as keyof typeof statusConfig)
                    )}
                </div>
            </>
        );

        if (event.link) {
            return (
                <a
                    key={index}
                    href={event.link}
                    className="relative"
                    onClick={handleClick}
                >
                    {content}
                </a>
            );
        }

        if (isClickable) {
            return (
                <button
                    key={index}
                    onClick={handleClick}
                    className="relative focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-full"
                    type="button"
                >
                    {content}
                </button>
            );
        }

        return <div key={index} className="relative">{content}</div>;
    };

    const renderHorizontalTimeline = () => (
        <div className="overflow-x-auto pb-4">
            <div className="flex items-start min-w-max px-4">
                {displayedEvents.map((event, index) => {
                    const status = (event.status || 'pending') as keyof typeof statusConfig;
                    const statusStyle = statusConfig[status];
                    const isClickable = interactive || event.onClick || event.link || onEventClick;
                    
                    return (
                        <div key={index} className="flex flex-col items-center px-4">
                            {/* Timeline track */}
                            {index > 0 && (
                                <div className={cn(
                                    "h-0.5 w-full -translate-y-1/2",
                                    status === 'completed' ? "bg-green-500" : "bg-border"
                                )} />
                            )}
                            
                            {/* Event dot */}
                            <div className="relative z-10">
                                {renderEvent(event, index, index === displayedEvents.length - 1)}
                            </div>
                            
                            {/* Event content */}
                            <div className={cn(
                                "mt-3 text-center min-w-[120px] max-w-[200px]",
                                isClickable && "cursor-pointer"
                            )} onClick={() => isClickable && onEventClick?.(event, index)}>
                                <div className="flex flex-col items-center gap-1">
                                    <h5 className={cn(
                                        "font-medium",
                                        config.eventTitle,
                                        statusStyle.text,
                                        truncate && "truncate"
                                    )}>
                                        {event.title}
                                    </h5>
                                    
                                    {showDates && event.time && (
                                        <span className={cn(
                                            "text-muted-foreground",
                                            config.time
                                        )}>
                                            {event.time}
                                        </span>
                                    )}
                                    
                                    {!isCompact && event.description && (
                                        <p className={cn(
                                            "text-muted-foreground mt-1",
                                            config.description,
                                            truncate && "line-clamp-2"
                                        )}>
                                            {event.description}
                                        </p>
                                    )}
                                    
                                    {event.badge && (
                                        <span className={cn(
                                            "mt-1 text-xs font-medium px-2 py-0.5 rounded-full",
                                            statusStyle.bg,
                                            statusStyle.text
                                        )}>
                                            {event.badge}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderVerticalTimeline = () => (
        <div className={config.spacing}>
            {displayedEvents.map((event, index) => {
                const status = (event.status || 'pending') as keyof typeof statusConfig;
                const statusStyle = statusConfig[status];
                const isClickable = interactive || event.onClick || event.link || onEventClick;
                const isLast = index === displayedEvents.length - 1;
                
                return (
                    <div key={index} className="flex group">
                        {/* Timeline column */}
                        <div className="flex flex-col items-center mr-4">
                            {renderEvent(event, index, isLast)}
                        </div>
                        
                        {/* Content column */}
                        <div 
                            className={cn(
                                "flex-1 pb-6",
                                !isLast && "border-b border-border/50",
                                isClickable && "cursor-pointer hover:opacity-80"
                            )}
                            onClick={() => isClickable && onEventClick?.(event, index)}
                        >
                            <div className="flex flex-col">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <h5 className={cn(
                                            "font-medium",
                                            config.eventTitle,
                                            statusStyle.text,
                                            truncate && "truncate"
                                        )}>
                                            {event.title}
                                        </h5>
                                        
                                        {event.badge && (
                                            <span className={cn(
                                                "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                                                statusStyle.bg,
                                                statusStyle.text
                                            )}>
                                                {event.badge}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {showDates && event.time && (
                                        <span className={cn(
                                            "text-muted-foreground shrink-0",
                                            config.time
                                        )}>
                                            {event.time}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Description */}
                                {!isCompact && event.description && (
                                    <p className={cn(
                                        "text-muted-foreground mb-2",
                                        config.description,
                                        truncate && "line-clamp-2"
                                    )}>
                                        {event.description}
                                    </p>
                                )}
                                
                                {/* Additional info */}
                                {isDetailed && (
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        {event.duration && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {event.duration}
                                            </span>
                                        )}
                                        
                                        {showAvatars && event.people && event.people.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    {event.people.length} people
                                                </span>
                                            </div>
                                        )}
                                        
                                        {isClickable && (
                                            <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const containerClasses = cn(
        "w-full rounded-xl border",
        isCard && "shadow-sm",
        className
    );

    return (
        <div className={containerClasses}>
            {/* Header */}
            {(title || headerAction) && (
                <CardHeader className="px-4 sm:px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        {title && (
                            <h3 className={cn(
                                "font-semibold",
                                config.titleSize,
                                responsive && "text-sm sm:text-base md:text-lg"
                            )}>
                                {title}
                            </h3>
                        )}
                        {headerAction && (
                            <div className="ml-auto">
                                {headerAction}
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}
            
            {/* Content */}
            <CardContent className={config.padding}>
                {loading ? (
                    renderLoading()
                ) : displayedEvents.length === 0 ? (
                    renderEmptyState()
                ) : orientation === 'horizontal' ? (
                    renderHorizontalTimeline()
                ) : (
                    renderVerticalTimeline()
                )}
                
                {/* Show more indicator */}
                {maxEvents && events.length > maxEvents && (
                    <div className="text-center mt-6">
                        <span className="text-sm text-muted-foreground">
                            +{events.length - maxEvents} more events
                        </span>
                    </div>
                )}
            </CardContent>
        </div>
    );
};

// Pre-configured variants
TimelineCard.Horizontal = (props: Omit<TimelineCardProps, 'orientation'>) => (
    <TimelineCard orientation="horizontal" {...props} />
);

TimelineCard.Compact = (props: Omit<TimelineCardProps, 'size' | 'variant'>) => (
    <TimelineCard size="sm" variant="compact" {...props} />
);

TimelineCard.Detailed = (props: Omit<TimelineCardProps, 'variant'>) => (
    <TimelineCard variant="detailed" showAvatars {...props} />
);

TimelineCard.Card = (props: Omit<TimelineCardProps, 'variant'>) => (
    <TimelineCard variant="card" responsive {...props} />
);