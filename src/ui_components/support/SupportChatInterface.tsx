import { useState, useEffect, useRef } from 'react';
import { AI_URL } from '../../ui_components/api/apiurl';
import { SupportHeader } from './components/SupportHeader';
import { SupportBody } from './components/SupportBody';
import { SupportInput } from './components/SupportInput';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    id: string;
    status?: 'sending' | 'sent' | 'error' | 'thinking';
    feedback?: 'helpful' | 'not-helpful';
    metadata?: {
        toolCalls?: any[];
        toolResults?: any[];
        currentTool?: string;
    };
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: Date;
    isPinned?: boolean;
    tags?: string[];
    preview: string;
} 

interface SupportChatInterfaceProps {
    userId: string;
    userName?: string;
    conversationId: string | null;
    onToggleHistory: () => void;
    onConversationIdChange?: (id: string) => void;
}

export function SupportChatInterface({ userId, userName = 'Guest', conversationId, onToggleHistory, onConversationIdChange }: SupportChatInterfaceProps) {
    const [currentSession, setCurrentSession] = useState<ChatSession>({
        id: 'current',
        title: 'New Conversation',
        messages: [],
        timestamp: new Date(),
        preview: 'Start a new conversation',
        tags: ['current']
    });
    
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(20);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load messages when conversationId changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (!conversationId) {
                setCurrentSession({
                    id: 'current',
                    title: 'New Conversation',
                    messages: [],
                    timestamp: new Date(),
                    preview: 'Start a new conversation',
                    tags: ['current']
                });
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`${AI_URL}/api/memory/conversations/${conversationId}?userId=${userId}`);
                const data = await response.json();
                if (data.messages) {
                    const messages = data.messages.map((m: any, idx: number) => ({
                        id: `msg_${idx}_${Date.now()}`,
                        role: m.role,
                        content: typeof m.parts === 'string' ? m.parts : (m.parts[0]?.text || ''),
                        timestamp: new Date(m.created_at)
                    }));
                    
                    setCurrentSession({
                        id: conversationId,
                        title: data.title || 'Conversation',
                        messages: messages,
                        timestamp: new Date(data.updated_at || Date.now()),
                        preview: messages[messages.length - 1]?.content || 'Empty'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [conversationId, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSession.messages]);

    const handleSendMessage = async (overrideInput?: string) => {
        const userMessage = overrideInput || input.trim();
        if (!userMessage || loading) return;
        if (!conversationId) {
            alert('Please select or create a conversation first.');
            return;
        }

        setInput('');
        const userMessageObj: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
            status: 'sending'
        };

        const updatedMessages = [...currentSession.messages, userMessageObj];
        setCurrentSession(prev => ({
            ...prev,
            messages: updatedMessages,
            timestamp: new Date()
        }));
        
        setLoading(true);

        try {
            const response = await fetch(`http://localhost:4000/agents/ce1c84e6-55c1-49dc-989d-3aae6e873ed7/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({
                    input: userMessage,
                    options: {
                        userId: userId,
                        conversationId: conversationId,
                        uiMode: "chat",
                        stream: true,
                        context: {
                            sessionId: conversationId,
                            previousMessages: currentSession.messages
                                .filter(m => m.role === 'user')
                                .map(m => m.content)
                                .slice(-5)
                        },
                        temperature: 0.7,
                        maxOutputTokens: 4000
                    }
                })
            });

            if (!response.body) throw new Error('No response body');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';
            
            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessage: Message = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };

            setCurrentSession(prev => ({
                ...prev,
                messages: [...updatedMessages, assistantMessage]
            }));

            setIsTyping(true);

            let hasOpenedThink = false;
            let currentToolName = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine.startsWith('data: ')) continue;
                    
                    try {
                        const jsonStr = trimmedLine.slice(6);
                        if (jsonStr === '[DONE]') break;
                        
                        const event = JSON.parse(jsonStr);
                        console.log("📡 [SSE] Event:", event);
                        
                        if (event.conversationId && event.conversationId !== conversationId && onConversationIdChange) {
                            onConversationIdChange(event.conversationId);
                        }
                        
                        if (event.done) break;

                        let metadataUpdate: any = {};
                        if (event.toolCall || event.type === 'toolCall' || event.tool_call) {
                            const toolCall = event.toolCall || event.tool_call || event;
                            currentToolName = toolCall.toolName || toolCall.name;
                            console.log("🛠️ [SSE] Tool Call:", currentToolName);
                            metadataUpdate = {
                                currentTool: currentToolName,
                                toolCalls: [toolCall]
                            };
                        } else if (event.toolResult || event.type === 'toolResult' || event.tool_result) {
                            const toolResult = event.toolResult || event.tool_result || event;
                            currentToolName = '';
                            console.log("🛠️ [SSE] Tool Result:", toolResult);
                            metadataUpdate = {
                                currentTool: '',
                                toolResults: [toolResult]
                            };
                            
                            // 🛡️ Fallback: If the tool result is JSON data, append it to content!
                            try {
                                const resultStr = typeof toolResult.result === 'string' ? toolResult.result : JSON.stringify(toolResult.result);
                                if (resultStr.includes('"type": "data"') || resultStr.includes('"type":"data"')) {
                                     console.log("🛡️ [SSE] Fallback Triggered! Appending JSON data.");
                                     if (!assistantContent.includes(resultStr.substring(0, 20))) {
                                          const cleanResult = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
                                          assistantContent += `\n\`\`\`json\n${cleanResult}\n\`\`\`\n`;
                                     }
                                }
                            } catch(e) {}
                        }

                        // Determine content delta
                        const delta = event.text || 
                                     event.content || 
                                     event.textDelta || 
                                     event.text_delta || 
                                     event.reasoning || 
                                     (event.delta && (event.delta.content || event.delta.text_delta || event.delta.text || event.delta.reasoning));

                        if (delta && typeof delta === 'string') {
                            const isExplicitReasoning = !!event.reasoning || !!(event.delta && event.delta.reasoning);
                            
                            if (isExplicitReasoning && !hasOpenedThink) {
                                assistantContent += '<think>\n';
                                hasOpenedThink = true;
                            }
                            
                            assistantContent += delta;
                            
                            if (hasOpenedThink && !isExplicitReasoning && (delta.includes('```') || delta.includes('{'))) {
                                assistantContent += '\n</think>\n';
                                hasOpenedThink = false;
                            }
                        }

                        // Update State per Event
                        setCurrentSession(prev => ({
                            ...prev,
                            messages: prev.messages.map(msg =>
                                msg.id === assistantMessageId
                                    ? {
                                        ...msg,
                                        content: assistantContent,
                                        status: currentToolName ? 'thinking' : msg.status,
                                        metadata: {
                                            ...msg.metadata,
                                            ...metadataUpdate
                                        }
                                      }
                                    : msg
                            )
                        }));

                    } catch (e) {
                        console.warn("Failed to parse SSE line:", line, e);
                    }
                }
            }
            
            if (hasOpenedThink) assistantContent += '</think>';
            
            setCurrentSession(prev => ({
                ...prev,
                messages: prev.messages.map(msg => 
                    msg.id === assistantMessageId 
                        ? { ...msg, content: assistantContent, status: 'sent' }
                        : msg
                )
            }));

            setIsTyping(false);
            
            setCurrentSession(prev => ({
                ...prev,
                messages: prev.messages.map(msg => 
                    msg.id === userMessageObj.id 
                        ? { ...msg, status: 'sent' }
                        : msg
                )
            }));

            // Save pair to backend
            fetch(`${AI_URL}/api/memory/save-messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    conversationId: conversationId,
                    messages: [
                        { role: 'user', content: userMessage },
                        { role: 'assistant', content: assistantContent }
                    ]
                })
            }).catch(e => console.error(e));

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: '❌ Failed to connect to assistant.',
                timestamp: new Date()
            };
            setCurrentSession(prev => ({
                ...prev,
                messages: [...prev.messages, errorMessage]
            }));
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    const suggestions = [
        { title: 'Workflow Analytics', badge: 'Automation', desc: 'List all automation flows and get status summaries.', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: '📊' },
        { title: 'Agent Configurator', badge: 'AI Agents', desc: 'Show and manage my configured AI assistants in real-time.', color: 'bg-primary/10 text-primary border-primary/20', icon: '🤖', popular: true },
        { title: 'Execution Logs', badge: 'Recent', desc: 'Review the latest flow executions and performance metrics.', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '⏱️' },
        { title: 'User Roles', badge: 'Security', desc: 'Manage user permissions and access control for my workflows.', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: '👥' },
    ];

    return (
        <div className="flex flex-col h-full w-full mx-auto bg-[#f8f9fa] dark:bg-[#050505] text-foreground relative font-inter border-l border-border/50 dark:border-white/5">
            <SupportHeader 
                messageCount={currentSession.messages.length}
                isTyping={isTyping}
                typingSpeed={typingSpeed}
                onTypingSpeedChange={setTypingSpeed}
                currentSessionTitle={currentSession.title}
                onToggleHistory={onToggleHistory}
                onSaveSession={() => {}}
            />
            
            <div className="flex-1 w-full min-h-0 relative flex flex-col overflow-hidden">
                <SupportBody 
                    messages={currentSession.messages}
                    userName={userName}
                    loading={loading}
                    isTyping={isTyping}
                    scrollAreaRef={scrollAreaRef}
                    messagesEndRef={messagesEndRef}
                />
            </div>

            <SupportInput 
                input={input}
                setInput={setInput}
                onSendMessage={() => handleSendMessage()}
                loading={loading || isTyping}
                suggestions={suggestions}
            />
        </div>
    );
}
