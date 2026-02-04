
import { Edit2, Trash2, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { type UIDesign, TEMPLATES } from './types';

interface DesignCardProps {
    design: UIDesign;
    onEdit: (design: UIDesign) => void;
    onDelete: (id: string) => void;
    isDeleting?: boolean;
}

export default function DesignCard({ design, onEdit, onDelete, isDeleting = false }: DesignCardProps) {
    // Find template definition to get preview icon/style
    const template = TEMPLATES.find(t => t.id === design.template_id) || TEMPLATES[0];

    // Format date
    const lastUpdated = new Date(design.updated_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full">

            {/* Visual Preview Header */}
            <div
                className="h-32 relative flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: `${design.theme_color}15` }} // 10% opacity
            >
                <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:scale-110 transition-transform duration-300">
                    {/* If we had a real screenshot, we'd use preview_image_url. For now, use template emoji or stylized preview */}
                    <div className="text-6xl select-none filter drop-shadow-md">
                        {template.preview}
                    </div>
                </div>

                {/* Overlay Actions (visible on hover) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                        onClick={() => onEdit(design)}
                        className="p-2 bg-white text-slate-900 rounded-full hover:bg-blue-50 transition-colors"
                        title="Edit Design"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDelete(design.id)}
                        disabled={isDeleting}
                        className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete Design"
                    >
                        {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1" title={design.name}>
                        {design.name}
                    </h3>
                    <span
                        className="px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider"
                        style={{
                            backgroundColor: `${design.theme_color}20`,
                            color: design.theme_color
                        }}
                    >
                        {template.name.split(' ')[0]}
                    </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {design.description || "No description provided."}
                </p>

                {/* Footer Metadata */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{lastUpdated}</span>
                    </div>

                    <div className="flex items-center gap-1.5" title="Chat Interface">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat UI</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
