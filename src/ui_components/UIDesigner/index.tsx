import { useState, useEffect } from 'react';
import { Plus, Search, Palette, Loader2 } from 'lucide-react';
import type { UIDesign } from './types';
import DesignCard from './DesignCard';
import CreateDesignDialog from './CreateDesignDialog';
import { API_URL } from "../api/apiurl";
import { useTheme } from "@/components/theme-provider";

interface UIDesignerProps {
    userId: string;
}


export default function UIDesigner({ userId }: UIDesignerProps) {
    const { accentColor } = useTheme();
    const [designs, setDesigns] = useState<UIDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingDesign, setEditingDesign] = useState<UIDesign | null>(null);

    // Fetch designs from API
    const fetchDesigns = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/v1/ui-designs?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch designs');
            const data = await response.json();
            setDesigns(data);
        } catch (error) {
            console.error('Error fetching UI designs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesigns();
    }, [userId]);

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this design?')) return;

        try {
            const response = await fetch(`${API_URL}/api/v1/ui-designs/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete design');
            setDesigns(designs.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting design:', error);
            alert('Failed to delete design');
        }
    };

    // Handle edit
    const handleEdit = (design: UIDesign) => {
        setEditingDesign(design);
        setCreateDialogOpen(true);
    };

    // Handle create success
    const handleSuccess = () => {
        setCreateDialogOpen(false);
        setEditingDesign(null);
        fetchDesigns();
    };

    // Filter designs by search query
    const filteredDesigns = designs.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-full bg-transparent text-slate-900 dark:text-white overflow-y-auto relative animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

            <div className="relative w-full max-w-[90%] mx-auto z-10 p-8 h-full flex flex-col gap-8">
                {/* Header Redesign to match Support style */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex-1">
                        <div className="mb-6">
                            <div className="items-center gap-4 mb-3">
                                <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                                    UI Designer
                                </h1>
                                <div 
                                    className="h-1.5 w-12 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]" 
                                    style={{ backgroundColor: accentColor }}
                                />
                            </div>
                        </div>
                        
                        <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                            Create and manage custom chat UI designs for your agents. Customize colors, components, and layouts to match your brand identity.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[300px]">
                        <button
                            onClick={() => {
                                setEditingDesign(null);
                                setCreateDialogOpen(true);
                            }}
                            className="h-14 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
                            style={{ backgroundColor: accentColor, boxShadow: `${accentColor}33 0px 8px 16px` }}
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            Create New Design
                        </button>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#f97316] transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH DESIGNS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 transition-all"
                                style={{ '--tw-ring-color': `${accentColor}33` } as React.CSSProperties}
                            />
                        </div>
                    </div>
                </div>

                {/* Designs Grid */}
                <div className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="p-4 rounded-3xl bg-[#f97316]/10 text-[#f97316] animate-pulse">
                            <Palette className="h-10 w-10" />
                        </div>
                        <div className="flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 dark:text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin text-[#f97316]" />
                            Loading Designs...
                        </div>
                    </div>
                ) : filteredDesigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/5 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-white/5 group transition-all">
                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600 mb-6 group-hover:scale-110 transition-transform">
                            <Palette className="h-16 w-16" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
                            {searchQuery ? 'No designs found' : 'No designs yet'}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-8 uppercase tracking-widest text-center max-w-md">
                            {searchQuery
                                ? 'Try a different search term or clear the filter.'
                                : 'Create your first custom UI design to get started.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setCreateDialogOpen(true)}
                                className="h-14 px-8 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                                style={{ backgroundColor: accentColor }}
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                Create Your First Design
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDesigns.map((design) => (
                            <DesignCard
                                key={design.id}
                                design={design}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
                </div>

                {/* Create/Edit Dialog */}
                <CreateDesignDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    userId={userId}
                    initialDesign={editingDesign}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
}
