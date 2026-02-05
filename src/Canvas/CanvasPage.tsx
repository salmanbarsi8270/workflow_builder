import { useRef, useState, useEffect } from "react";
import {
    Plus, PanelLeftClose, PanelLeftOpen,
    PanelRightClose, PanelRightOpen, Sparkles, Send,
    Loader2, Trash2, Settings,
    Code, Menu, LayoutTemplate, MoreVertical
} from "lucide-react";
import { Canvas } from "./generative_ui/Canvas";
import type { UIComponent } from "./generative_ui/types";
import { parseSSEChunk } from "../lib/sse-parser";
import { applyAutoGridFlow } from "./generative_ui/auto-grid-engine";
import { AgentConnectionDialog } from "../ui_components/Agents/AgentConnectionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/collapsible";
import {
    TooltipProvider
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../context/UserContext";
import { AI_URL, API_URL } from "../ui_components/api/apiurl";
import { cn } from "@/lib/utils";

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
        className: 'p-8 h-full overflow-y-auto pb-48 items-start content-start',
        layout: 'grid',
        gap: 6
    },
    children: []
};

// Adaptive grid column calculation based on sidebar visibility
const getAdaptiveColSpan = (leftSidebarOpen: boolean, rightSidebarOpen: boolean): string => {
    if (!leftSidebarOpen && !rightSidebarOpen) {
        // Full canvas: 4 columns per row (12/4 = 3)
        return 'col-span-12 md:col-span-6 lg:col-span-3';
    } else if (leftSidebarOpen && !rightSidebarOpen) {
        // Left sidebar only: 3 columns per row (12/3 = 4  )
        return 'col-span-12 md:col-span-6 lg:col-span-4';
    } else if (!leftSidebarOpen && rightSidebarOpen) {
        // Right sidebar only: 3 columns per row
        return 'col-span-12 md:col-span-6 lg:col-span-4';
    } else {
        // Both sidebars: 2 columns per row (12/2 = 6)
        return 'col-span-12 md:col-span-6';
    }
};


const transformComponentData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
        const transformedChildren = data.map(transformComponentData);
        // If it's a top-level array, wrap it in a container
        return {
            type: 'container',
            props: { layout: 'grid', cols: 1 },
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

        // Copy all other keys as props (excluding known keywords)
        Object.keys(sourceData).forEach(key => {
            if (!['type', 'component', 'children', 'content', 'props', 'items', 'rows', 'data'].includes(key)) {
                transformed.props[key] = sourceData[key];
            }
        });

        // Resolve children from multiple possible sources
        const childrenSource = sourceData.children || sourceData.content || sourceData.items || sourceData.rows || sourceData.data;

        if (childrenSource !== undefined) {
            if (Array.isArray(childrenSource)) {
                transformed.children = childrenSource.map(transformComponentData);
            } else if (typeof childrenSource === 'object' && childrenSource !== null) {
                // If it's a single object that looks like a component, transform it
                if (childrenSource.type || childrenSource.component || (Object.keys(childrenSource).length === 1 && componentTypes.includes(Object.keys(childrenSource)[0]))) {
                    transformed.children = [transformComponentData(childrenSource)];
                } else {
                    // Otherwise, just pass it (might be a raw data object)
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
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dialog and loading states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
    const [isClearingHistory, setIsClearingHistory] = useState(false);
    const [isLoadingConv, setIsLoadingConv] = useState(false);

    const [isLeftOpen, setIsLeftOpen] = useState(true);
    const [isRightOpen, setIsRightOpen] = useState(true);

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

    const userId = user?.id || localStorage.getItem('userId') || 'guest';

    const fetchConversations = async () => {
        try {
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
    };

    useEffect(() => {
        if (userId) fetchConversations();
    }, [userId]);

    const handleNewChat = async () => {
        setCreateDialogOpen(true);
        setNewChatName(`Project ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`);
    };

    const confirmCreateChat = async () => {
        const title = newChatName.trim() || `Project ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
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
                setMessages([{
                    id: '1',
                    role: 'assistant',
                    content: `Welcome to "${title}"! I'm ready to help you build amazing UIs.`,
                    timestamp: new Date()
                }]);
                fetchConversations();
                toast({
                    title: "Project created",
                    description: `"${title}" has been created successfully`,
                });
                setCreateDialogOpen(false);
                setNewChatName("");
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
        }
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

                            // Find matching user message (preceding the assistant message)
                            const msgIndex = loadedMessages.findIndex((m: any) => m.id === msg.id);
                            const userMsg = msgIndex > 0 ? loadedMessages[msgIndex - 1] : null;
                            const userPrompt = userMsg?.role === 'user' ? userMsg.content : "Generated Component";
                            // For historical messages, if content is the default success msg, we might not have the thinking text.
                            const thinkingText = msg.content !== "UI component generated successfully" ? msg.content : "Process completed";

                            const autoGridSpan = applyAutoGridFlow(transformed, isLeftOpen, isRightOpen);
                            return {
                                type: 'card',
                                props: { className: `${autoGridSpan} bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden` },
                                children: [
                                    {
                                        type: 'div',
                                        props: { className: 'p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-sm' },
                                        children: [
                                            {
                                                type: 'text',
                                                props: { className: 'text-sm font-semibold text-foreground mb-3 line-clamp-2 leading-relaxed', content: userPrompt }
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
                                        props: { className: 'p-4' },
                                        children: [transformed]
                                    }
                                ]
                            };
                        } catch (e) { return null; }
                    }).filter(Boolean);

                    setUiSchema({
                        type: 'container',
                        props: {
                            className: 'p-8 h-full overflow-y-auto pb-48 items-start content-start',
                            layout: 'grid',
                            gap: 6
                        },
                        children: components
                    });
                } else {
                    setUiSchema(initialSchema);
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
        finally { setIsLoadingConv(false); }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        if (!currentConversationId) {
            toast({
                title: "No project selected",
                description: "Please create or select a project first",
            });
            return;
        }
        processAIResponse(inputValue.trim());
    };

    const processAIResponse = async (text: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        // Immediately create placeholder card with question
        const placeholderId = `placeholder-${Date.now()}`;
        const adaptiveColSpan = getAdaptiveColSpan(isLeftOpen, isRightOpen);
        const placeholderCard = {
            type: 'card',
            props: {
                className: `${adaptiveColSpan} bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-lg rounded-2xl overflow-hidden animate-in fade-in duration-300`,
                id: placeholderId
            },
            children: [
                {
                    type: 'div',
                    props: { className: 'p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent' },
                    children: [
                        { type: 'text', props: { className: 'text-sm font-semibold text-foreground mb-3 line-clamp-2 leading-relaxed', content: text } },
                        {
                            type: 'div',
                            props: { className: 'flex items-center gap-2 py-2' },
                            children: [
                                { type: 'text', props: { className: 'text-[11px] font-medium text-muted-foreground uppercase tracking-wider', content: '⚡ Thinking...' } }
                            ]
                        }
                    ]
                },
                {
                    type: 'div',
                    props: { className: 'p-4 min-h-[120px] flex items-center justify-center' },
                    children: [
                        {
                            type: 'div',
                            props: { className: 'flex flex-col items-center gap-3 text-muted-foreground' },
                            children: [
                                { type: 'text', props: { className: 'text-sm animate-pulse', content: 'Processing your request...' } }
                            ]
                        }
                    ]
                }
            ]
        };

        setUiSchema(prev => ({
            type: 'container',
            props: { className: 'p-8 h-full overflow-y-auto pb-48 items-start content-start', layout: 'grid', gap: 6 },
            children: [...(prev.children || []), placeholderCard]
        }));

        // Fetch connection map before streaming
        let connectionMap = {};
        let openrouterkey: string | undefined;
        let cId: string | undefined;

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
                        if (linkData.connection_id) {
                            cId = linkData.connection_id;
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
                    conversationId: currentConversationId,
                    options: {
                        userId,
                        conversationId: currentConversationId,
                        context: {
                            userId: userId,
                            conversationId: currentConversationId,
                            tooluserid: userId,
                            connectionMap: connectionMap,
                            agentId: agentConnectionId1,
                            openrouterkey:openrouterkey
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
            if (isCollectingJson) {
                let jsonText = fullStreamBuffer.substring(jsonStartIndex);
                const closingIdx = jsonText.lastIndexOf('```');
                if (closingIdx !== -1) jsonText = jsonText.substring(0, closingIdx);

                try {
                    const parsed = JSON.parse(jsonText);
                    const transformed = transformComponentData(parsed);

                    // Preserve thinking text
                    assistantContent = fullStreamBuffer.substring(0, jsonStartIndex).replace('```json', '').trim();
                    if (!assistantContent) assistantContent = "Process completed";

                    // Update placeholder to "Generating UI" state
                    setUiSchema(prev => ({
                        ...prev,
                        children: Array.isArray(prev.children) ? prev.children.map((child: any) =>
                            child.props?.id === placeholderId
                                ? {
                                    ...child,
                                    children: [
                                        child.children[0], // Keep header
                                        {
                                            type: 'div',
                                            props: { className: 'p-4 min-h-[120px]' },
                                            children: [
                                                {
                                                    type: 'div',
                                                    props: { className: 'space-y-3 animate-pulse' },
                                                    children: [
                                                        { type: 'div', props: { className: 'h-8 bg-muted rounded' } },
                                                        { type: 'div', props: { className: 'h-4 bg-muted rounded w-3/4' } },
                                                        { type: 'div', props: { className: 'h-4 bg-muted rounded w-1/2' } }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                                : child
                        ) : prev.children
                    }));

                    assistantMetadata = {
                        agentId: 'assistant',
                        componentJson: JSON.stringify(parsed, null, 2)
                    };

                    // Wrap new component with intelligent grid
                    const autoGridSpan = applyAutoGridFlow(transformed, isLeftOpen, isRightOpen);
                    const wrapperComponent = {
                        type: 'card',
                        props: { className: `${autoGridSpan} bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500` },
                        children: [
                            {
                                type: 'div',
                                props: { className: 'p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-sm' },
                                children: [
                                    {
                                        type: 'text',
                                        props: { className: 'text-sm font-semibold text-foreground mb-3 line-clamp-2 leading-relaxed', content: text }
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
                                props: { className: 'p-4' },
                                children: [transformed]
                            }
                        ]
                    };

                    // Replace placeholder with final component
                    setUiSchema(prev => ({
                        ...prev,
                        children: Array.isArray(prev.children) ? prev.children.map((child: any) =>
                            child.props?.id === placeholderId
                                ? wrapperComponent
                                : child
                        ) : prev.children
                    }));

                    toast({
                        title: "UI Generated",
                        description: "Component has been successfully created",
                    });

                } catch (e) {
                    assistantContent = "Error parsing component JSON";
                    toast({
                        title: "Error",
                        description: "Failed to parse component JSON",
                        variant: "destructive",
                    });
                }
            }

            const assistantMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
                componentJson: assistantMetadata.componentJson
            };
            setMessages(prev => [...prev, assistantMsg]);

            // Save messages to memory
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


    const SidebarContent = ({ className }: { className?: string }) => (
        <div className={cn("flex flex-col h-full bg-card/50 backdrop-blur-xl", className)}>
            <div className="p-4 flex items-center justify-between border-b border-border/10">
                <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-sm">My Projects</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 py-2">
                <div className="px-3 space-y-1">
                    {conversations.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            No projects yet
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.conversation_id}
                                onClick={() => !isLoadingConv && handleLoadConversation(conv)}
                                className={cn(
                                    "group flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors hover:bg-muted/50",
                                    currentConversationId === conv.conversation_id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground",
                                    isLoadingConv && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <span className="truncate flex-1 pr-2">{conv.title || 'Untitled'}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100" onClick={(e) => e.stopPropagation()}>
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.conversation_id, conv.title); }}
                                            disabled={deletingConvId === conv.conversation_id}
                                        >
                                            {deletingConvId === conv.conversation_id ? (
                                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3 w-3 mr-2" />
                                            )}
                                            Delete Project
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t border-border/10">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-destructive h-8 px-2">
                            <Trash2 className="h-3 w-3 mr-2" />
                            Clear All History
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete ALL your projects and messages. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleClearAllHistory}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isClearingHistory}
                            >
                                {isClearingHistory ? (
                                    <>
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        Clearing...
                                    </>
                                ) : (
                                    'Permanently Delete All'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );

    return (
        <TooltipProvider>
            <div className="flex h-screen w-full bg-background overflow-hidden relative">

                {/* Desktop Left Sidebar */}
                <aside className={cn(
                    "hidden md:flex w-64 border-r shrink-0 flex-col bg-card transition-all duration-300",
                    !isLeftOpen && "w-0 border-none overflow-hidden"
                )}>
                    <SidebarContent />
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col relative overflow-hidden bg-background/50">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-20 h-14 flex items-center justify-between px-4 bg-background/30 backdrop-blur-md border-b border-border/5">
                        <div className="flex items-center gap-3">
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

                            <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8" onClick={() => setIsLeftOpen(!isLeftOpen)}>
                                {isLeftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                            </Button>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Voltagent Canvas</span>
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

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8" onClick={() => setIsRightOpen(!isRightOpen)}>
                                {isRightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="h-full pb-0 overflow-hidden relative">
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                        <div className="h-full w-full overflow-auto px-4 md:px-8 py-8 pb-32">
                            <Canvas uiSchema={uiSchema} />
                        </div>
                    </div>

                    {/* Floating Chat Input */}
                    <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-30 pointer-events-none">
                        <div className="w-full max-w-2xl pointer-events-auto">
                            <form onSubmit={handleSendMessage} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500" />
                                <div className="relative flex items-center bg-background/80 backdrop-blur-xl border shadow-2xl rounded-xl p-2 transition-all ring-1 ring-border/20 focus-within:ring-primary/20">
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ask Voltagent to build something..."
                                        className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent h-10 px-3"
                                        disabled={isLoading || !currentConversationId}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!inputValue.trim() || isLoading}
                                        className={cn("h-9 w-9 rounded-lg transition-all", inputValue.trim() ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground")}
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                {/* Desktop Right Sidebar (Assistant History) */}
                <aside className={cn(
                    "hidden md:flex w-80 border-l shrink-0 flex-col bg-card transition-all duration-300",
                    !isRightOpen && "w-0 border-none overflow-hidden"
                )}>
                    <div className="p-4 border-b border-border/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <h2 className="font-semibold text-sm">Assistant</h2>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:transition-colors">
                        <div className="space-y-4 pb-4">
                            {messages.length === 0 ? (
                                <div className="text-center text-xs text-muted-foreground py-12">
                                    Start a conversation to see history
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className={cn("flex flex-col gap-1", msg.role === 'user' ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-[90%] rounded-2xl px-3 py-2 text-sm break-words",
                                            msg.role === 'user' ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-muted-foreground rounded-bl-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                        {msg.componentJson && (
                                            <Collapsible>
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                                        <Code className="h-3 w-3" /> View Code
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="mt-2 text-[10px] bg-muted/50 p-2 rounded border font-mono overflow-auto max-h-32">
                                                        {msg.componentJson}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        )}
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
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
                            onClick={confirmCreateChat}
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
