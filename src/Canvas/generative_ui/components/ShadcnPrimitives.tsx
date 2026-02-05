"use client"

import { cn } from "@/lib/utils"
import { Button as BaseButton } from "@/components/ui/button"
import { Badge as BaseBadge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChevronDown, User } from 'lucide-react'
import { renderIcon } from "./utils"
import type { ReactNode } from "react"

/**
 * A highly versatile button component for generative UI.
 */
interface GenButtonProps {
    label?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    icon?: string | ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    className?: string;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    responsive?: boolean;
    pill?: boolean;
}

export const GenButton = ({ 
    label, 
    variant = 'default', 
    size = 'md', 
    icon, 
    iconPosition = 'left',
    fullWidth = false,
    className, 
    onClick,
    loading = false,
    disabled = false,
    responsive = true,
    pill = false
}: GenButtonProps) => {
    const sizeConfig = {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-xs',
        lg: 'h-10 px-5 text-sm',
        xl: 'h-12 px-6 text-base'
    };

    const responsiveSizeConfig = {
        sm: 'h-7 px-2.5 text-xs sm:h-8 sm:px-3 sm:text-xs',
        md: 'h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm',
        lg: 'h-10 px-5 text-sm sm:h-11 sm:px-6 sm:text-base',
        xl: 'h-12 px-6 text-base sm:h-13 sm:px-7 sm:text-lg'
    };

    const renderIconElement = () => {
        if (!icon || loading) return null;
        if (typeof icon === 'string') {
            return renderIcon(icon, { 
                className: cn(
                    responsive && size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
                    label && (iconPosition === 'left' ? 'mr-2' : 'ml-2')
                ) 
            });
        }
        return icon;
    };

    return (
        <BaseButton
            variant={variant === 'gradient' ? 'default' : variant}
            size={variant === 'gradient' ? 'default' : undefined}
            className={cn(
                "font-semibold transition-all active:scale-[0.98]",
                responsive ? responsiveSizeConfig[size] : sizeConfig[size],
                fullWidth && "w-full",
                pill && "rounded-full",
                variant === 'gradient' && "bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg",
                !pill && "rounded-lg sm:rounded-xl",
                loading && "opacity-70 cursor-not-allowed",
                className
            )}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {iconPosition === 'left' && renderIconElement()}
            {label}
            {iconPosition === 'right' && renderIconElement()}
        </BaseButton>
    )
}

/**
 * A styled badge for categorization.
 */
interface GenBadgeProps {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    icon?: string | ReactNode;
    className?: string;
    responsive?: boolean;
    dot?: boolean;
}

export const GenBadge = ({ 
    label, 
    variant = 'default', 
    size = 'md',
    icon,
    className,
    responsive = true,
    dot = false
}: GenBadgeProps) => {
    const sizeConfig = {
        sm: 'h-4.5 px-1.5 text-[10px]',
        md: 'h-5.5 px-2 text-[10px]',
        lg: 'h-6.5 px-2.5 text-xs'
    };

    const responsiveSizeConfig = {
        sm: 'h-4.5 px-1.5 text-[10px] sm:h-5 sm:px-2 sm:text-[10px]',
        md: 'h-5.5 px-2 text-[10px] sm:h-6 sm:px-2.5 sm:text-xs',
        lg: 'h-6.5 px-2.5 text-xs sm:h-7 sm:px-3 sm:text-sm'
    };

    const variantConfig = {
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        gradient: 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/20'
    };

    return (
        <BaseBadge 
            variant={(['success', 'warning', 'info', 'gradient'].includes(variant) ? 'secondary' : variant) as any}
            className={cn(
                "rounded-full font-semibold uppercase tracking-wide border",
                responsive ? responsiveSizeConfig[size] : sizeConfig[size],
                variantConfig[variant as keyof typeof variantConfig],
                className
            )}
        >
            {dot && (
                <div className={cn(
                    "rounded-full mr-1.5",
                    size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : 'h-2.5 w-2.5',
                    variant === 'success' && 'bg-green-500',
                    variant === 'warning' && 'bg-yellow-500',
                    variant === 'info' && 'bg-blue-500',
                    variant === 'gradient' && 'bg-primary',
                    !['success', 'warning', 'info', 'gradient'].includes(variant) && 'bg-current'
                )} />
            )}
            {icon && typeof icon === 'string' ? renderIcon(icon, { 
                className: cn(
                    'mr-1',
                    size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-3.5 w-3.5'
                ) 
            }) : icon}
            {label}
        </BaseBadge>
    )
}

/**
 * An interactive accordion for collapsible content.
 */
interface GenAccordionProps {
    items?: Array<{
        title: string;
        content: ReactNode;
        icon?: string | ReactNode;
        badge?: string;
        disabled?: boolean;
    }>;
    title?: string;
    className?: string;
    type?: 'single' | 'multiple';
    size?: 'sm' | 'md' | 'lg';
    bordered?: boolean;
    responsive?: boolean;
}

export const GenAccordion = ({ 
    items = [], 
    title, 
    className,
    type = 'single',
    size = 'md',
    bordered = true
}: GenAccordionProps) => {
    const sizeConfig = {
        sm: {
            padding: 'p-3',
            titleSize: 'text-xs font-semibold',
            contentSize: 'text-[10px]',
            iconSize: 'h-3 w-3'
        },
        md: {
            padding: 'p-4',
            titleSize: 'text-sm font-semibold',
            contentSize: 'text-xs sm:text-sm',
            iconSize: 'h-3.5 w-3.5 sm:h-4 sm:w-4'
        },
        lg: {
            padding: 'p-5',
            titleSize: 'text-base font-semibold',
            contentSize: 'text-sm sm:text-base',
            iconSize: 'h-4 w-4 sm:h-5 sm:w-5'
        }
    };

    const config = sizeConfig[size];

    return (
        <div className={cn(
            "w-full rounded-xl",
            bordered ? "border bg-card" : "bg-transparent",
            config.padding,
            className
        )}>
            {title && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-6 w-1 rounded-full bg-primary" />
                    <h3 className={cn(
                        "font-bold text-foreground tracking-tight",
                        size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
                    )}>
                        {title}
                    </h3>
                </div>
            )}
            <Accordion type={type} collapsible className="w-full space-y-2">
                {items.map((item, idx) => (
                    <AccordionItem 
                        key={idx} 
                        value={`item-${idx}`} 
                        className={cn(
                            "rounded-lg",
                            bordered ? "border bg-background" : "border-0"
                        )}
                    >
                        <AccordionTrigger className={cn(
                            "px-4 hover:no-underline hover:bg-muted/50",
                            config.titleSize,
                            item.disabled && "opacity-50 cursor-not-allowed"
                        )}>
                            <div className="flex items-center gap-3 w-full">
                                {item.icon && (typeof item.icon === 'string' ? 
                                    renderIcon(item.icon, { className: cn("text-primary", config.iconSize) }) : 
                                    item.icon
                                )}
                                <span className="flex-1 text-left">{item.title}</span>
                                {item.badge && (
                                    <GenBadge 
                                        label={item.badge} 
                                        size={size === 'sm' ? 'sm' : 'md'} 
                                        variant="outline"
                                        className="shrink-0"
                                    />
                                )}
                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className={cn(
                            "px-4 pt-2 pb-4 text-muted-foreground leading-relaxed",
                            config.contentSize
                        )}>
                            {item.content}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

/**
 * A clean user avatar component.
 */
interface GenAvatarProps {
    src?: string;
    fallback?: string;
    name?: string;
    subtext?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    shape?: 'circle' | 'square' | 'rounded';
    online?: boolean;
    badge?: string;
    stacked?: boolean;
    responsive?: boolean;
    onClick?: () => void;
}

export const GenAvatar = ({ 
    src, 
    fallback, 
    name, 
    subtext, 
    className,
    size = 'md',
    shape = 'circle',
    online = false,
    badge,
    stacked = false,
    onClick
}: GenAvatarProps) => {
    const sizeConfig = {
        sm: { avatar: 'h-7 w-7', text: 'text-[10px]', subtext: 'text-[9px]', icon: 'h-3 w-3' },
        md: { avatar: 'h-9 w-9 sm:h-10 sm:w-10', text: 'text-xs sm:text-sm', subtext: 'text-[10px] sm:text-xs', icon: 'h-3.5 w-3.5' },
        lg: { avatar: 'h-12 w-12 sm:h-14 sm:w-14', text: 'text-sm sm:text-base', subtext: 'text-xs sm:text-sm', icon: 'h-4 w-4' },
        xl: { avatar: 'h-16 w-16 sm:h-20 sm:w-20', text: 'text-base sm:text-lg', subtext: 'text-sm sm:text-base', icon: 'h-5 w-5' }
    };

    const config = sizeConfig[size];
    const shapeClass = {
        circle: 'rounded-full',
        square: 'rounded-lg',
        rounded: 'rounded-xl'
    }[shape];

    const content = (
        <div className={cn(
            "flex items-center gap-3 sm:gap-4",
            stacked && "flex-col text-center",
            onClick && "cursor-pointer hover:opacity-90 transition-opacity",
            className
        )}>
            <div className="relative">
                <Avatar className={cn(
                    config.avatar,
                    shapeClass,
                    "border-2 border-background shadow-sm",
                    stacked && "mx-auto"
                )}>
                    <AvatarImage src={src} />
                    <AvatarFallback className={cn(
                        "bg-primary/10 text-primary font-bold",
                        shapeClass
                    )}>
                        {fallback || name?.charAt(0)?.toUpperCase() || <User className={config.icon} />}
                    </AvatarFallback>
                </Avatar>
                
                {online && (
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-background bg-green-500" />
                )}
                
                {badge && (
                    <div className="absolute -top-1 -right-1">
                        <GenBadge label={badge} size="sm" variant="destructive" />
                    </div>
                )}
            </div>
            
            {(name || subtext) && (
                <div className={cn(
                    "flex flex-col",
                    stacked && "items-center"
                )}>
                    {name && (
                        <span className={cn(
                            "font-semibold text-foreground tracking-tight",
                            config.text
                        )}>
                            {name}
                        </span>
                    )}
                    {subtext && (
                        <span className={cn(
                            "font-medium text-muted-foreground mt-0.5",
                            config.subtext
                        )}>
                            {subtext}
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className="text-left">
                {content}
            </button>
        );
    }

    return content;
}

/**
 * A high-level tabs container for complex layouts.
 */
interface GenTabsProps {
    items: Array<{
        label: string;
        value: string;
        content: ReactNode;
        icon?: string | ReactNode;
        badge?: string | number;
        disabled?: boolean;
    }>;
    defaultValue?: string;
    className?: string;
    variant?: 'default' | 'pills' | 'underline' | 'segmented';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    responsive?: boolean;
}

export const GenTabs = ({ 
    items = [], 
    defaultValue,
    className,
    variant = 'default',
    size = 'md',
    fullWidth = true,
    responsive = true
}: GenTabsProps) => {
    const sizeConfig = {
        sm: { trigger: 'h-7 px-2.5 text-[10px]', list: 'h-8 p-0.5' },
        md: { trigger: 'h-9 px-3.5 text-xs', list: 'h-10 p-1' },
        lg: { trigger: 'h-10 px-5 text-sm', list: 'h-11 p-1.5' }
    };

    const variantConfig = {
        pills: {
            list: "bg-transparent p-0 gap-1",
            trigger: "rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        },
        underline: {
            list: "bg-transparent p-0 border-b",
            trigger: "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        },
        segmented: {
            list: "bg-muted/40 p-1",
            trigger: "rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
        }
    };

    const config = sizeConfig[size];
    const variantStyle = variant === 'default' 
        ? { list: "", trigger: "" } 
        : variantConfig[variant as keyof typeof variantConfig];

    return (
        <Tabs 
            defaultValue={defaultValue || items[0]?.value} 
            className={cn("w-full", className)}
        >
            <TabsList className={cn(
                "mb-6",
                fullWidth && "w-full",
                variant === 'default' && cn("bg-muted/40", config.list),
                variantStyle.list,
                className
            )}>
                {items.map((item) => (
                    <TabsTrigger 
                        key={item.value} 
                        value={item.value} 
                        className={cn(
                            "flex items-center gap-2 font-medium transition-all",
                            fullWidth && "flex-1",
                            variant === 'default' && config.trigger,
                            variantStyle.trigger,
                            responsive && size === 'sm' && "text-xs sm:text-sm",
                            responsive && size === 'md' && "text-sm sm:text-base",
                            responsive && size === 'lg' && "text-base sm:text-lg",
                            item.disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {item.icon && (typeof item.icon === 'string' ? 
                            renderIcon(item.icon, { 
                                className: cn(
                                    size === 'sm' ? 'h-3 w-3' : 
                                    size === 'md' ? 'h-3.5 w-3.5' : 
                                    'h-4 w-4'
                                ) 
                            }) : 
                            item.icon
                        )}
                        {item.label}
                        {item.badge && (
                            <GenBadge 
                                label={String(item.badge)} 
                                size={size === 'sm' ? 'sm' : 'md'} 
                                variant="outline"
                                className="ml-1"
                            />
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>
            {items.map((item) => (
                <TabsContent 
                    key={item.value} 
                    value={item.value} 
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                    {item.content}
                </TabsContent>
            ))}
        </Tabs>
    )
}

/**
 * Avatar Group for displaying multiple avatars
 */
interface GenAvatarGroupProps {
    avatars: Array<{
        src?: string;
        fallback?: string;
        name?: string;
    }>;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const GenAvatarGroup = ({ 
    avatars = [], 
    max = 4, 
    size = 'md', 
    className
}: GenAvatarGroupProps) => {
    const sizeConfig = {
        sm: 'h-7 w-7',
        md: 'h-9 w-9 sm:h-10 sm:w-10',
        lg: 'h-12 w-12 sm:h-14 sm:w-14'
    };

    const displayedAvatars = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
        <div className={cn("flex items-center", className)}>
            <div className="flex -space-x-3 sm:-space-x-4">
                {displayedAvatars.map((avatar, idx) => (
                    <Avatar 
                        key={idx} 
                        className={cn(
                            "border-2 border-background shadow-sm",
                            sizeConfig[size]
                        )}
                    >
                        <AvatarImage src={avatar.src} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {avatar.fallback || avatar.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                ))}
                {remaining > 0 && (
                    <div className={cn(
                        "rounded-full border-2 border-background bg-muted flex items-center justify-center text-muted-foreground font-bold shadow-sm",
                        sizeConfig[size]
                    )}>
                        +{remaining}
                    </div>
                )}
            </div>
            <span className="ml-4 text-sm text-muted-foreground">
                {avatars.length} members
            </span>
        </div>
    )
}