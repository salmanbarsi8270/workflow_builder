import { cn } from '@/lib/utils';
import { Copy, Check, ExternalLink, MessageSquare, FileText, Quote } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface TextCardProps {
    content: string | ReactNode;
    className?: string;
    variant?: 'default' | 'quote' | 'code' | 'note' | 'warning' | 'success' | 'error';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    align?: 'left' | 'center' | 'right';
    title?: string;
    author?: string;
    icon?: ReactNode;
    copyable?: boolean;
    bordered?: boolean;
    shadow?: boolean;
    background?: boolean;
    maxLines?: number;
    truncate?: boolean;
    responsive?: boolean;
    loading?: boolean;
    onClick?: () => void;
    footer?: ReactNode;
    link?: string;
    target?: '_blank' | '_self';
    highlight?: boolean;
    badge?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    interactive?: boolean;
}

const sizeConfig = {
    sm: {
        padding: 'p-3 sm:p-4',
        text: 'text-sm',
        title: 'text-sm font-semibold',
        icon: 'h-4 w-4',
        lineHeight: 'leading-relaxed',
        gap: 'gap-2'
    },
    md: {
        padding: 'p-4 sm:p-5',
        text: 'text-sm sm:text-base',
        title: 'text-base font-semibold sm:text-lg',
        icon: 'h-5 w-5',
        lineHeight: 'leading-relaxed sm:leading-loose',
        gap: 'gap-3'
    },
    lg: {
        padding: 'p-5 sm:p-6 md:p-8',
        text: 'text-base sm:text-lg',
        title: 'text-lg font-semibold sm:text-xl',
        icon: 'h-6 w-6',
        lineHeight: 'leading-loose',
        gap: 'gap-4'
    },
    xl: {
        padding: 'p-6 sm:p-8 md:p-10',
        text: 'text-lg sm:text-xl',
        title: 'text-xl font-semibold sm:text-2xl',
        icon: 'h-7 w-7',
        lineHeight: 'leading-loose',
        gap: 'gap-5'
    }
};

const paddingConfig = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6 md:p-8',
    xl: 'p-6 sm:p-8 md:p-10'
};

const radiusConfig = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-2xl'
};

const variantConfig = {
    default: {
        bg: 'bg-card',
        border: 'border-border',
        text: 'text-foreground',
        accent: 'bg-primary/5',
        icon: FileText
    },
    quote: {
        bg: 'bg-gradient-to-br from-card to-primary/5',
        border: 'border-primary/20',
        text: 'text-foreground/90',
        accent: 'border-l-4 border-l-primary',
        icon: Quote
    },
    code: {
        bg: 'bg-gray-900 dark:bg-gray-950',
        border: 'border-gray-800 dark:border-gray-900',
        text: 'text-gray-100 font-mono',
        accent: 'border-l-2 border-l-green-500',
        icon: MessageSquare
    },
    note: {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-900 dark:text-blue-100',
        accent: 'border-l-4 border-l-blue-500',
        icon: MessageSquare
    },
    warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-900 dark:text-yellow-100',
        accent: 'border-l-4 border-l-yellow-500',
        icon: MessageSquare
    },
    success: {
        bg: 'bg-green-50 dark:bg-green-950/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-900 dark:text-green-100',
        accent: 'border-l-4 border-l-green-500',
        icon: Check
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-900 dark:text-red-100',
        accent: 'border-l-4 border-l-red-500',
        icon: MessageSquare
    }
};

export const TextCard = ({
    content,
    className,
    variant = 'default',
    size = 'md',
    align = 'left',
    title,
    author,
    icon,
    copyable = false,
    bordered = true,
    shadow = false,
    background = true,
    maxLines,
    truncate = false,
    responsive = true,
    loading = false,
    onClick,
    footer,
    link,
    target = '_blank',
    highlight = false,
    badge,
    padding,
    radius = 'md',
    interactive
}: TextCardProps) => {
    const [copied, setCopied] = useState(false);
    const config = sizeConfig[size];
    const variantStyle = variantConfig[variant];
    const isInteractive = !!onClick || !!link || interactive;
    const hasCustomPadding = padding !== undefined;
    const paddingClass = hasCustomPadding ? paddingConfig[padding] : config.padding;

    const handleCopy = async () => {
        if (typeof content === 'string') {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getAlignClasses = () => {
        switch (align) {
            case 'center': return 'text-center items-center';
            case 'right': return 'text-right items-end';
            default: return 'text-left items-start';
        }
    };

    const renderLoading = () => (
        <div className="animate-pulse">
            {title && (
                <div className="h-5 w-32 bg-muted rounded mb-3" />
            )}
            <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-4/5 bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
            {author && (
                <div className="h-3 w-24 bg-muted rounded mt-4" />
            )}
        </div>
    );

    const renderContent = () => {
        if (loading) return renderLoading();

        return (
            <>
                {/* Header */}
                {(title || icon || badge) && (
                    <div className={cn(
                        "flex items-center justify-between mb-3",
                        getAlignClasses(),
                        config.gap
                    )}>
                        <div className="flex items-center gap-2 min-w-0">
                            {icon && (
                                <div className="shrink-0">
                                    {icon}
                                </div>
                            )}
                            {title && (
                                <h3 className={cn(
                                    "font-semibold truncate",
                                    variantStyle.text,
                                    config.title,
                                    responsive && "text-sm sm:text-base"
                                )}>
                                    {title}
                                </h3>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                            {badge && (
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                    variant === 'success' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                    variant === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                    variant === 'error' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                    variant === 'note' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                    "bg-primary/10 text-primary"
                                )}>
                                    {badge}
                                </span>
                            )}
                            
                            {copyable && typeof content === 'string' && (
                                <button
                                    onClick={handleCopy}
                                    className="p-1 hover:bg-current/10 rounded transition-colors"
                                    aria-label={copied ? "Copied" : "Copy text"}
                                    type="button"
                                >
                                    {copied ? (
                                        <Check className="h-3.5 w-3.5" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className={cn(
                    "whitespace-pre-wrap break-words",
                    getAlignClasses(),
                    config.text,
                    config.lineHeight,
                    truncate && "truncate",
                    maxLines && `line-clamp-${maxLines}`,
                    variant === 'code' && "font-mono",
                    responsive && size === 'sm' && "text-xs sm:text-sm",
                    responsive && size === 'md' && "text-sm sm:text-base",
                    responsive && size === 'lg' && "text-base sm:text-lg"
                )}>
                    {content}
                </div>

                {/* Footer */}
                {(author || footer) && (
                    <div className={cn(
                        "mt-4 pt-3 border-t border-border/50",
                        getAlignClasses(),
                        config.gap
                    )}>
                        {author && (
                            <div className="text-sm text-muted-foreground italic">
                                — {author}
                            </div>
                        )}
                        {footer}
                    </div>
                )}

                {/* External link indicator */}
                {link && (
                    <div className="mt-3">
                        <a
                            href={link}
                            target={target}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                        >
                            View source
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                )}
            </>
        );
    };

    const cardClasses = cn(
        "w-full transition-all duration-200",
        background && variantStyle.bg,
        bordered && "border",
        bordered && variantStyle.border,
        shadow && "shadow-sm hover:shadow-md",
        highlight && "ring-2 ring-primary/20",
        paddingClass,
        radiusConfig[radius],
        variantStyle.accent,
        isInteractive && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className
    );

    const contentElement = (
        <div className={cn("flex flex-col", config.gap)}>
            {renderContent()}
        </div>
    );

    if (link) {
        return (
            <a
                href={link}
                target={target}
                className={cn(cardClasses, "block no-underline hover:no-underline")}
                rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            >
                {contentElement}
            </a>
        );
    }

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={cn(cardClasses, "text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2")}
                type="button"
            >
                {contentElement}
            </button>
        );
    }

    return (
        <div className={cardClasses}>
            {contentElement}
        </div>
    );
};

// Pre-styled variants
TextCard.Quote = (props: Omit<TextCardProps, 'variant'>) => (
    <TextCard variant="quote" icon={<Quote className="text-primary" />} {...props} />
);

TextCard.Code = (props: Omit<TextCardProps, 'variant'>) => (
    <TextCard variant="code" copyable size="sm" {...props} />
);

TextCard.Note = (props: Omit<TextCardProps, 'variant'>) => (
    <TextCard variant="note" icon={<MessageSquare className="text-blue-500" />} {...props} />
);

TextCard.Warning = (props: Omit<TextCardProps, 'variant'>) => (
    <TextCard variant="warning" icon={<MessageSquare className="text-yellow-500" />} {...props} />
);

TextCard.Success = (props: Omit<TextCardProps, 'variant'>) => (
    <TextCard variant="success" icon={<Check className="text-green-500" />} {...props} />
);

// Compact version
TextCard.Compact = (props: Omit<TextCardProps, 'size' | 'bordered' | 'shadow'>) => (
    <TextCard 
        size="sm" 
        bordered={false} 
        shadow={false}
        background={false}
        className="bg-transparent p-0"
        {...props}
    />
);

// Interactive version
TextCard.Interactive = (props: Omit<TextCardProps, 'interactive'> & { onClick: () => void }) => (
    <TextCard 
        interactive 
        shadow 
        className="hover:shadow-lg transition-all"
        {...props}
    />
);

// Inline version for text flow
TextCard.Inline = (props: Omit<TextCardProps, 'background' | 'bordered' | 'padding' | 'radius'>) => (
    <TextCard 
        background={false}
        bordered={false}
        padding="none"
        radius="none"
        className="inline"
        {...props}
    />
);