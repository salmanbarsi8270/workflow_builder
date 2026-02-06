import { useRef } from "react";
import { Plus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InputAreaProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleNewChat: () => void;
  isLoading: boolean;
  currentConversationId: string | null;
  className?: string;
}

export const InputArea = ({
  inputValue,
  setInputValue,
  handleSendMessage,
  handleNewChat,
  isLoading,
  currentConversationId,
  className,
}: InputAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && currentConversationId && inputValue.trim()) {
        handleSendMessage(e as any);
      }
    }
  };

  return (
    <div className={cn("w-full max-w-2xl pointer-events-auto mx-auto", className)}>
      <div className="relative group">
        {/* Gradient border + glow (same as ChatInput) */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-sm opacity-100" />
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-100" />

        <form
          onSubmit={handleSendMessage}
          className="relative flex w-full bg-background border border-border/50 rounded-2xl shadow-sm focus-within:shadow-md transition-all overflow-hidden z-10"
        >
          {/* New Project */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="absolute left-3 top-3 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Project</TooltipContent>
          </Tooltip>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              currentConversationId
                ? "Ask Voltagent to build something..."
                : "Ask anything to start a new project..."
            }
            className="w-full bg-transparent border-0 resize-none min-h-[56px] max-h-[200px] py-4 px-14 pr-24 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:ring-0 focus:outline-none"
          />

          {/* Send */}
          <div className="absolute right-3 bottom-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    "h-9 w-9 rounded-full transition-all shadow-sm",
                    inputValue.trim()
                      ? "bg-foreground text-background hover:scale-105"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 fill-current" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {currentConversationId ? "Send message" : "Start new project"}
              </TooltipContent>
            </Tooltip>
          </div>
        </form>
      </div>
    </div>
  );
};
