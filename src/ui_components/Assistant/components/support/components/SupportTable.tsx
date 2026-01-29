import React from 'react';
import { cn } from "@/lib/utils";
import { Download, Copy, Search, Filter } from 'lucide-react';

interface SupportTableProps {
    data: any[];
    title?: string;
    className?: string;
    columns?: { key: string; label: string }[];
}

export const SupportTable: React.FC<SupportTableProps> = ({ data, title, className, columns }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    
    if (!Array.isArray(data) || data.length === 0) return null;

    // Use provided columns or infer from first row
    const headers = columns ? columns.map(c => c.key) : Object.keys(data[0]);
    const headerLabels = columns ? columns.reduce((acc, c) => ({ ...acc, [c.key]: c.label }), {} as Record<string, string>) : null;

    // Filter data based on search term
    const filteredData = data.filter(row => 
        headers.some(header => 
            String(row[header]).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const getTriggerStyle = (trigger: string) => {
        const t = trigger.toUpperCase();
        if (t.includes('HTTP')) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        if (t.includes('EMAIL')) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
        if (t.includes('CRON')) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
        if (t.includes('WEBHOOK')) return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        return "bg-teal-500/10 text-teal-500 border-teal-500/20";
    };

    const handleExportCSV = () => {
        if (!data.length) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `automations_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = () => {
        const text = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    return (
        <div className={cn("my-6 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0c0c0c]/80 backdrop-blur-xl shadow-xl", className)}>
            {/* Table Header with Search */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Filter size={16} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-bold text-slate-800 dark:text-white/90 uppercase tracking-tight">
                            {title || "Dynamic Dataset"}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-white/30 uppercase tracking-widest">
                            Showing {filteredData.length} of {data.length} entries
                        </p>
                    </div>
                </div>
                
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={14} />
                    <input 
                        type="text"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/10"
                    />
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md">
                            {headers.map((header) => (
                                <th 
                                    key={header} 
                                    className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest"
                                >
                                    {headerLabels ? headerLabels[header] : header.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {filteredData.map((row, i) => (
                            <tr 
                                key={i} 
                                className="hover:bg-primary/5 transition-colors group"
                            >
                                {headers.map((header) => {
                                    const value = row[header];
                                    const hLower = header.toLowerCase();
                                    
                                    if (hLower === 'trigger') {
                                        return (
                                            <td key={header} className="px-6 py-4">
                                                <div className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border",
                                                    getTriggerStyle(String(value))
                                                )}>
                                                    {value}
                                                </div>
                                            </td>
                                        );
                                    }

                                    if (hLower === 'path' || hLower === 'id' || hLower.includes('uuid')) {
                                        return (
                                            <td key={header} className="px-6 py-4">
                                                <span className="text-[11px] font-mono text-slate-500 dark:text-white/30 truncate max-w-[120px] block" title={String(value)}>
                                                    {String(value)}
                                                </span>
                                            </td>
                                        );
                                    }

                                    if (hLower === 'status') {
                                        const statusStr = String(value).toLowerCase();
                                        const isActive = statusStr.includes('active') || statusStr.includes('success') || statusStr === 'on';
                                        const isError = statusStr.includes('error') || statusStr.includes('failed');
                                        
                                        return (
                                            <td key={header} className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                                                        isError ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                                        "bg-slate-300 dark:bg-white/20"
                                                    )} />
                                                    <span className={cn(
                                                        "text-xs font-bold uppercase tracking-tight",
                                                        isActive ? "text-emerald-500" : 
                                                        isError ? "text-red-500" :
                                                        "text-slate-400 dark:text-white/30"
                                                    )}>
                                                        {value}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    }

                                    const safeStringify = (obj: any) => {
                                        const cache = new Set();
                                        return JSON.stringify(obj, (_key, value) => {
                                            if (typeof value === 'object' && value !== null) {
                                                if (cache.has(value)) return '[Circular]';
                                                cache.add(value);
                                            }
                                            return value;
                                        });
                                    };

                                    return (
                                        <td key={header} className="px-6 py-4 font-bold text-slate-700 dark:text-white/80 min-w-[150px] max-w-[400px]">
                                            <div className="line-clamp-6 text-[12px] leading-relaxed wrap-break-word">
                                                {typeof value === 'object' ? 
                                                    <span className="text-[10px] font-mono text-primary/60">{safeStringify(value).substring(0, 50)}...</span> : 
                                                    String(value)
                                                }
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Table Actions */}
            <div className="p-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-white/60 hover:bg-white dark:hover:bg-white/5 transition-colors"
                    >
                        <Download size={14} />
                        Export CSV
                    </button>
                </div>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-white/30 hover:text-primary transition-colors"
                >
                    <Copy size={14} />
                    Copy to clipboard
                </button>
            </div>
        </div>
    );
};
