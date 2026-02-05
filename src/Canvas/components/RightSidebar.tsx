import { Sparkles, Bot, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    componentJson?: string;
}

interface RightSidebarProps {
    messages: Message[];
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const RightSidebar = ({ messages, messagesEndRef }: RightSidebarProps) => (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-l">
        <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Assistant</h2>
            </div>
            <Badge variant="outline" className="text-xs">
                {messages.length} messages
            </Badge>
        </div>

        <ScrollArea className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4 pb-4">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Bot className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Start a conversation to see history</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={cn("flex flex-col gap-1", msg.role === 'user' ? "items-end" : "items-start")}>
                            <div className={cn(
                                "max-w-[85%] sm:max-w-[90%] rounded-xl px-3 py-2 text-sm wrap-break-word backdrop-blur-sm",
                                msg.role === 'user' ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-muted-foreground rounded-bl-sm"
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
                <div ref={messagesEndRef} className="h-px" />
            </div>
        </ScrollArea>
    </div>
);
