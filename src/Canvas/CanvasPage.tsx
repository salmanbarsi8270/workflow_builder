import { useRef, useState, useEffect } from "react";
import {
    PanelLeftClose, PanelLeftOpen,
    Loader2, Settings,
    Menu,
    MessageSquare
} from "lucide-react";
import type { UIComponent } from "./generative_ui/types";
import { parseSSEChunk } from "../lib/sse-parser";
import { applyAutoGridFlow } from "./generative_ui/auto-grid-engine";
import { AgentConnectionDialog } from "../ui_components/Agents/AgentConnectionDialog";
import { Button } from "@/components/ui/button";
import {
    TooltipProvider,
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { useUser } from "../context/UserContext";
import { AI_URL, API_URL } from "../ui_components/api/apiurl";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";


// Imported Components
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import { InputArea } from "./components/InputArea";
import { CanvasArea } from "./components/CanvasArea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/sidebar";

interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    componentJson?: string;
}

const initialSchema: UIComponent = {
    type: 'container',
    props: {
        className: 'w-full h-full',
        layout: 'grid',
        cols: 4,
        gap: 4,
        dir: 'rtl'
    },
    children: []
};

// Responsive grid column calculation based on sidebar visibility and screen size
const getAdaptiveCols = (
    leftSidebarOpen: boolean,
    rightSidebarOpen: boolean,
    isMobile: boolean
): number => {
    if (isMobile) return 1;
    const openCount = (leftSidebarOpen ? 1 : 0) + (rightSidebarOpen ? 1 : 0);
    if (openCount === 2) return 1;
    if (openCount === 1) return 3;
    return 4;
};

const getAdaptiveColSpan = (
    _leftSidebarOpen: boolean,
    _rightSidebarOpen: boolean,
    isMobile: boolean
): string => {
    if (isMobile) {
        return 'col-span-1';
    }
    // With dynamic grid-cols (4, 2, or 1), a span of 1 always takes the correct proportion
    return 'col-span-1';
};

// Mobile sidebar detection
const useMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

const transformComponentData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
        const transformedChildren = data.map(transformComponentData);
        return {
            type: 'container',
            props: { layout: 'grid', cols: 4 },
            children: transformedChildren
        };
    }

    let transformed: any = { props: {} };
    let sourceData = data;

    const componentTypes = [
        'container', 'text', 'button', 'card', 'card-header', 'card-content',
        'card-footer', 'input', 'icon', 'grid', 'stack', 'metric', 'avatar',
        'badge', 'table', 'table-header', 'table-row', 'table-head', 'table-body',
        'table-cell', 'chart', 'chart-placeholder', 'streaming-text', 'error-state',
        'section', 'status-badge', 'stat-card', 'thinking-block', 'div'
    ];

    const keys = Object.keys(data);
    const explicitType = data.type || data.component;

    if (explicitType && typeof explicitType === 'string' && componentTypes.includes(explicitType)) {
        transformed.type = explicitType;
        sourceData = data;
    } else if (keys.length === 1 && componentTypes.includes(keys[0])) {
        transformed.type = keys[0];
        sourceData = data[keys[0]];
    } else if (keys.length === 1 && typeof data[keys[0]] === 'object' && (data[keys[0]].type || data[keys[0]].component)) {
        return transformComponentData(data[keys[0]]);
    } else {
        const inferredType = (keys.length === 1 && componentTypes.includes(keys[0])) ? keys[0] : 'container';
        transformed.type = explicitType || inferredType;
        sourceData = (keys.length === 1 && !explicitType && inferredType !== 'container') ? data[keys[0]] : data;
    }

    // Process props and other attributes
    if (typeof sourceData === 'object' && sourceData !== null) {
        if (sourceData.props && typeof sourceData.props === 'object') {
            transformed.props = { ...transformed.props, ...sourceData.props };
        }

        Object.keys(sourceData).forEach(key => {
            if (!['type', 'component', 'children', 'content', 'props', 'items', 'rows', 'data'].includes(key)) {
                transformed.props[key] = sourceData[key];
            }
        });

        const childrenSource = sourceData.children || sourceData.content || sourceData.items || sourceData.rows || sourceData.data;

        if (childrenSource !== undefined) {
            if (Array.isArray(childrenSource)) {
                transformed.children = childrenSource.map(transformComponentData);
            } else if (typeof childrenSource === 'object' && childrenSource !== null) {
                if (childrenSource.type || childrenSource.component || (Object.keys(childrenSource).length === 1 && componentTypes.includes(Object.keys(childrenSource)[0]))) {
                    transformed.children = [transformComponentData(childrenSource)];
                } else {
                    transformed.children = childrenSource;
                }
            } else {
                transformed.children = childrenSource;
            }
        }
    } else {
        transformed.children = sourceData;
    }

    return transformed;
};

export default function CanvasPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const [uiSchema, setUiSchema] = useState<UIComponent>(initialSchema);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [convasationloading, setConvasationloading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dialog and loading states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
    const [isClearingHistory, setIsClearingHistory] = useState(false);
    const [isLoadingConv, setIsLoadingConv] = useState(false);

    const [isLeftOpen, setIsLeftOpen] = useState(false);
    const [isRightOpen, setIsRightOpen] = useState(false);

    // Agent Config State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [configAgent, setConfigAgent] = useState<any>(null);

    const handleOpenConfig = async () => {
        // Hardcoded agent ID from processAIResponse for context
        const agentId = 'dcf594b0-148c-47e3-95a7-78c09b339740';
        try {
            const res = await fetch(`${API_URL}/api/v1/agents/${agentId}?userId=${userId}`);
            if (res.ok) {
                const agent = await res.json();
                setConfigAgent(agent);
                setIsConfigOpen(true);
            }
        } catch (e) {
            console.error("Failed to load agent for config", e);
        }
    };

    const isMobile = useMobile();
    const userId = user?.id || localStorage.getItem('userId') || 'guest';

    useEffect(() => {
        if (isMobile) {
            setIsLeftOpen(false);
            setIsRightOpen(false);
        }
    }, [isMobile]);

    // Update grid columns when sidebars toggle
    useEffect(() => {
        const cols = getAdaptiveCols(isLeftOpen, isRightOpen, isMobile);
        if (uiSchema.props?.cols !== cols) {
            setUiSchema(prev => ({
                ...prev,
                props: {
                    ...prev.props,
                    cols
                }
            }));
        }
    }, [isLeftOpen, isRightOpen, isMobile, uiSchema.props?.cols]);

    const fetchConversations = async () => {
        try {
            setConvasationloading(true);
            const response = await fetch(`${AI_URL}/api/memory/conversations?userId=${userId}&limit=50&offset=0`);
            const data = await response.json();
            if (data.conversations) setConversations(data.conversations);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            toast({
                title: "Error",
                description: "Failed to load conversations",
                variant: "destructive",
            });
        }
        finally {
            setConvasationloading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchConversations();
    }, [userId]);

    const handleNewChat = async () => {
        setCreateDialogOpen(true);
        setNewChatName(`Project ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`);
    };

    const confirmCreateChat = async (customTitle?: string) => {
        const title = customTitle || newChatName.trim() || `Project ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
        setIsCreating(true);

        try {
            const response = await fetch(`${AI_URL}/api/memory/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    title,
                    metadata: {
                        type: 'canvas',
                        agentId: 'assistant'
                    },
                    resourceId: 'assistant'
                })
            });
            const data = await response.json();
            const newId = data.id || data.conversation?.id;
            if (newId) {
                setCurrentConversationId(newId);
                setUiSchema(initialSchema);

                // Only send welcome message if manually created through dialog
                if (!customTitle) {
                    setMessages([{
                        id: '1',
                        role: 'assistant',
                        content: `Welcome to "${title}"! I'm ready to help you build amazing UIs.`,
                        timestamp: new Date()
                    }]);
                    toast({
                        title: "Project created",
                        description: `"${title}" has been created successfully`,
                    });
                }

                fetchConversations();
                setCreateDialogOpen(false);
                setNewChatName("");
                return newId;
            }
        } catch (error) {
            console.error('Failed to create chat:', error);
            toast({
                title: "Error",
                description: "Failed to create project",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
            if (!customTitle) {
                setIsRightOpen(true);
                setIsLeftOpen(false);
            }
        }
        return null;
    };

    const handleDeleteConversation = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
        setDeletingConvId(id);
        try {
            await fetch(`${AI_URL}/api/memory/conversations/${id}?userId=${userId}`, { method: 'DELETE' });
            fetchConversations();
            if (currentConversationId === id) {
                setCurrentConversationId(null);
                setMessages([]);
                setUiSchema(initialSchema);
            }
            toast({
                title: "Project deleted",
                description: `"${title}" has been deleted`,
            });
        } catch (error) {
            console.error('Failed to delete chat:', error);
            toast({
                title: "Error",
                description: "Failed to delete project",
                variant: "destructive",
            });
        } finally {
            setDeletingConvId(null);
            setIsRightOpen(false);
            setIsLeftOpen(false);
        }
    };

    const handleClearAllHistory = async () => {
        setIsClearingHistory(true);
        try {
            const response = await fetch(`${AI_URL}/api/memory/user/clear?userId=${userId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                setConversations([]);
                setCurrentConversationId(null);
                setMessages([]);
                setUiSchema(initialSchema);
                toast({
                    title: "History Cleared",
                    description: "All projects and messages have been permanently deleted.",
                });
            } else {
                throw new Error(data.error || "Failed to clear history");
            }
        } catch (error: any) {
            console.error('Failed to clear history:', error);
            toast({
                title: "Error",
                description: "Failed to delete history: " + error.message,
                variant: "destructive",
            });
        } finally {
            setIsClearingHistory(false);
            setIsRightOpen(false);
            setIsLeftOpen(false);
        }
    };

    const handleLoadConversation = async (conv: any) => {
        setIsLoadingConv(true);
        setCurrentConversationId(conv.conversation_id);
        try {
            const response = await fetch(`${AI_URL}/api/memory/conversations/${conv.conversation_id}?userId=${userId}`);
            const data = await response.json();
            if (data.messages) {
                const loadedMessages = data.messages.map((m: any) => {
                    let componentJson = m.metadata?.componentJson || null;
                    const content = typeof m.parts === 'string' ? m.parts : (m.parts[0]?.text || '');
                    if (!componentJson && content.includes('```json')) {
                        const match = content.match(/```json\n([\s\S]*?)\n```/);
                        if (match) componentJson = match[1];
                    }
                    return {
                        id: m.id || Math.random().toString(36).substr(2, 9),
                        role: m.role,
                        content,
                        timestamp: new Date(m.created_at),
                        componentJson
                    };
                });
                setMessages(loadedMessages);
                const messagesWithUI = loadedMessages.filter((m: any) => m.role === 'assistant' && m.componentJson);
                if (messagesWithUI.length > 0) {
                    const components = messagesWithUI.map((msg: Message) => {
                        try {
                            const transformed = transformComponentData(JSON.parse(msg.componentJson!));
                            const msgIndex = loadedMessages.findIndex((m: any) => m.id === msg.id);
                            const userMsg = msgIndex > 0 ? loadedMessages[msgIndex - 1] : null;
                            const userPrompt = userMsg?.role === 'user' ? userMsg.content : "Generated Component";
                            const thinkingText = msg.content !== "UI component generated successfully" ? msg.content : "Process completed";

                            // Response cards (wrappers) always occupy 1 column of the main canvas grid
                            return {
                                type: 'card',
                                props: { className: `col-span-1 bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden` },
                                children: [
                                    {
                                        type: 'div',
                                        props: { className: 'p-3 sm:p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-sm' },
                                        children: [
                                            {
                                                type: 'text',
                                                props: { className: 'text-sm font-semibold text-foreground mb-2 sm:mb-3 line-clamp-2 leading-relaxed', content: userPrompt }
                                            },
                                            {
                                                type: 'thinking-block',
                                                props: { finished: true },
                                                children: [{ type: 'text', content: thinkingText }]
                                            }
                                        ]
                                    },
                                    {
                                        type: 'div',
                                        props: { className: 'p-3 sm:p-4' },
                                        children: [transformed]
                                    }
                                ]
                            };
                        } catch (e) { return null; }
                    }).filter(Boolean);

                    const currentColCount = getAdaptiveCols(isLeftOpen, isRightOpen, isMobile);
                    setUiSchema({
                        type: 'container',
                        props: {
                            className: 'w-full h-full',
                            layout: 'grid',
                            cols: currentColCount,
                            gap: 4
                        },
                        children: components
                    });
                } else {
                    const currentColCount = getAdaptiveCols(isLeftOpen, isRightOpen, isMobile);
                    setUiSchema({
                        ...initialSchema,
                        props: { ...initialSchema.props, cols: currentColCount }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load chat:', error);
            toast({
                title: "Error",
                description: "Failed to load project",
                variant: "destructive",
            });
        }
        finally { setIsLoadingConv(false); setTimeout(() => setIsRightOpen(true), 1000); setTimeout(() => setIsLeftOpen(false), 1000); }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text || isLoading) return;

        let conversationId = currentConversationId;

        // Auto-create project if none selected
        if (!conversationId) {
            setIsLoading(true);
            const newId = await confirmCreateChat();
            if (!newId) {
                setIsLoading(false);
                return;
            }
            conversationId = newId;
        }

        processAIResponse(text, conversationId ?? undefined);
    };

    const processAIResponse = async (text: string, conversationIdOverride?: string) => {
        const conversationId = conversationIdOverride || currentConversationId || undefined;
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        const placeholderId = `placeholder-${Date.now()}`;
        const adaptiveColSpan = getAdaptiveColSpan(isLeftOpen, isRightOpen, isMobile);
        const placeholderCard = {
            type: 'card',
            props: {
                className: `${adaptiveColSpan} bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-lg rounded-xl sm:rounded-2xl overflow-hidden animate-in fade-in duration-300`,
                id: placeholderId
            },
            children: [
                {
                    type: 'div',
                    props: { className: 'p-3 sm:p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent' },
                    children: [
                        { type: 'text', props: { className: 'text-sm font-semibold text-foreground mb-2 sm:mb-3 line-clamp-2 leading-relaxed', content: text } },
                        {
                            type: 'div',
                            props: { className: 'flex items-center gap-2 py-1 sm:py-2' },
                            children: [
                                { type: 'text', props: { className: 'text-[11px] font-medium text-muted-foreground uppercase tracking-wider', content: '⚡ Thinking...' } }
                            ]
                        }
                    ]
                },
                {
                    type: 'div',
                    props: { className: 'p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex items-center justify-center' },
                    children: [
                        {
                            type: 'div',
                            props: { className: 'flex flex-col items-center gap-2 sm:gap-3 text-muted-foreground' },
                            children: [
                                { type: 'text', props: { className: 'text-xs sm:text-sm animate-pulse', content: 'Processing your request...' } }
                            ]
                        }
                    ]
                }
            ]
        };

        setUiSchema(prev => ({
            type: 'container',
            props: { className: 'w-full h-full', layout: 'grid', cols: 4, gap: 4 },
            children: [...(prev.children || []), placeholderCard]
        }));

        let connectionMap = {};
        let openrouterkey: string | undefined;


        // Try to identify the agent from the current conversation metadata
        // const currentConv = conversations.find(c => c.conversation_id === currentConversationId);
        let agentConnectionId1 = 'dcf594b0-148c-47e3-95a7-78c09b339740'

        // If we have a specific agent (not the default assistant), fetch user-specific connection links
        if (agentConnectionId1 && agentConnectionId1 !== 'assistant') {
            try {
                const linkRes = await fetch(`${API_URL}/api/v1/agents/${agentConnectionId1}/user-link?userId=${userId}`);
                if (linkRes.ok) {
                    const linkData = await linkRes.json();
                    if (linkData) {
                        if (linkData.connection_map) {
                            connectionMap = linkData.connection_map;
                        }
                        if (linkData.api_key) {
                            openrouterkey = linkData.api_key;
                        }

                    }
                }
            } catch (err) {
                console.warn("Failed to fetch agent user link:", err);
            }
        }

        try {
            console.log("Running Agent ID:", agentConnectionId1);
            const response = await fetch(`${AI_URL}/agents/${agentConnectionId1}/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({
                    input: text,
                    userId,
                    conversationId: conversationId,
                    options: {
                        userId,
                        conversationId: conversationId,
                        context: {
                            userId: userId,
                            conversationId: conversationId,
                            tooluserid: userId,
                            connectionMap: connectionMap,
                            agentId: agentConnectionId1,
                            openrouterkey: openrouterkey
                        },
                        maxSteps: 100,
                    }
                })
            })
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullStreamBuffer = '', isCollectingJson = false, jsonStartIndex = -1;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const events = parseSSEChunk(decoder.decode(value, { stream: true }));
                for (const event of events) {
                    if (event.type === 'text-delta') {
                        const delta = event.text || '';
                        fullStreamBuffer += delta;

                        if (!isCollectingJson) {
                            const idx = fullStreamBuffer.indexOf('```json');
                            if (idx !== -1) {
                                isCollectingJson = true;
                                jsonStartIndex = idx + 7;
                            }
                        }
                    }
                }
            }

            let assistantContent = fullStreamBuffer || "Processed", assistantMetadata: any = {};
            let isStructured = false;

            if (isCollectingJson) {
                let jsonText = fullStreamBuffer.substring(jsonStartIndex);
                const closingIdx = jsonText.lastIndexOf('```');
                if (closingIdx !== -1) jsonText = jsonText.substring(0, closingIdx);

                try {
                    const parsed = JSON.parse(jsonText);
                    const transformed = transformComponentData(parsed);
                    isStructured = true;

                    assistantContent = fullStreamBuffer.substring(0, jsonStartIndex).replace('```json', '').trim();
                    if (!assistantContent) assistantContent = "Process completed";

                    assistantMetadata = {
                        agentId: 'assistant',
                        componentJson: JSON.stringify(parsed, null, 2)
                    };

                    // Response cards (wrappers) always occupy 1 column of the main canvas grid
                    const wrapperComponent = {
                        type: 'card',
                        props: { className: `col-span-1 bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500` },
                        children: [
                            {
                                type: 'div',
                                props: { className: 'p-3 sm:p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-sm' },
                                children: [
                                    {
                                        type: 'text',
                                        props: { className: 'text-sm font-semibold text-foreground mb-2 sm:mb-3 line-clamp-2 leading-relaxed', content: text }
                                    },
                                    {
                                        type: 'thinking-block',
                                        props: { finished: true },
                                        children: [{ type: 'text', content: assistantContent }]
                                    }
                                ]
                            },
                            {
                                type: 'div',
                                props: { className: 'p-3 sm:p-4' },
                                children: [transformed]
                            }
                        ]
                    };

                    setUiSchema(prev => ({
                        ...prev,
                        children: Array.isArray(prev.children) ? prev.children.map((child: any) =>
                            child.props?.id === placeholderId ? wrapperComponent : child
                        ) : prev.children
                    }));

                    toast({
                        title: "UI Generated",
                        description: "Component has been successfully created",
                    });

                } catch (e) {
                    console.error("Failed to parse component JSON:", e);
                    isStructured = false;
                }
            }

            // Fallback for non-JSON or failed parse
            if (!isStructured) {
                const textContent = fullStreamBuffer.trim() || "No response content generated.";
                const fallbackCard = {
                    type: 'card',
                    props: { className: `col-span-1 bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-lg rounded-xl sm:rounded-2xl overflow-hidden animate-in fade-in duration-500` },
                    children: [
                        {
                            type: 'div',
                            props: { className: 'p-3 sm:p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent' },
                            children: [
                                { type: 'text', props: { className: 'text-sm font-semibold text-foreground mb-2 sm:mb-3 line-clamp-2 leading-relaxed', content: text } },
                                {
                                    type: 'thinking-block',
                                    props: { finished: true },
                                    children: [{ type: 'text', content: "Response" }]
                                }
                            ]
                        },
                        {
                            type: 'div',
                            props: { className: 'p-3 sm:p-4' },
                            children: [
                                {
                                    type: 'TextCard',
                                    props: {
                                        content: textContent,
                                        variant: 'default',
                                        bordered: false,
                                        background: false,
                                        size: 'md'
                                    }
                                }
                            ]
                        }
                    ]
                };

                setUiSchema(prev => ({
                    ...prev,
                    children: Array.isArray(prev.children) ? prev.children.map((child: any) =>
                        child.props?.id === placeholderId ? fallbackCard : child
                    ) : prev.children
                }));
            }

            const assistantMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
                componentJson: assistantMetadata.componentJson
            };
            setMessages(prev => [...prev, assistantMsg]);

            fetch(`${AI_URL}/api/memory/save-messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    conversationId: currentConversationId,
                    messages: [
                        { role: 'user', content: text },
                        { role: 'assistant', content: assistantContent, metadata: assistantMetadata }
                    ]
                })
            }).catch(e => console.error(e));

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "An error occurred while processing your request.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
            toast({
                title: "Error",
                description: "Failed to process request",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <TooltipProvider>
            <div className="flex h-screen w-full bg-background overflow-hidden relative">

                {/* Desktop Left Sidebar */}
                <aside className={cn(
                    "hidden md:flex w-[23%] border-r shrink-0 flex-col transition-all duration-300 ease-out",
                    !isLeftOpen && "w-0 border-none overflow-hidden"
                )}>
                    <LeftSidebar
                        conversations={conversations}
                        convasationloading={convasationloading}
                        currentConversationId={currentConversationId}
                        isLoadingConv={isLoadingConv}
                        deletingConvId={deletingConvId}
                        isClearingHistory={isClearingHistory}
                        handleNewChat={handleNewChat}
                        handleLoadConversation={handleLoadConversation}
                        handleDeleteConversation={handleDeleteConversation}
                        handleClearAllHistory={handleClearAllHistory}
                    />
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-20 h-14 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border/5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)]"
                        style={{ backgroundSize: '20px 20px' }}
                    >
                        <div className="flex items-center gap-3">
                            {/* Mobile Menu Trigger */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-72 border-r-0">
                                    <SidebarContent className="bg-background" />
                                </SheetContent>
                            </Sheet>

                            {/* Desktop Left Sidebar Toggle */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setIsLeftOpen(!isLeftOpen)}
                                        className={cn(
                                            "hidden md:flex h-9 w-9 rounded-xl items-center justify-center transition-all duration-300",
                                            "hover:scale-110 active:scale-95",
                                            "hover:shadow-[0_0_15px_rgba(var(--primary),0.2)]",
                                            isLeftOpen
                                                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                                : "bg-primary/10 text-primary hover:bg-primary/20"
                                        )}
                                    >
                                        {isLeftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isLeftOpen ? 'Close History' : 'Show History'}</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* Branding & Config */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Canvas</span>
                                {currentConversationId && (
                                    <Badge variant="outline" className="font-normal text-xs bg-primary/5 text-primary border-primary/20">
                                        {conversations.find(c => c.conversation_id === currentConversationId)?.title || 'Untitled'}
                                    </Badge>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground" onClick={handleOpenConfig} title="Configure Agent Connections">
                                    <Settings className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {((uiSchema.children?.length ?? 0) > 0) && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => {
                                                setUiSchema(initialSchema);
                                                setMessages([]);
                                                setCurrentConversationId(null);
                                                setIsRightOpen(false);
                                                setIsLeftOpen(false);
                                            }}
                                            className="h-9 w-9 rounded-xl bg-destructive/10 hover:bg-destructive/20
                                                hover:text-destructive text-destructive/80 flex items-center
                                                justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                                        >
                                            ✕
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Clear Canvas</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setIsRightOpen(!isRightOpen)}
                                        className={cn(
                                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                                            "hover:scale-110 active:scale-95",
                                            "hover:shadow-[0_0_15px_rgba(var(--primary),0.2)]",
                                            isRightOpen
                                                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                                : "bg-primary/10 text-primary hover:bg-primary/20"
                                        )}
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isRightOpen ? 'Close Chat' : 'Show Chat'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>


                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden">
                        {/* Desktop Content */}
                        <div className="hidden md:flex h-full pb-20">
                            {/* Canvas Area */}
                            <CanvasArea uiSchema={uiSchema} />
                        </div>
                    </div>

                    {/* Floating Chat Input with Dynamic Positioning & Title */}
                    <div
                        className={cn(
                            "absolute z-40 transition-all duration-700 ease-in-out w-full px-4 pointer-events-none",
                            (messages.length > 0)
                                ? "bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 max-w-4xl"
                                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl"
                        )}
                    >
                        {messages.length === 0 && (
                            <div className="mb-8 sm:mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 pointer-events-auto">
                                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 bg-linear-to-br from-foreground to-foreground/40 bg-clip-text text-transparent">
                                    CANVAS BUILDER
                                </h1>
                                <p className="text-muted-foreground max-w-sm mx-auto text-sm font-medium leading-relaxed opacity-60">
                                    Ask any question and receive visual, component-based answers.
                                </p>
                            </div>
                        )}
                        <InputArea
                            inputValue={inputValue}
                            setInputValue={setInputValue}
                            handleSendMessage={handleSendMessage}
                            handleNewChat={handleNewChat}
                            isLoading={isLoading}
                            currentConversationId={currentConversationId}
                            className={messages.length > 0 ? "shadow-2xl translate-y-0" : "shadow-3xl"}
                        />
                    </div>
                </main>


                {/* Desktop Right Sidebar */}
                <aside className={cn(
                    "flex w-[30%] border-l shrink-0 flex-col transition-all duration-300 ease-out h-full",
                    !isRightOpen && "w-0 border-none overflow-hidden"
                )}>
                    <RightSidebar messages={messages} messagesEndRef={messagesEndRef} />
                </aside>
            </div>

            {/* Create Project Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Give your project a memorable name. You can always change it later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newChatName}
                            onChange={(e) => setNewChatName(e.target.value)}
                            placeholder="Project Name..."
                            className="h-11"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isCreating) confirmCreateChat();
                                if (e.key === 'Escape') setCreateDialogOpen(false);
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => { confirmCreateChat(); }}
                            disabled={isCreating || !newChatName.trim()}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AgentConnectionDialog
                open={isConfigOpen}
                onOpenChange={setIsConfigOpen}
                agent={configAgent}
            />
        </TooltipProvider>
    );
}
