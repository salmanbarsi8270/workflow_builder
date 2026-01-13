import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Layout, Type, Save } from 'lucide-react';
import { type UIDesign } from './types';
import TemplateSelector from './TemplateSelector';
import ColorCustomizer from './ColorCustomizer';
import TextCustomizer from './TextCustomizer';
import LivePreview from './LivePreview';

interface CreateDesignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    initialDesign: UIDesign | null;
    onSuccess: () => void;
}

const DEFAULT_DESIGN: Partial<UIDesign> = {
    template_id: 'modern',
    theme_color: '#4dabf7',
    title: 'AI Assistant',
    subtitle: 'Online Now',
    welcome_message: 'Hello! How can I assist you?',
    input_placeholder: 'Type your message...',
    font_family: 'Inter, sans-serif',
    is_public: false
};

export default function CreateDesignDialog({
    open,
    onOpenChange,
    userId,
    initialDesign,
    onSuccess
}: CreateDesignDialogProps) {
    const [design, setDesign] = useState<Partial<UIDesign>>(DEFAULT_DESIGN);
    const [activeTab, setActiveTab] = useState('template');
    const [isSaving, setIsSaving] = useState(false);

    // Load initial design or reset to default
    useEffect(() => {
        if (open) {
            if (initialDesign) {
                setDesign(initialDesign);
            } else {
                setDesign({
                    ...DEFAULT_DESIGN,
                    user_id: userId,
                    name: `My Design ${new Date().toLocaleDateString()}`
                });
            }
        }
    }, [open, initialDesign, userId]);

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // Validate
            if (!design.name) {
                alert('Please provide a name for your design');
                return;
            }

            const url = initialDesign
                ? `/api/v1/ui-designs/${initialDesign.id}`
                : '/api/v1/ui-designs';

            const method = initialDesign ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...design, user_id: userId })
            });

            if (!response.ok) throw new Error('Failed to save design');

            onSuccess();
        } catch (error) {
            console.error('Error saving design:', error);
            alert('Failed to save design. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateDesign = (updates: Partial<UIDesign>) => {
        setDesign(prev => ({ ...prev, ...updates }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5/6 w-[1400px] h-[90vh] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            {initialDesign ? 'Edit Design' : 'Create New Design'}
                        </h2>
                        <input
                            type="text"
                            value={design.name || ''}
                            onChange={(e) => updateDesign({ name: e.target.value })}
                            placeholder="Design Name"
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Design'}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Customization Tools */}
                    <div className="w-[400px] border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <TabsList className="p-1 m-4 grid grid-cols-3 bg-slate-200 dark:bg-slate-800">
                                <TabsTrigger value="template" className="gap-2">
                                    <Layout className="w-4 h-4" /> Template
                                </TabsTrigger>
                                <TabsTrigger value="style" className="gap-2">
                                    <Palette className="w-4 h-4" /> Style
                                </TabsTrigger>
                                <TabsTrigger value="text" className="gap-2">
                                    <Type className="w-4 h-4" /> Text
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto px-6 py-2">
                                <TabsContent value="template" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Choose Template
                                        </h3>
                                        {/* File 5: TemplateSelector */}
                                        <TemplateSelector
                                            activeTemplateId={design.template_id || 'modern'}
                                            onSelect={(template) => updateDesign(template.defaultConfig)}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="style" className="mt-0 space-y-6">
                                    {/* File 6: ColorCustomizer */}
                                    <ColorCustomizer
                                        design={design}
                                        onChange={updateDesign}
                                    />
                                </TabsContent>

                                <TabsContent value="text" className="mt-0 space-y-6">
                                    {/* File 7: TextCustomizer */}
                                    <TextCustomizer
                                        design={design}
                                        onChange={updateDesign}
                                    />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* Right Main Area - Live Preview */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-8 overflow-hidden relative">
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #888 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                        </div>

                        {/* File 8: LivePreview */}
                        <LivePreview design={design} />

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
