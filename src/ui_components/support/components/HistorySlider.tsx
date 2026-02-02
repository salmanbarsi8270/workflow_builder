import { 
    Clock, 
    Check, 
    MessageSquare, 
    Search,
    Star,
    Plus,
    X,
    Archive,
    Pin, 
    PinOff, 
    Trash2, 
    Edit2,
    PinIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/sidebar';
import type { ChatSession } from '../SupportChatInterface';
import { useState, useMemo } from 'react';
import React from 'react';
import { cn } from "@/lib/utils";

interface HistorySliderProps {
    agentId: string;
    sessions: ChatSession[];
    currentSession: ChatSession;
    selectedSessionId: string;
    onSelectSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onPinSession: (sessionId: string) => void;
    onRenameSession: (sessionId: string, newTitle: string) => void;
    onClearHistory: () => void;
    onExportSession: (sessionId: string) => void;
    onCreateNew: () => void;
}

interface SessionItemProps {
    session: ChatSession;
    isSelected: boolean;
    isEditing: boolean;
    editTitle: string;
    onSelect: () => void;
    onDelete: () => void;
    onPin: () => void;
    onExport: () => void;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onEditTitleChange: (title: string) => void;
}

export const HistorySlider: React.FC<HistorySliderProps> = ({
    agentId,
    sessions,
    currentSession,
    selectedSessionId,
    onSelectSession,
    onDeleteSession,
    onPinSession,
    onRenameSession,
    onClearHistory,
    onExportSession,
    onCreateNew
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            const matchesSearch = searchQuery === '' || 
                session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                session.preview.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [sessions, searchQuery]);

    const groupedSessions = useMemo(() => {
        const groups: { [key: string]: ChatSession[] } = {
            'Pinned': [],
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        filteredSessions.forEach(session => {
            if (session.isPinned) {
                groups['Pinned'].push(session);
                return;
            }

            const sessionDate = new Date(session.timestamp);
            sessionDate.setHours(0, 0, 0, 0);

            const diffTime = now.getTime() - sessionDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                groups['Today'].push(session);
            } else if (diffDays === 1) {
                groups['Yesterday'].push(session);
            } else if (diffDays <= 7) {
                groups['Previous 7 Days'].push(session);
            } else {
                groups['Older'].push(session);
            }
        });

        return groups;
    }, [filteredSessions]);

    const handleStartEdit = (session: ChatSession) => {
        setEditingSessionId(session.id);
        setEditTitle(session.title);
    };

    const handleSaveEdit = (sessionId: string) => {
        if (editTitle.trim()) {
            onRenameSession(sessionId, editTitle.trim());
        }
        setEditingSessionId(null);
        setEditTitle('');
    };

    const handleCancelEdit = () => {
        setEditingSessionId(null);
        setEditTitle('');
    };

    return (
        <Sidebar 
            collapsible="offExamples" 
            className="!absolute left-0 top-0 h-full border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a] z-50 transition-all duration-300 w-64"
            style={{ position: 'absolute' }}
        >
            <SidebarHeader className="p-3">
                <Button 
                    onClick={onCreateNew}
                    className="w-full justify-start gap-2 bg-slate-100 dark:bg-white/5 hover:bg-primary/5 dark:hover:bg-primary/10 border border-primary/20 text-foreground dark:text-white rounded-xl h-10 px-3 shadow-sm dark:shadow-none transition-all group/new"
                >
                    <Plus className="h-4 w-4 text-primary group-hover/new:rotate-90 transition-transform" />
                    <span className="group-data-[collapsible=icon]:hidden font-medium text-sm">New chat</span>
                </Button>

                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-white/40" />
                    <Input
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 bg-slate-100 dark:bg-white/5 border border-primary/20 text-sm focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all rounded-lg"
                    />
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4 no-scrollbar">
                {Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
                    if (groupSessions.length === 0) return null;
                    return (
                        <SidebarGroup key={groupName} className="mb-4">
                            <SidebarGroupLabel className={cn(
                                "px-3 py-2 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2",
                                groupName === 'Pinned' ? "text-primary" : "text-slate-400 dark:text-white/30"
                            )}>
                                {groupName === 'Pinned' && <PinIcon className="h-3 w-3" />}
                                {groupName}
                            </SidebarGroupLabel>
                            <SidebarMenu className="gap-0.5">
                                {groupSessions.map(session => (
                                    <SessionItem
                                        key={session.id}
                                        session={session}
                                        isSelected={selectedSessionId === session.id}
                                        isEditing={editingSessionId === session.id}
                                        editTitle={editTitle}
                                        onSelect={() => onSelectSession(session.id)}
                                        onDelete={() => onDeleteSession(session.id)}
                                        onPin={() => onPinSession(session.id)}
                                        onExport={() => onExportSession(session.id)}
                                        onStartEdit={() => handleStartEdit(session)}
                                        onSaveEdit={() => handleSaveEdit(session.id)}
                                        onCancelEdit={handleCancelEdit}
                                        onEditTitleChange={setEditTitle}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    );
                })}

                {filteredSessions.length === 0 && (
                    <div className="px-4 py-8 text-center">
                        <Archive className="h-10 w-10 text-slate-200 dark:text-white/10 mx-auto mb-3" />
                        <p className="text-xs text-slate-400 dark:text-white/20 font-medium">No conversations found</p>
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter className="p-3 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0a0a0a]/50">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearHistory}
                    className="w-full justify-start gap-3 h-10 text-slate-400 dark:text-white/40 hover:text-red-400 hover:bg-red-500/5 px-2"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium text-sm">Clear history</span>
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
};

const SessionItem: React.FC<SessionItemProps> = ({
    session,
    isSelected,
    isEditing,
    editTitle,
    onSelect,
    onDelete,
    onPin,
    onExport,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onEditTitleChange
}) => {

    return (
        <SidebarMenuItem>
            <div className="group/item relative">
                <SidebarMenuButton
                    isActive={isSelected}
                    onClick={!isEditing ? onSelect : undefined}
                    className={cn(
                        "h-10 px-3 py-2 rounded-xl transition-all border flex items-center gap-3 w-full group/btn",
                        isSelected 
                            ? "bg-primary/20 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 shadow-lg shadow-primary/10" 
                            : session.isPinned
                                ? "bg-primary/5 dark:bg-primary/10 text-primary/80 dark:text-primary border-primary/10 hover:border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/15"
                                : "text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white border-transparent"
                    )}
                >
                    {isEditing ? (
                        <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                            <Input
                                value={editTitle}
                                onChange={(e) => onEditTitleChange(e.target.value)}
                                className="h-7 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-xs px-2 focus:ring-0"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSaveEdit();
                                    if (e.key === 'Escape') onCancelEdit();
                                }}
                            />
                            <div className="flex gap-1 shrink-0">
                                <button onClick={onSaveEdit} className="p-1 hover:text-primary transition-colors">
                                    <Check className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={onCancelEdit} className="p-1 hover:text-red-400 transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 w-full min-w-0 pr-6">
                            {session.isPinned ? (
                                <Star className="h-4 w-4 text-primary fill-primary shrink-0 group-hover/btn:scale-110 transition-transform" />
                            ) : (
                                <MessageSquare className="h-4 w-4 text-slate-300 dark:text-white/20 shrink-0 group-hover/btn:text-primary/60 transition-colors" />
                            )}
                            <span className="truncate text-sm font-semibold">{session.title}</span>
                        </div>
                    )}
                </SidebarMenuButton>

                {!isEditing && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 items-center gap-0.5 hidden group-hover/item:flex transition-opacity bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPin(); }}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-amber-500 transition-colors"
                        >
                            {session.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-foreground dark:hover:text-white transition-colors"
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </SidebarMenuItem>
    );
};