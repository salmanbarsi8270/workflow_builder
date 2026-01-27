"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export const CalendarCard = ({
    selectedDate,
    onSelect,
    title,
    className,
    mode = "single"
}: any) => {
    const [date, setDate] = React.useState<Date | undefined>(selectedDate ? new Date(selectedDate) : new Date());

    const handleSelect = (newDate: Date | undefined) => {
        setDate(newDate);
        if (onSelect) onSelect(newDate);
    }

    return (
        <div className={cn("w-full bg-primary/[0.01] rounded-2xl overflow-hidden shadow-sm border border-border/50", className)}>
            {title && (
                <div className="px-6 py-4 border-b bg-primary/[0.02]">
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                </div>
            )}
            <div className="p-4 flex justify-center">
                <Calendar
                    mode={mode}
                    selected={date}
                    onSelect={handleSelect}
                    className="rounded-md border-none"
                />
            </div>
        </div>
    )
}
