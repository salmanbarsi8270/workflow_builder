import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Paperclip } from "lucide-react";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface DynamicChatInterfaceProps {
    agent: any;
}

export function DynamicChatInterface({ agent }: DynamicChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Extract UI design from agent (could be from ui_designs table join)
    const themeColor = agent.theme_color || '#4dabf7';
    const title = agent.title || agent.name || 'Chat Assistant';
    const subtitle = agent.subtitle || 'We\'re here to help!';
    const welcomeMessage = agent.welcome_message || '👋 Hello! How can I help you today?';
    const inputPlaceholder = agent.input_placeholder || 'Type your message...';
    const fontFamily = agent.font_family || 'Inter, sans-serif';
    const showHeader = agent.show_header !== false;
    const showAgentAvatar = agent.show_agent_avatar !== false;
    const allowFileUploads = agent.allow_file_uploads === true;

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Add welcome message on mount
        if (welcomeMessage) {
            setMessages([{ role: 'assistant', content: welcomeMessage }]);
        }
    }, [welcomeMessage]);

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('📤 [PublicChat] Uploading file:', file.name);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', agent.user_id || 'public-user');

            const response = await fetch(`/api/v1/agents/${agent.id}/public-upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            console.log('✅ [PublicChat] Upload success:', data);

            // Add a temporary system message to indicate upload success
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `📎 File uploaded: **${file.name}**. I'll keep this in mind during our conversation.`
            }]);

        } catch (error: any) {
            console.error('❌ [PublicChat] Upload error:', error);
            alert(`Failed to upload file: ${error.message}`);
        } finally {
            setLoading(false);
            // Reset input so the same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch(`/api/v1/agents/${agent.id}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: userMessage,
                    userId: agent.user_id || 'public-user', // Use owner ID if available (as requested)
                    stream: false
                })
            });

            const data = await response.json();

            // Prioritize showing actual backend errors if present
            if (data.error || data.details) {
                const errorMessage = data.details || data.error;
                setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${errorMessage}` }]);
                return;
            }

            const assistantMessage = data.output || 'Sorry, I couldn\'t process that request (No output received).';

            setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div
            className="h-screen flex flex-col"
            style={{ fontFamily }}
        >
            {/* Header */}
            {showHeader && (
                <div
                    className="p-6 text-white shadow-lg"
                    style={{
                        background: `linear-gradient(135deg, ${themeColor} 0%, ${adjustColor(themeColor, -20)} 100%)`
                    }}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                            <Bot className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{title}</h1>
                            <p className="text-white/90 text-sm">{subtitle}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.role === 'assistant' && (
                            <>
                                {showAgentAvatar ? (
                                    <div
                                        className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white"
                                        style={{ backgroundColor: themeColor }}
                                    >
                                        <Bot className="h-5 w-5" />
                                    </div>
                                ) : (
                                    <div className="w-0" />
                                )}
                            </>
                        )}
                        <div
                            className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${message.role === 'user'
                                ? 'text-white'
                                : 'bg-white text-slate-800'
                                }`}
                            style={message.role === 'user' ? { backgroundColor: themeColor } : {}}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                            <div
                                className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: themeColor }}
                            >
                                <User className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 justify-start">
                        {showAgentAvatar && (
                            <div
                                className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: themeColor }}
                            >
                                <Bot className="h-5 w-5" />
                            </div>
                        )}
                        <div className="bg-white px-4 py-3 rounded-2xl shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200 shadow-lg">
                <div className="flex gap-2 max-w-4xl mx-auto items-center">
                    {allowFileUploads && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleFileClick}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                        </>
                    )}
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={inputPlaceholder}
                        className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 border-slate-200"
                        disabled={loading}
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        style={{ backgroundColor: themeColor }}
                        className="text-white hover:opacity-90 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
