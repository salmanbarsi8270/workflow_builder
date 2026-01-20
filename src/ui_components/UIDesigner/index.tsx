import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import type { UIDesign } from './types';
import DesignCard from './DesignCard';
import CreateDesignDialog from './CreateDesignDialog';
import { API_URL } from '@/ui_components/api/apiurl';

interface UIDesignerProps {
    userId: string;
}

export default function UIDesigner({ userId }: UIDesignerProps) {
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
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            🎨 UI Designer
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Create and manage custom chat UI designs for your agents
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingDesign(null);
                            setCreateDialogOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Design
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search designs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Designs Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading designs...</p>
                </div>
            ) : filteredDesigns.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        {searchQuery ? 'No designs found' : 'No designs yet'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Create your first custom UI design to get started'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setCreateDialogOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Design
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* Create/Edit Dialog */}
            <CreateDesignDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                userId={userId}
                initialDesign={editingDesign}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
