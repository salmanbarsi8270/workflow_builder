import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { SupportTable } from './SupportTable';
import { SupportForm } from './SupportForm';
import { SupportDetails } from './SupportDetails';
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { SupportMessageCard } from './SupportMessageCard';

interface MessageBubbleProps {
    message: {
        content: string;
        role: 'user' | 'assistant';
        status?: 'sending' | 'sent' | 'error' | 'thinking';
        metadata?: {
            currentTool?: string;
            toolCalls?: any[];
            toolResults?: any[];
        };
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

    // User requested "only result.text" and "did not send ui" otherwise.
    // We strictly hide the bubble if there is no content yet, UNLESS it's thinking.
    if (role === 'assistant' && !message.content && message.status !== 'thinking') {
        return null;
    }

    const renderContent = () => {
        if ((isTyping || message.status === 'thinking') && role === 'assistant' && !message.content) {
            // User requested "only result.text to show". Hiding "Thinking..." labels.
            return (
                <div className="flex items-center gap-2 py-1">
                    <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            );
        }

        // Identify reasoning/thought sections (e.g., <think>...</think>)
        let processedContent = message.content;
        
        // Handle unclosed <think> tag during streaming (DeepSeek/Thinking models)
        if (processedContent.includes('<think>') && !processedContent.toLowerCase().includes('</think>')) {
            processedContent = processedContent.replace(/<think>/gi, ':::thought\n');
            processedContent += '\n:::';
        }

        const thoughtRegex = /<think>([\s\S]*?)<\/think>/gi;
        processedContent = processedContent.replace(thoughtRegex, (_, thought) => {
            return `:::thought\n${thought}\n:::`;
        });

        // Use more sophisticated split to handle partial blocks and thought sections
        const parts: string[] = [];
        let lastIndex = 0;
        const blockRegex = /(```(?:json)?[\s\S]*?(?:```|$))|(:::thought[\s\S]*?(?::::|$))/g;
        let match;

        while ((match = blockRegex.exec(processedContent)) !== null) {
            if (match.index > lastIndex) {
                parts.push(processedContent.substring(lastIndex, match.index));
            }
            parts.push(match[0]);
            lastIndex = blockRegex.lastIndex;
        }
        if (lastIndex < processedContent.length) {
            parts.push(processedContent.substring(lastIndex));
        }


        const parsedNodes: { type: 'thought' | 'data' | 'text'; content: React.ReactNode; isSuccessCard?: boolean }[] = [];
        
        // Helper function for text formatting (hoisted)
        const renderFormattedLine = (line: string, i: number, partIndex: number) => {
            const index = partIndex; // Closure for key generation
            const trimmed = line.trim();
            if (!trimmed) return <div key={`${index}-${i}`} className="h-1" />;

            const renderBoldText = (text: string) => {
                const parts = text.split(/(\*\*.*?\*\*)/g);
                return parts.map((p, j) => {
                    if (p.startsWith('**') && p.endsWith('**')) {
                        return <strong key={j} className="font-bold text-slate-900 dark:text-white/90">{p.slice(2, -2)}</strong>;
                    }
                    return p;
                });
            };

            if (trimmed.startsWith('###')) {
                return <h3 key={`${index}-${i}`} className="text-[11px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mt-6 mb-3 first:mt-0">{trimmed.replace(/^###\s*/, '')}</h3>;
            }
            if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
                return <h4 key={`${index}-${i}`} className="text-[14px] font-bold text-slate-800 dark:text-white mt-4 mb-2 first:mt-0 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{trimmed.replace(/\*\*/g, '')}</h4>;
            }
            if (trimmed.startsWith('- ')) {
                return <div key={`${index}-${i}`} className="flex gap-3 mb-1.5 last:mb-0 ml-6"><div className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-white/10" /><div className="text-[13.5px] text-slate-600 dark:text-white/70 leading-relaxed">{renderBoldText(trimmed.replace(/^- /, ''))}</div></div>;
            }
            if (/^\d+\.\s/.test(trimmed)) {
                const numberStr = trimmed.match(/^\d+/)?.[0];
                return <div key={`${index}-${i}`} className="flex gap-3 mt-6 mb-2 first:mt-0"><span className="text-[12px] font-black text-primary/60 mt-0.5 w-4">{numberStr}.</span><span className="text-[14px] font-bold text-slate-800 dark:text-white">{renderBoldText(trimmed.replace(/^\d+\.\s/, ''))}</span></div>;
            }
            return <p key={`${index}-${i}`} className="mb-2 last:mb-0 text-[13.5px] text-slate-600 dark:text-white/70 leading-relaxed">{renderBoldText(line)}</p>;
        };

        const metaTalkPatterns = [
             /^the user says/i,
             /^we need to respond/i,
             /^we have executed/i,
             /^now the user has asked/i,
             /^based on the policy/i,
             /^thus, if/i,
             /^one nuance/i,
             /^the output policy/i,
             /^we need to consider/i,
             /^this presumably/i,
             /^thus final output/i,
             /^internal thinking/i,
             /^role:/i,
             /^mandatory final json/i,
             /^summary:/i,
             /^thinking:/i,
             /^text response:/i,
             /^\[agent:result\]/i,
             /^📊 \[agent:result\]/i
        ];

        // Process each part
        parts.forEach((part, index) => {
            // 1. Thought Sections
            if (part.startsWith(':::thought')) {
                const thought = part.replace(/:::thought/g, '').replace(/:::/g, '').trim();
                parsedNodes.push({
                    type: 'thought',
                    content: <Reasoning key={`thought-${index}`} isStreaming={isTyping}><ReasoningTrigger /><ReasoningContent>{thought}</ReasoningContent></Reasoning>
                });
                return;
            }

            // 2. Code/Data Blocks
            if (part.startsWith('```')) {
                const isComplete = part.endsWith('```');
                const jsonStr = part.replace(/```(?:json)?/g, '').trim();
                
                if (isComplete) {
                    try {
                        const data = JSON.parse(jsonStr);
                        
                        // NEW: Check for Success Card Pattern (Strict Structure)
                        // It must have 'success' boolean and optional 'users' array, or 'type'='conversation'
                        if (
                            (typeof data.success === 'boolean') && 
                            (data.users || data.message || data.type === 'conversation' || data.error)
                        ) {
                             parsedNodes.push({ 
                                 type: 'data', 
                                 isSuccessCard: true,
                                 content: <SupportMessageCard key={index} data={data} timestamp={new Date()} /> 
                             });
                             return;
                        }

                        // Helper to traverse and find arrays
                        const findArray = (obj: any, depth = 0): any[] | null => {
                            if (!obj || typeof obj !== 'object' || depth > 3) return null;
                            if (Array.isArray(obj)) return obj;
                            const keys = ['data', 'result', 'agents', 'flows', 'users', 'runs', 'rows', 'output', 'items', 'templates'];
                            for (const key of keys) if (obj[key] && Array.isArray(obj[key])) return obj[key];
                            for (const k of Object.keys(obj)) if (obj[k] && typeof obj[k] === 'object') { const f = findArray(obj[k], depth + 1); if (f) return f; }
                            return null;
                        };

                        let finalData = data;
                        if (data?.output && typeof data.output === 'string') { try { finalData = JSON.parse(data.output); } catch(e){} }
                        
                        // Determine Format
                        if (finalData?.type === 'form') {
                             parsedNodes.push({ type: 'data', content: <SupportForm key={index} data={finalData} /> });
                             return;
                        }
                        
                        const listData = findArray(finalData);
                        if (listData) {
                            parsedNodes.push({ type: 'data', content: <SupportTable key={index} data={listData} title={finalData.explanation || finalData.message || "Data Results"} /> });
                            return;
                        }
                        
                        if (finalData && typeof finalData === 'object') {
                            parsedNodes.push({ type: 'data', content: <SupportDetails key={index} data={finalData} /> });
                            return;
                        }
                    } catch (e) { /* ignore parse error */ }
                }
                
                // Fallback: Render as Code Block (Text)
                parsedNodes.push({
                    type: 'text',
                    content: <pre key={index} className="my-2 p-3 rounded-lg bg-slate-100 dark:bg-white/5 overflow-x-auto text-[11px] font-mono"><code>{jsonStr}</code></pre>
                });
                return;
            }

            // 3. Text Content
            const isMetaTalk = metaTalkPatterns.some(pattern => pattern.test(part.trim()));
            if (!isMetaTalk) {
                // Check if this part is actually just raw JSON that we will render later
                let isJsonData = false;
                try {
                    const trimmed = part.trim();
                    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                        JSON.parse(trimmed);
                        isJsonData = true; 
                    }
                } catch (e) {}

                if (!isJsonData) {
                    parsedNodes.push({
                        type: 'text',
                        content: <div key={index}>{part.split('\n').map((line, i) => renderFormattedLine(line, i, index))}</div>
                    });
                }
            }
        });

        // 4. Robust Fallback for Missing Backticks or Dirty JSON (e.g. "• {"name":...}")
        if (parsedNodes.filter(n => n.type === 'data').length === 0 && !message.content.includes('```')) {
             try {
                 // Remove thoughts first
                 let cleanContent = message.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                 
                 // Remove confusing prefixes like bullets, excessive newlines
                 cleanContent = cleanContent.replace(/^[\s\n]*[•\-\*]+[\s\n]*/, '').trim();

                 const firstBrace = cleanContent.indexOf('{');
                 const firstBracket = cleanContent.indexOf('[');
                 
                 // Determine where JSON *might* start
                 let start = -1;
                 if (firstBrace !== -1 && firstBracket !== -1) {
                     start = Math.min(firstBrace, firstBracket);
                 } else if (firstBrace !== -1) {
                     start = firstBrace;
                 } else {
                     start = firstBracket;
                 }

                 if (start !== -1) {
                     const lastBrace = cleanContent.lastIndexOf('}');
                     const lastBracket = cleanContent.lastIndexOf(']');
                     const end = Math.max(lastBrace, lastBracket);
                     
                     if (end > start) {
                         const jsonStr = cleanContent.substring(start, end + 1);
                         const data = JSON.parse(jsonStr);
                         
                         // Check for Success Card Pattern (Fallback)
                         if (
                            (typeof data.success === 'boolean') && 
                            (data.users || data.message || data.type === 'conversation' || data.error)
                         ) {
                             parsedNodes.push({ 
                                 type: 'data', 
                                 isSuccessCard: true,
                                 content: <SupportMessageCard key="fallback-success" data={data} timestamp={new Date()} /> 
                             });
                         } 
                         else if (Array.isArray(data) || (data && typeof data === 'object')) {
                             // It's valid JSON data. Since we are in robust fallback, we assume this is THE data.
                             // We will construct a data node. Logic simplified for brevity, assuming SupportDetails/Table can handle it.
                             const isList = Array.isArray(data) || (data.data && Array.isArray(data.data));
                             parsedNodes.push({ 
                                 type: 'data', 
                                 content: isList ? <SupportTable key="fallback" data={Array.isArray(data) ? data : data.data} /> : <SupportDetails key="fallback" data={data} />
                             });
                         }
                     }
                 }
             } catch (e) {}
        }
        
        // --- FINAL RENDERING DECISION ---
        // 0. Check for Strict "Success/Error Card" Pattern (User Management Pattern)
        const successCardNode = parsedNodes.find(n => n.type === 'data' && n.isSuccessCard);
        if (successCardNode) {
            // If we found a success card structure, we prioritize it. 
            // We might still want to show "thought" nodes before it if they exist.
            const otherNodes = parsedNodes.filter(n => n.type !== 'data' && n.type !== 'text'); // Keep thoughts
            return [
                ...otherNodes.map(n => n.content),
                successCardNode.content
            ];
        }

        // Return all nodes in order (Thoughts, Text, Data).
        // This allows "Here is the list:" + Table to co-exist, while metaTalkPatterns filters out garbage.
        return parsedNodes.map(n => n.content);
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
            <Message 
                role={role} 
                isTyping={isTyping}
                className={highlighted ? (role === 'user' ? 'border-primary/50' : 'border-primary/30 dark:border-white/30') : ''}
            >
                {/* Glow effect on hover */}
                {highlighted && role === 'assistant' && (
                    <div className="absolute inset-0 rounded-xl bg-primary/5 dark:bg-linear-to-r dark:from-primary/5 dark:to-transparent -z-10" />
                )}
                
                {/* Content */}
                <MessageContent>
                    {renderContent()}
                </MessageContent>
            </Message>
        </div>
    );
};
