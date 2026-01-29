import React from 'react';
import { cn } from "@/lib/utils";
import { Copy, Code } from 'lucide-react';

interface SupportDetailsProps {
    data: Record<string, any>;
    title?: string;
    className?: string;
}

export const SupportDetails: React.FC<SupportDetailsProps> = ({ data, title, className }) => {
    const [showRawJson, setShowRawJson] = React.useState(false);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

    const safeStringify = (obj: any, space: number = 2) => {
        const cache = new Set();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                    return '[Circular]';
                }
                cache.add(value);
            }
            return value;
        }, space);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(safeStringify(data));
    };

    const isStatusKey = (key: string) => 
        ['status', 'agent_name', 'is_active', 'active'].includes(key.toLowerCase());

    const isLongTextField = (key: string) => 
        ['output', 'reason', 'description', 'instructions', 'output content'].includes(key.toLowerCase());

    const isBadgeValue = (key: string) =>
        ['agent_model', 'model'].includes(key.toLowerCase());

    const renderSubTable = (obj: Record<string, any>) => {
        const entries = Object.entries(obj).filter(([key]) => !key.startsWith('_'));
        
        return (
            <div className="mt-2 w-full max-w-[600px] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-white/2">
                <table className="w-full text-[11px]">
                    <thead className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                        <tr>
                            <th className="px-5 py-3 text-left font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider text-[10px]">Token Type</th>
                            <th className="px-5 py-3 text-left font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider text-[10px]">Count</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {entries.map(([k, v]) => {
                            const isTotal = k.toLowerCase() === 'totaltokens' || k.toLowerCase() === 'total';
                            return (
                                <tr key={k} className={cn(
                                    "transition-colors",
                                    isTotal ? "bg-primary/5 dark:bg-primary/10" : ""
                                )}>
                                    <td className="px-5 py-2.5 text-slate-500 dark:text-white/60 capitalize">
                                        {k.replace(/([A-Z])/g, ' $1').replace(/Tokens/i, '').trim()}
                                    </td>
                                    <td className={cn(
                                        "px-5 py-2.5 text-left font-bold break-all",
                                        isTotal ? "text-primary" : "text-slate-800 dark:text-white/80"
                                    )}>
                                        {typeof v === 'number' 
                                            ? v.toLocaleString() 
                                            : typeof v === 'object' 
                                                ? safeStringify(v, 2) 
                                                : String(v)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderValue = (key: string, value: any) => {
        if (value === null || value === undefined) return <span className="text-slate-400 italic">N/A</span>;
        
        // Handle Arrays or nested objects that shouldn't be a full sub-table
        if (Array.isArray(value) || (typeof value === 'object' && value !== null && !isStatusKey(key) && !isLongTextField(key) && !isBadgeValue(key))) {
            // Check if it's a simple object that should use renderSubTable (handled below)
            // But if it's an array, stringify it nicely
            if (Array.isArray(value)) {
                return (
                    <div className="mt-1 p-3 rounded-xl bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 overflow-x-auto max-h-48 overflow-y-auto">
                        <pre className="text-[11px] font-mono whitespace-pre-wrap break-all text-slate-500 dark:text-white/40">
                            {safeStringify(value, 2)}
                        </pre>
                    </div>
                );
            }
            
            // If it's a non-array object, we might want to use renderSubTable
            // However, the previous logic handled this. Let's keep it consistent.
            if (!Array.isArray(value) && typeof value === 'object') {
                return renderSubTable(value);
            }
        }

        if (isStatusKey(key)) {
            return (
                <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                    <span className="text-slate-600 dark:text-white/70">{String(value)}</span>
                </div>
            );
        }

        if (isLongTextField(key)) {
            return (
                <div className="p-5 rounded-2xl bg-teal-50/30 dark:bg-teal-500/5 border border-teal-100/50 dark:border-teal-500/10 text-[13px] leading-relaxed text-slate-600 dark:text-white/70">
                    {String(value)}
                </div>
            );
        }

        if (isBadgeValue(key)) {
            return (
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-[12px] font-mono text-slate-500 dark:text-white/50 border border-slate-200/50 dark:border-white/5">
                    {String(value)}
                </span>
            );
        }

        if (typeof value === 'boolean') return (
            <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                value ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
            )}>
                {value ? 'True' : 'False'}
            </span>
        );

        return <span className="text-slate-600 dark:text-white/70">{String(value)}</span>;
    };

    const entries = Object.entries(data).filter(([key]) => !key.startsWith('_'));

    return (
        <div className={cn("my-6 w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0c0c0c]/80 backdrop-blur-xl shadow-2xl", className)}>
            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black text-slate-400/80 dark:text-white/20 uppercase tracking-[0.2em]">
                        {title || "Record Details"}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowRawJson(!showRawJson)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                            showRawJson 
                                ? "bg-primary/10 text-primary border-primary/20" 
                                : "bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
                        )}
                    >
                        <Code size={12} />
                        {showRawJson ? "Show UI" : "Show JSON"}
                    </button>
                    <button 
                        onClick={handleCopy}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-all hover:scale-110 active:scale-95"
                    >
                        <Copy size={16} />
                    </button>
                </div>
            </div>

            <div className="p-0">
                {showRawJson ? (
                    <div className="p-8 bg-slate-50/30 dark:bg-black/20">
                        <pre className="text-[12px] font-mono whitespace-pre-wrap break-all text-slate-600 dark:text-white/50 leading-relaxed">
                            {safeStringify(data, 2)}
                        </pre>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                        {entries.map(([key, value]) => (
                            <div key={key} className="px-8 py-5 group flex flex-col md:flex-row md:items-start gap-4 transition-colors hover:bg-slate-50/30 dark:hover:bg-white/1">
                                <div className="md:w-64 shrink-0 pt-0.5">
                                    <span className="text-[10px] font-black text-slate-400/80 dark:text-white/30 uppercase tracking-widest leading-none">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="text-[13px] font-medium w-full">
                                    {renderValue(key, value)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
