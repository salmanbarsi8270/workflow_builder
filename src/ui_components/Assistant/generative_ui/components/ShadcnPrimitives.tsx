"use client"

import { cn } from "@/lib/utils"
import { Button as BaseButton } from "@/components/ui/button"
import { Badge as BaseBadge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { renderIcon } from "./utils"

/**
 * A highly versatile button component for generative UI.
 */
export const GenButton = ({ label, variant = 'default', size = 'default', icon, className, onClick }: any) => (
    <BaseButton
        variant={variant}
        size={size}
        className={cn("font-bold tracking-tight rounded-xl transition-all active:scale-95", className)}
        onClick={onClick}
    >
        {icon && renderIcon(icon, { className: "mr-2 h-4 w-4" })}
        {label}
    </BaseButton>
)

/**
 * A styled badge for categorization.
 */
export const GenBadge = ({ label, variant = 'default', className }: any) => (
    <BaseBadge variant={variant} className={cn("rounded-full font-black uppercase text-[10px] px-2.5", className)}>
        {label}
    </BaseBadge>
)

/**
 * An interactive accordion for collapsible content.
 */
export const GenAccordion = ({ items = [], title, className }: any) => (
    <div className={cn("w-full bg-primary/[0.01] rounded-2xl p-6 border border-border/50", className)}>
        {title && <h3 className="text-xl font-black mb-6 tracking-tighter uppercase opacity-50">{title}</h3>}
        <Accordion type="single" collapsible className="w-full">
            {items.map((item: any, idx: number) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border-border/50">
                    <AccordionTrigger className="text-sm font-bold hover:no-underline">
                        <div className="flex items-center gap-3">
                            {item.icon && renderIcon(item.icon, { className: "h-4 w-4 text-primary" })}
                            {item.title}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2">
                        {item.content}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    </div>
)

/**
 * A clean user avatar component.
 */
export const GenAvatar = ({ src, fallback, name, subtext, className }: any) => (
    <div className={cn("flex items-center gap-4 p-4 bg-primary/[0.02] rounded-2xl border border-border/50", className)}>
        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            <AvatarImage src={src} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{fallback || name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight">{name}</span>
            {subtext && <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">{subtext}</span>}
        </div>
    </div>
)

/**
 * A high-level tabs container for complex layouts.
 */
export const GenTabs = ({ items = [], defaultValue, className }: any) => (
    <Tabs defaultValue={defaultValue || items[0]?.value} className={cn("w-full", className)}>
        <TabsList className="w-full bg-muted/40 p-1 rounded-xl mb-6">
            {items.map((item: any) => (
                <TabsTrigger key={item.value} value={item.value} className="flex-1 rounded-lg font-bold text-xs capitalize">
                    {item.label}
                </TabsTrigger>
            ))}
        </TabsList>
        {items.map((item: any) => (
            <TabsContent key={item.value} value={item.value} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {item.content}
            </TabsContent>
        ))}
    </Tabs>
)
