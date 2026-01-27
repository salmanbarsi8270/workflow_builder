import { cn } from '@/lib/utils';
import { Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export const CodeCard = ({ code, title, language = 'json', className }: any) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        toast.success("Copied to clipboard");
    };

    return (
        <div className={cn("flex flex-col rounded-2xl overflow-hidden border border-border/50 bg-[#0D1117] shadow-lg", className)}>
            <div className="flex items-center justify-between px-4 py-2 bg-[#161B22] border-b border-border/20">
                <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{title || language}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-white"
                >
                    <Copy className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar">
                <pre className="text-xs font-mono text-blue-300/90 leading-relaxed">
                    {code}
                </pre>
            </div>
        </div>
    );
};
