import { MessageSquare, Folder, Plus, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import aiClient from '@/ui_components/api/aiClient';

import { type ChatSession } from '../../types';

interface ConversationListSidebarProps {
    isOpen: boolean;
    className?: string;
    onSelect?: (id: string) => void;
    onNew?: () => void;
    activeId?: string;
    agentId?: string;
    history?: any;
}

export function ConversationListSidebar({ isOpen, className, onSelect, onNew, activeId, agentId, history }: ConversationListSidebarProps) {
    const { user } = useUser();
    const [localConversations, setLocalConversations] = useState<ChatSession[]>([]);
    const [localLoading, setLocalLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingId]);

    // Derived state from history prop or local
    const conversations = history?.sessions || localConversations;
    const isLoading = history?.isLoading || localLoading;

    // Actions use history prop if available, otherwise fallback to local/API
    const internalRename = async (id: string, newTitle: string) => {
        if (!newTitle.trim() || !user?.id) return;
        
        if (history?.renameSession) {
            await history.renameSession(id, newTitle);
        } else {
            try {
                await aiClient.patch(`/api/v1/presentation/conversation/${id}`, {
                    title: newTitle,
                    userId: user.id
                });
                setLocalConversations(prev => prev.map(c =>
                    c.id === id ? { ...c, title: newTitle } : c
                ));
            } catch (err) {
                console.error("Failed to rename conversation:", err);
            }
        }
        setEditingId(null);
    };

    const internalDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user?.id) return;
        if (!confirm("Are you sure you want to delete this conversation?")) return;

        if (history?.deleteSession) {
            await history.deleteSession(id);
        } else {
            try {
                await aiClient.delete(`/api/v1/presentation/conversation/${id}?userId=${user.id}`);
                setLocalConversations(prev => prev.filter(c => c.id !== id));
            } catch (err) {
                console.error("Failed to delete conversation:", err);
            }
        }

        if (activeId === id) {
            onNew?.();
        }
    };

    // Only fetch if history is not provided
    useEffect(() => {
        if (!user?.id || !isOpen || history) return;

        const fetchHistory = async () => {
            setLocalLoading(true);
            try {
                let url = `/api/v1/presentation/history?userId=${user.id}`;
                if (agentId) {
                    url += `&agentId=${agentId}`;
                }
                const response = await aiClient.get(url);
                if (response.data?.success) {
                    setLocalConversations(response.data.conversations);
                }
            } catch (err) {
                console.error("Failed to fetch conversation history:", err);
            } finally {
                setLocalLoading(false);
            }
        };

        fetchHistory();
    }, [user?.id, isOpen, agentId, history]);

    return (
        <div
            className={cn(
                "bg-background border-r border-border flex flex-col h-full transition-all duration-500 ease-in-out overflow-hidden",
                isOpen ? "w-[280px]" : "w-0 border-r-0",
                className
            )}
        >
            <div className="w-[280px] flex flex-col h-full shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-primary" />
                        <h2 className="font-bold text-xs uppercase tracking-widest">Projects</h2>
                    </div>
                    <button
                        onClick={() => onNew?.()}
                        title="New Project"
                        className="h-8 w-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
                    {isLoading && conversations.length === 0 && (
                        <div className="p-4 text-center">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Loading...</p>
                        </div>
                    )}

                    {!isLoading && conversations.length === 0 && (
                        <div className="p-8 text-center opacity-40">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-[10px] uppercase font-bold tracking-widest leading-relaxed">No projects yet</p>
                        </div>
                    )}

                    {conversations.map((con: ChatSession) => (
                        <div
                            key={con.id}
                            onClick={() => onSelect?.(con.id)}
                            className={cn(
                                "group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border border-transparent relative",
                                activeId === con.id
                                    ? "bg-primary/10 border-primary/20"
                                    : "hover:bg-muted hover:border-border/50"
                            )}
                        >
                            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                <MessageSquare className="h-4 w-4 text-primary/60" />
                            </div>

                            <div className="flex-1 min-w-0">
                                {editingId === con.id ? (
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <Input
                                            ref={inputRef}
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') internalRename(con.id, editTitle);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            className="h-6 text-xs px-1 py-0"
                                        />
                                        <button onClick={() => internalRename(con.id, editTitle)} className="p-1 hover:text-green-500"><Check className="h-3 w-3" /></button>
                                        <button onClick={() => setEditingId(null)} className="p-1 hover:text-red-500"><X className="h-3 w-3" /></button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold truncate text-foreground/80 group-hover:text-foreground">
                                            {con.title}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {new Date(con.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* CRUD Actions */}
                            {!editingId && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-background/80">
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                            <DropdownMenuItem onClick={() => {
                                                setEditTitle(con.title);
                                                setEditingId(con.id);
                                            }}>
                                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e: any) => internalDelete(con.id, e)}>
                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/20">
                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Local Memory</p>
                        <p className="text-[9px] text-muted-foreground font-medium">Auto-syncing active</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
