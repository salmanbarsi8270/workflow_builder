import { Plus, LayoutTemplate, MoreVertical, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface LeftSidebarProps {
    className?: string;
    conversations: any[];
    convasationloading: boolean;
    currentConversationId: string | null;
    isLoadingConv: boolean;
    deletingConvId: string | null;
    isClearingHistory: boolean;
    handleNewChat: () => void;
    handleLoadConversation: (conv: any) => void;
    handleDeleteConversation: (id: string, title: string) => void;
    handleClearAllHistory: () => void;
}

export const LeftSidebar = ({ 
    className, 
    conversations, 
    convasationloading,
    currentConversationId, 
    isLoadingConv, 
    deletingConvId, 
    isClearingHistory, 
    handleNewChat, 
    handleLoadConversation, 
    handleDeleteConversation, 
    handleClearAllHistory 
}: LeftSidebarProps) => (
    <div className={cn("flex flex-col h-full bg-card/50 backdrop-blur-xl border-r", className)}>
        <div className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-sm">My Projects</h2>
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                        <Plus className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>New Project</p>
                </TooltipContent>
            </Tooltip>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 space-y-1">
                {conversations.length === 0 ? (convasationloading ? (
                    <div className="py-8 text-center text-xs text-muted-foreground w-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground w-full flex items-center justify-center">
                        No projects yet
                    </div>
                )) : (
                    conversations.map(conv => (
                        <div
                            key={conv.conversation_id}
                            onClick={() => { !isLoadingConv && handleLoadConversation(conv); }}
                            className={cn(
                                "group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-all hover:bg-muted/50",
                                currentConversationId === conv.conversation_id ? "bg-primary/10 text-primary font-medium border border-primary/20" : "text-muted-foreground",
                                isLoadingConv && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={cn(
                                    "h-2 w-2 rounded-full shrink-0",
                                    currentConversationId === conv.conversation_id ? "bg-primary" : "bg-muted"
                                )} />
                                <span className="truncate">{conv.title || 'Untitled'}</span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100" onClick={(e) => e.stopPropagation()}>
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
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

        <div className="p-3 border-t">
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
