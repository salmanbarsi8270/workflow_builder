
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const messageVariants = cva(
  "relative group transition-all duration-300 w-fit max-w-full rounded-xl px-5 py-3 text-sm leading-relaxed backdrop-blur-sm shadow-sm",
  {
    variants: {
      role: {
        user: "dark:bg-linear-to-br dark:from-primary/20 dark:via-primary/10 dark:to-transparent text-foreground dark:text-white border border-primary/30 ml-auto",
        assistant: "dark:bg-linear-to-br dark:from-[#111111]/90 dark:via-[#0a0a0a]/90 dark:to-transparent text-foreground dark:text-white/90 border border-slate-200 dark:border-white/10 dark:shadow-none mr-auto",
        system: "bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto",
      },
      isTyping: {
        true: "animate-pulse-once",
        false: "",
      },
    },
    defaultVariants: {
      role: "assistant",
      isTyping: false,
    },
  }
)

interface MessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageVariants> {
  children: React.ReactNode
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, role, isTyping, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(messageVariants({ role, isTyping }), className)}
        {...props}
      >
        {children}
        {role === 'assistant' && !isTyping && (
             <div className="absolute -top-2 -right-2 h-4 w-4 text-primary/50">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-full w-full"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
             </div>
        )}
      </div>
    )
  }
)
Message.displayName = "Message"

const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative z-10 w-full overflow-hidden overflow-x-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
})
MessageContent.displayName = "MessageContent"

const MessageActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mt-2 flex items-center gap-2", className)}
      {...props}
    >
      {children}
    </div>
  )
})
MessageActions.displayName = "MessageActions"

export { Message, MessageContent, MessageActions, messageVariants }
