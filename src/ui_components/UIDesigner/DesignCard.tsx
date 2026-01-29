import { Edit2, Trash2, Calendar, MessageSquare, Palette, Globe, Settings2, Loader2 } from 'lucide-react';
import { type UIDesign, TEMPLATES } from './types';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface DesignCardProps {
    design: UIDesign;
    onEdit: (design: UIDesign) => void;
    onDelete: (id: string) => void;
}

export default function DesignCard({ design, onEdit, onDelete }: DesignCardProps) {
    // Find template definition to get preview icon/style
    const template = TEMPLATES.find(t => t.id === design.template_id) || TEMPLATES[0];
    const themeColor = design.theme_color.toLowerCase();

    // Format date
    const lastUpdated = new Date(design.updated_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white dark:bg-white/5 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-[#f97316]/50 transition-all duration-500 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-2xl hover:shadow-orange-500/10"
        >
            <div className="p-8 pb-4 flex-1 flex flex-col">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div 
                        className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 duration-500"
                        style={{ backgroundColor: `${design.theme_color}15`, color: design.theme_color }}
                    >
                        <Palette className="h-7 w-7" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 transparent rounded-full">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                    </div>
                </div>

                {/* Title & Badge */}
                <div className="flex flex-col gap-3 mb-6">
                    <h3 className={`text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase line-clamp-1 group-hover:text-[${design.theme_color}] transition-colors`}>
                        {design.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div 
                            className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5"
                            style={{ backgroundColor: `${design.theme_color}10`, color: design.theme_color }}
                        >
                            {template.name}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2 mb-6 uppercase tracking-widest text-[11px]">
                    {design.description || "Customized chat interface for intelligent workflows."}
                </p>

                {/* Meta Stats */}
                <div className="flex items-center gap-6 py-6 border-t border-slate-100 dark:border-white/5 mt-auto">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">CHAT UI</span>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2 mt-4">
                    <button
                        onClick={() => onEdit(design)}
                        className="flex-1 h-14 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        style={{ backgroundColor: themeColor }}
                    >
                        <Settings2 className="h-4 w-4" />
                        Edit Style
                    </button>
                    <button
                        onClick={() => onDelete(design.id)}
                        className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
