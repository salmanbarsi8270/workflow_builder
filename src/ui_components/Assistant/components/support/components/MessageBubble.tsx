import React, { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { SupportTable } from './SupportTable';
import { SupportForm } from './SupportForm';
import { SupportDetails } from './SupportDetails';

interface MessageBubbleProps {
    message: {
        content: string;
        role: 'user' | 'assistant';
        status?: 'sending' | 'sent' | 'error';
    };
    role: 'user' | 'assistant';
    isTyping?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, role, isTyping = false }) => {
    const [highlighted, setHighlighted] = useState(false);

    const handleMouseEnter = () => {
        setHighlighted(true);
    };

    const handleMouseLeave = () => {
        setHighlighted(false);
    };

    const renderContent = () => {
        if (isTyping && role === 'assistant') {
            return (
                <div className="flex items-center gap-2 py-1">
                    <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground dark:text-white/40 italic">Thinking...</span>
                </div>
            );
        }

        let displayContent = message.content;
        
        // Scrub system-wrapped user prompt (e.g., from Thinking Agent orchestration)
        if (role === 'user' && displayContent.includes("### User's Automations Context:")) {
            const queryMatch = displayContent.match(/### User's Query:\s*\n?"?([\s\S]+?)"?$/i);
            if (queryMatch) {
                displayContent = queryMatch[1].trim();
            }
        }

        // Parse content for JSON blocks
        const parts: string[] = [];
        let lastIndex = 0;
        const blockRegex = /(```(?:json)?[\s\S]*?(?:```|$))/g;
        let match;

        while ((match = blockRegex.exec(displayContent)) !== null) {
            if (match.index > lastIndex) {
                parts.push(displayContent.substring(lastIndex, match.index));
            }
            parts.push(match[0]);
            lastIndex = blockRegex.lastIndex;
        }
        if (lastIndex < displayContent.length) {
            parts.push(displayContent.substring(lastIndex));
        }
        
        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                const isComplete = part.endsWith('```');
                const jsonStr = part.replace(/```(?:json)?/g, '').trim();
                
                if (isComplete) {
                    try {
                        let data = JSON.parse(jsonStr);
                        
                        // If it's the standard wrapper { success, data, ... }, extract data
                        if (data && typeof data === 'object' && !Array.isArray(data)) {
                            if (data.type === 'form') {
                                return <SupportForm key={index} data={data} />;
                            }
                            
                            // Check for common data list keys
                            const listData = data.data || data.agents || data.flows || data.users || data.runs || data.rows;
                            if (Array.isArray(listData)) {
                                return <SupportTable key={index} data={listData} title={data.title || data.explanation || data.message} columns={data.columns} />;
                            }
                            
                            // Single record detail view
                            return <SupportDetails key={index} data={data} />;
                        }

                        if (Array.isArray(data)) {
                            return <SupportTable key={index} data={data} />;
                        }
                    } catch (e) {
                        // RECOVERY: If direct parse fails, try to extract JSON from a likely "dirty" block
                        try {
                            const firstBrace = jsonStr.indexOf('{');
                            const firstBracket = jsonStr.indexOf('[');
                            const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
                            
                            if (start !== -1) {
                                const lastBrace = jsonStr.lastIndexOf('}');
                                const lastBracket = jsonStr.lastIndexOf(']');
                                const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;
                                
                                if (end !== -1 && end > start) {
                                    const extracted = jsonStr.substring(start, end + 1);
                                    let data = JSON.parse(extracted);
                                    
                                    if (data && typeof data === 'object') {
                                        if (data.type === 'form') return <SupportForm key={index} data={data} />;
                                        const listData = data.data || data.agents || data.flows || data.users || data.runs || data.rows || data.templates;
                                        if (Array.isArray(listData)) return <SupportTable key={index} data={listData} title={data.explanation || data.message} />;
                                        if (Array.isArray(data)) return <SupportTable key={index} data={data} />;
                                        return <SupportDetails key={index} data={data} />;
                                    }
                                }
                            }
                        } catch (innerError) {
                            // Still failed, fall back to pre
                        }

                        // Not valid JSON or not an array, render as code block
                        return (
                            <pre key={index} className="my-2 p-3 rounded-lg bg-slate-100 dark:bg-white/5 overflow-x-auto text-[11px] font-mono">
                                <code>{jsonStr}</code>
                            </pre>
                        );
                    }
                } else {
                    // This is a partial block during streaming
                    return (
                        <div key={index} className="my-4 p-6 rounded-2xl border border-dashed border-primary/20 bg-primary/5 animate-pulse flex flex-col items-center gap-3">
                            <div className="flex gap-1">
                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Generating table...</span>
                        </div>
                    );
                }
            }

            // Fallback: If no backticks but looks like JSON, try parsing the whole thing
            if (index === 0 && !message.content.includes('```')) {
                const trimmed = message.content.trim();
                if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                    try {
                        let data = JSON.parse(trimmed);
                        
                        // Handle API wrappers: { success, output: "{...}" }
                        if (data && typeof data === 'object' && !Array.isArray(data) && data.output && typeof data.output === 'string') {
                            try {
                                const unwrapped = JSON.parse(data.output.trim());
                                if (unwrapped && typeof unwrapped === 'object') {
                                    data = unwrapped;
                                }
                            } catch (e) {
                                // output is not JSON, we'll just display it as an object or text
                            }
                        }

                        // Try to find a list in the data
                        const listData = Array.isArray(data) ? data : (data.data || data.agents || data.flows || data.users || data.runs || data.rows);
                        
                        if (Array.isArray(listData)) {
                            return <SupportTable key={index} data={listData} title={data.explanation || data.message} />;
                        } else if (data && typeof data === 'object') {
                            // Check if this object contains any array (e.g., { "agents": [...] })
                            const nestedArrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
                            if (nestedArrayKey) {
                                return <SupportTable key={index} data={data[nestedArrayKey]} title={data.explanation || data.message || nestedArrayKey} />;
                            }
                            return <SupportDetails key={index} data={data} />;
                        }
                    } catch (e) {
                        // Not valid JSON, continue to normal text rendering
                    }
                }
            }

            const renderBoldText = (text: string) => {
                const parts = text.split(/(\*\*.*?\*\*)/g);
                return parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold text-slate-900 dark:text-white/90">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });
            };

            const renderFormattedLine = (line: string, i: number) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={`${index}-${i}`} className="h-1" />;

                // Header ###
                if (trimmed.startsWith('###')) {
                    return (
                        <h3 key={`${index}-${i}`} className="text-[11px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mt-6 mb-3 first:mt-0">
                            {trimmed.replace(/^###\s*/, '')}
                        </h3>
                    );
                }

                // Title Line: **Text** (stand-alone title)
                if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
                    return (
                        <h4 key={`${index}-${i}`} className="text-[14px] font-bold text-slate-800 dark:text-white mt-4 mb-2 first:mt-0 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {trimmed.replace(/\*\*/g, '')}
                        </h4>
                    );
                }

                // List Item: - **Key**: Value or - Text
                if (trimmed.startsWith('- ')) {
                    const content = trimmed.replace(/^- /, '');
                    return (
                        <div key={`${index}-${i}`} className="flex gap-3 mb-1.5 last:mb-0 ml-6">
                            <div className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-white/10" />
                            <div className="text-[13.5px] text-slate-600 dark:text-white/70 leading-relaxed">
                                {renderBoldText(content)}
                            </div>
                        </div>
                    );
                }

                // Numbered Item: 1. **Text**
                if (/^\d+\.\s/.test(trimmed)) {
                    const content = trimmed.replace(/^\d+\.\s/, '');
                    const number = trimmed.match(/^\d+/)?.[0];
                    return (
                        <div key={`${index}-${i}`} className="flex gap-3 mt-6 mb-2 first:mt-0">
                            <span className="text-[12px] font-black text-primary/60 mt-0.5 w-4">{number}.</span>
                            <span className="text-[14px] font-bold text-slate-800 dark:text-white">
                                {renderBoldText(content)}
                            </span>
                        </div>
                    );
                }

                // Default paragraph with bolding
                return (
                    <p key={`${index}-${i}`} className="mb-2 last:mb-0 text-[13.5px] text-slate-600 dark:text-white/70 leading-relaxed">
                        {renderBoldText(line)}
                    </p>
                );
            };

            return part.split('\n').map((line, i) => renderFormattedLine(line, i));
        });
    };

    return (
        <div 
            className={`relative group transition-all duration-300 ${highlighted ? 'scale-[1.01]' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Status indicators */}
            {role === 'user' && message.status && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                    {message.status === 'sending' && (
                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    )}
                    {message.status === 'sent' && (
                        <Check className="h-3 w-3 text-primary" />
                    )}
                    {message.status === 'error' && (
                        <X className="h-3 w-3 text-red-500" />  
                    )}
                </div>
            )}

            {/* Bubble with gradient effect */}
            <div className={`relative px-5 py-3 rounded-xl text-sm leading-relaxed backdrop-blur-sm 
                transition-all duration-300 w-fit max-w-full ${isTyping ? 'animate-pulse-once' : ''}
                ${role === 'user' 
                    ? 'dark:bg-linear-to-br dark:from-primary/20 dark:via-primary/10 dark:to-transparent text-foreground dark:text-white border border-primary/30'
                    : 'dark:bg-linear-to-br dark:from-[#111111]/90 dark:via-[#0a0a0a]/90 dark:to-transparent text-foreground dark:text-white/90 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none'
                }
                ${highlighted ? role === 'user' ? 'border-primary/50' : 'border-primary/30 dark:border-white/30' : ''}
            `}>
                {/* Glow effect on hover */}
                {highlighted && role === 'assistant' && (
                    <div className="absolute inset-0 rounded-xl bg-primary/5 dark:bg-linear-to-r dark:from-primary/5 dark:to-transparent -z-10" />
                )}
                
                {/* Assistant message decoration */}
                {role === 'assistant' && !isTyping && (
                    <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-primary/50" />
                )}
                
                {/* Content */}
                <div className="relative z-10 w-full overflow-hidden overflow-x-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
