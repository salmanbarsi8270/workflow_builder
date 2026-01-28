import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, ExternalLink, Quote } from 'lucide-react';

interface WikiCardProps {
    title: string;
    subtitle?: string;
    content: string;
    imageUrl?: string;
    citations?: string[];
    relatedLinks?: { label: string; url: string }[];
    className?: string;
}

export const WikiCard = ({
    title,
    subtitle,
    content,
    imageUrl,
    citations = [],
    relatedLinks = [],
    className
}: WikiCardProps) => {
    return (
        <Card className={cn("w-full h-full flex flex-col overflow-hidden border-border/50", className)}>
            <CardHeader className="pb-3 bg-muted/30 border-b border-border/40 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground/80 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Encyclopedia</span>
                </div>
                <CardTitle className="text-2xl font-serif tracking-tight text-foreground">{title}</CardTitle>
                {subtitle && <CardDescription className="text-base font-medium text-muted-foreground">{subtitle}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Main Content Area */}
                    <div className="flex-1 space-y-4">
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed font-serif">
                            {/* Simple parsing for line breaks if not HTML */}
                            {content.split('\n').map((paragraph, idx) => (
                                paragraph.trim() && <p key={idx} className="mb-4 first-letter:text-3xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-none">{paragraph}</p>
                            ))}
                        </div>

                        {/* Citations/References */}
                        {citations.length > 0 && (
                            <div className="mt-8 pt-4 border-t border-border/40">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <Quote className="h-3 w-3" /> References
                                </h4>
                                <ol className="list-decimal list-inside space-y-1">
                                    {citations.map((cite, idx) => (
                                        <li key={idx} className="text-xs text-muted-foreground/80 pl-2">
                                            {cite}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Infobox (Optional) */}
                    {(imageUrl || relatedLinks.length > 0) && (
                        <div className="w-full md:w-64 shrink-0 space-y-6">
                            {imageUrl && (
                                <div className="border border-border/40 p-1 bg-background rounded-sm shadow-sm">
                                    <img
                                        src={imageUrl}
                                        alt={title}
                                        className="w-full h-auto object-cover rounded-sm aspect-video md:aspect-square"
                                    />
                                    <div className="p-2 text-[10px] text-center text-muted-foreground italic bg-muted/20">
                                        Figure 1: {title}
                                    </div>
                                </div>
                            )}

                            {relatedLinks.length > 0 && (
                                <div className="bg-muted/20 rounded-lg p-4 border border-border/40">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">See Also</h4>
                                    <ul className="space-y-2">
                                        {relatedLinks.map((link, idx) => (
                                            <li key={idx}>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 transition-colors"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    {link.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
