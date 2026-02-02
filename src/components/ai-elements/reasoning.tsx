"use client"

import * as React from "react"
import { Brain, ChevronDown, Sparkles } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface ReasoningProps extends React.ComponentPropsWithoutRef<typeof Collapsible> {
  isStreaming?: boolean
}

const Reasoning = React.forwardRef<
  React.ElementRef<typeof Collapsible>,
  ReasoningProps
>(({ className, isStreaming, children, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)

  // Auto-open when streaming starts
  React.useEffect(() => {
    if (isStreaming) {
      setOpen(true)
    }
  }, [isStreaming])

  // Auto-collapse when streaming ends (optional, based on logic)
  // The user requirement says "closes when streaming finishes".
  React.useEffect(() => {
    if (isStreaming === false) {
       // Small delay to let user see the final thought before collapsing
       const timer = setTimeout(() => setOpen(false), 1000)
       return () => clearTimeout(timer)
    }
  }, [isStreaming])

  return (
    <Collapsible
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      className={cn("group w-full space-y-2 py-2", className)}
      {...props}
    >
      {children}
    </Collapsible>
  )
})
Reasoning.displayName = "Reasoning"

const ReasoningTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsibleTrigger>
>(({ className, children, ...props }, ref) => (
  <CollapsibleTrigger
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 px-4 py-2 text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-white/10",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2 text-slate-500 dark:text-white/50">
      <div className="relative">
        <Brain className="h-4 w-4" />
        <Sparkles className="absolute -right-1 -top-1 h-2 w-2 animate-pulse text-primary" />
      </div>
      <span>Thought Process</span>
    </div>
    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 text-slate-400" />
  </CollapsibleTrigger>
))
ReasoningTrigger.displayName = "ReasoningTrigger"

const ReasoningContent = React.forwardRef<
  React.ElementRef<typeof CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsibleContent>
>(({ className, children, ...props }, ref) => (
  <CollapsibleContent
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
    {...props}
  >
    <div className={cn("rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5 p-4 text-slate-600 dark:text-white/60 leading-relaxed italic font-mono", className)}>
      {children}
    </div>
  </CollapsibleContent>
))
ReasoningContent.displayName = "ReasoningContent"

export { Reasoning, ReasoningTrigger, ReasoningContent }
