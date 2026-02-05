import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, Search, ExternalLink, Copy, Check, ChevronRight, Bookmark, Share2, Eye, Users } from 'lucide-react';
import { useState } from 'react';

interface WikiCardProps {
    title: string;
    content: string;
    sections?: { title: string; content: string; id?: string }[];
    className?: string;
    variant?: 'default' | 'compact' | 'expanded' | 'encyclopedia';
    size?: 'sm' | 'md' | 'lg';
    showToc?: boolean;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    maxHeight?: string;
    searchable?: boolean;
    copyable?: boolean;
    shareable?: boolean;
    author?: string;
    lastUpdated?: string;
    views?: number;
    contributors?: number;
    tags?: string[];
    citation?: string;
    relatedLinks?: { title: string; url: string }[];
    onSearch?: (query: string) => void;
    onShare?: () => void;
    onCopy?: () => void;
    responsive?: boolean;
}

const sizeConfig = {
    sm: {
        padding: 'p-4',
        title: 'text-lg font-semibold',
        content: 'text-sm',
        sectionTitle: 'text-base font-semibold',
        toc: 'text-xs',
        meta: 'text-xs'
    },
    md: {
        padding: 'p-5 sm:p-6',
        title: 'text-xl font-semibold sm:text-2xl',
        content: 'text-sm sm:text-base',
        sectionTitle: 'text-lg font-semibold sm:text-xl',
        toc: 'text-sm',
        meta: 'text-sm'
    },
    lg: {
        padding: 'p-6 sm:p-8',
        title: 'text-2xl font-semibold sm:text-3xl',
        content: 'text-base sm:text-lg',
        sectionTitle: 'text-xl font-semibold sm:text-2xl',
        toc: 'text-base',
        meta: 'text-base'
    }
};

export const WikiCard = ({
    title,
    content,
    sections = [],
    className,
    variant = 'default',
    size = 'md',
    showToc = true,
    collapsible = false,
    defaultExpanded = true,
    maxHeight,
    searchable = false,
    copyable = false,
    shareable = false,
    author,
    lastUpdated,
    views,
    contributors,
    tags = [],
    citation,
    relatedLinks = [],
    onSearch,
    onShare,
    onCopy,
    responsive = true
}: WikiCardProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const config = sizeConfig[size];
    const isCompact = variant === 'compact';
    const isExpanded = variant === 'expanded';
    const isEncyclopedia = variant === 'encyclopedia';
    const hasSections = sections.length > 0;
    const hasMetadata = author || lastUpdated || views || contributors || tags.length > 0;

    const handleCopy = () => {
        const textToCopy = `${title}\n\n${content}\n\n${sections.map(s => `${s.title}\n${s.content}`).join('\n\n')}`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch?.(query);
    };

    const renderTableOfContents = () => {
        if (!showToc || !hasSections) return null;
        
        return (
            <div className={cn(
                "border-l-2 border-primary/20 pl-4 py-2 mb-6",
                isCompact && "hidden sm:block"
            )}>
                <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    Contents
                </h5>
                <nav className="space-y-1">
                    {sections.map((section, idx) => (
                        <a
                            key={idx}
                            href={`#${section.id || `section-${idx}`}`}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ChevronRight className="h-3 w-3" />
                            {section.title}
                        </a>
                    ))}
                </nav>
            </div>
        );
    };

    const renderContent = () => (
        <div className="space-y-6">
            {/* Main Content */}
            <div className={cn(
                "prose dark:prose-invert max-w-none leading-relaxed",
                config.content,
                responsive && size === 'md' && "text-sm sm:text-base",
                responsive && size === 'lg' && "text-base sm:text-lg"
            )}>
                {content.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && <p key={idx} className="mb-4">{paragraph}</p>
                ))}
            </div>

            {/* Sections */}
            {hasSections && expanded && (
                <div className="space-y-8 pt-6 border-t border-border/40">
                    {sections.map((section, idx) => (
                        <section key={idx} id={section.id || `section-${idx}`} className="scroll-mt-20">
                            <h4 className={cn(
                                "font-bold tracking-tight text-foreground mb-4 pb-2 border-b border-border/40",
                                config.sectionTitle,
                                responsive && size === 'md' && "text-lg sm:text-xl",
                                responsive && size === 'lg' && "text-xl sm:text-2xl"
                            )}>
                                {section.title}
                            </h4>
                            <div className={cn(
                                "text-muted-foreground leading-relaxed",
                                config.content,
                                responsive && size === 'md' && "text-sm sm:text-base",
                                responsive && size === 'lg' && "text-base sm:text-lg"
                            )}>
                                {section.content.split('\n').map((p, pIdx) => (
                                    p.trim() && <p key={pIdx} className="mb-3">{p}</p>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {/* Related Links */}
            {relatedLinks.length > 0 && (
                <div className="pt-6 border-t border-border/40">
                    <h5 className="text-lg font-semibold mb-4">Related Articles</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {relatedLinks.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                                <span className="text-sm font-medium truncate">{link.title}</span>
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderMetadata = () => {
        if (!hasMetadata) return null;

        return (
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mt-6 pt-6 border-t border-border/40">
                {author && (
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span className={config.meta}>{author}</span>
                    </div>
                )}
                
                {lastUpdated && (
                    <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        <span className={config.meta}>Updated {lastUpdated}</span>
                    </div>
                )}
                
                {views !== undefined && (
                    <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        <span className={config.meta}>{views.toLocaleString()} views</span>
                    </div>
                )}
                
                {contributors !== undefined && (
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span className={config.meta}>{contributors} contributors</span>
                    </div>
                )}
                
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-auto">
                        {tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className={cn(
            "w-full flex flex-col overflow-hidden border-border bg-card",
            isEncyclopedia && "shadow-lg",
            className
        )}>
            {/* Header */}
            <CardHeader className={cn(
                "pb-4 border-b border-border/40 space-y-2",
                isEncyclopedia && "bg-linear-to-r from-primary/5 to-primary/10",
                config.padding
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className={cn(
                            "text-primary",
                            size === 'sm' ? "h-3.5 w-3.5" : 
                            size === 'md' ? "h-4 w-4" : 
                            "h-5 w-5"
                        )} />
                        <span className={cn(
                            "uppercase tracking-widest font-bold",
                            size === 'sm' ? "text-[10px]" : 
                            size === 'md' ? "text-xs" : 
                            "text-sm"
                        )}>
                            {isEncyclopedia ? 'Encyclopedia' : 'Documentation'}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {searchable && (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className={cn(
                                        "pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20",
                                        responsive && "w-32 sm:w-48"
                                    )}
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        )}
                        
                        {copyable && (
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                aria-label={copied ? "Copied" : "Copy article"}
                                type="button"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                        )}
                        
                        {shareable && (
                            <button
                                onClick={onShare}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                aria-label="Share article"
                                type="button"
                            >
                                <Share2 className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>
                
                <CardTitle className={cn(
                    "font-serif tracking-tight text-foreground",
                    config.title,
                    responsive && size === 'md' && "text-xl sm:text-2xl",
                    responsive && size === 'lg' && "text-2xl sm:text-3xl"
                )}>
                    {title}
                </CardTitle>
                
                {citation && (
                    <div className="text-sm text-muted-foreground font-mono bg-muted/50 p-3 rounded-lg">
                        {citation}
                    </div>
                )}
            </CardHeader>

            {/* Content Area */}
            <CardContent className={cn(
                "flex-1 overflow-y-auto",
                config.padding,
                !isCompact && "grid grid-cols-1 lg:grid-cols-4 gap-8"
            )} style={{ maxHeight }}>
                {/* Table of Contents (Desktop) */}
                {!isCompact && hasSections && showToc && (
                    <div className="lg:col-span-1">
                        {renderTableOfContents()}
                    </div>
                )}

                {/* Main Content */}
                <div className={cn(
                    "lg:col-span-3",
                    !isCompact && hasSections && showToc && "lg:col-span-3"
                )}>
                    {collapsible ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-2 text-primary hover:underline"
                                type="button"
                            >
                                <ChevronRight className={cn(
                                    "h-4 w-4 transition-transform",
                                    expanded && "rotate-90"
                                )} />
                                {expanded ? 'Collapse' : 'Expand'} Article
                            </button>
                            
                            {expanded && renderContent()}
                        </div>
                    ) : (
                        renderContent()
                    )}
                    
                    {renderMetadata()}
                </div>

                {/* Table of Contents (Mobile) */}
                {isCompact && hasSections && showToc && (
                    <div className="lg:hidden mt-8">
                        {renderTableOfContents()}
                    </div>
                )}
            </CardContent>

            {/* Footer */}
            {isExpanded && hasSections && (
                <CardFooter className={cn(
                    "border-t border-border/40 bg-muted/30",
                    config.padding
                )}>
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-muted-foreground">
                            {sections.length} sections
                        </span>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                            type="button"
                        >
                            <Bookmark className="h-3.5 w-3.5" />
                            Back to top
                        </button>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
};

// Pre-styled variants
WikiCard.Compact = (props: Omit<WikiCardProps, 'variant' | 'size' | 'showToc'>) => (
    <WikiCard 
        variant="compact" 
        size="sm" 
        showToc={false}
        {...props} 
    />
);

WikiCard.Expanded = (props: Omit<WikiCardProps, 'variant' | 'collapsible'>) => (
    <WikiCard 
        variant="expanded" 
        collapsible={false}
        {...props} 
    />
);

WikiCard.Encyclopedia = (props: Omit<WikiCardProps, 'variant'>) => (
    <WikiCard 
        variant="encyclopedia" 
        showToc 
        responsive
        {...props} 
    />
);

WikiCard.Documentation = (props: Omit<WikiCardProps, 'variant' | 'size'>) => (
    <WikiCard 
        size="lg" 
        showToc 
        searchable
        copyable
        {...props} 
    />
);