import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Layout, Type, Save, Sparkles, Grid, Smartphone, Tablet, Monitor } from 'lucide-react';
import { type UIDesign } from './types';
import TemplateSelector from './TemplateSelector';
import ColorCustomizer from './ColorCustomizer';
import TextCustomizer from './TextCustomizer';
import ComponentCustomizer from './ComponentCustomizer';
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
    is_public: false,
    allow_file_uploads: false,
    show_header: true,
    show_agent_avatar: true,
    component_styles: {
        avatar_style: 'circle',
        input_style: 'pill',
        bubble_style: 'rounded',
        header_visible: true,
        chat_visible: true,
        input_visible: true,
        logo_visible: true,
        send_button: true
    }
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

    // AI Magic State
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const response = await fetch('/api/v1/ui-designs/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error('AI generation failed');

            const generatedDesign = await response.json();
            // Merge with current design but prioritize AI Output
            setDesign(prev => ({
                ...prev,
                ...generatedDesign
            }));

            // Switch to Style tab to show results (optional, or stay on AI tab)
            // setActiveTab('style');

        } catch (error) {
            console.error('Generation error:', error);
            alert('Failed to generate design');
        } finally {
            setIsGenerating(false);
        }
    };

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

    // Viewport State
    const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

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

                    {/* Viewport Toolbar (Centered in Header) */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Button
                            variant="ghost"
                            size="sm"
                            title="Mobile (375px)"
                            onClick={() => setViewport('mobile')}
                            className={`h-8 w-8 p-0 ${viewport === 'mobile' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <Smartphone className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            title="Tablet (768px)"
                            onClick={() => setViewport('tablet')}
                            className={`h-8 w-8 p-0 ${viewport === 'tablet' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <Tablet className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            title="Desktop (100%)"
                            onClick={() => setViewport('desktop')}
                            className={`h-8 w-8 p-0 ${viewport === 'desktop' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <Monitor className="w-4 h-4" />
                        </Button>
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
                    {/* Right Main Area - Live Preview (Now on Left) */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden relative">
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #888 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                        </div>

                        {/* Centered Preview Container with Scroll Handling */}
                        <div className="flex-1 overflow-auto relative">
                            <div className={`min-h-full w-full flex items-center justify-center ${viewport === 'desktop' ? 'p-0' : 'p-8'}`}>
                                <div
                                    className={`transition-all duration-300 ease-in-out relative bg-white dark:bg-slate-900 mx-auto
                                        ${viewport === 'mobile' ? 'w-[375px] h-[700px] shadow-2xl rounded-xl border-4 border-slate-900 dark:border-slate-700 shrink-0' : ''}
                                        ${viewport === 'tablet' ? 'w-[768px] h-[850px] shadow-2xl rounded-xl border-4 border-slate-900 dark:border-slate-700 shrink-0' : ''}
                                        ${viewport === 'desktop' ? 'w-[95%] h-[92%] shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800' : ''}
                                    `}
                                    style={viewport === 'desktop' ? { height: '92vh', maxHeight: '900px' } : undefined}
                                >
                                    <LivePreview design={design} />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Left Sidebar - Customization Tools (Now on Right) */}
                    <div className="w-[400px] border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                            <div className="px-4 pt-4 pb-2 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                                <TabsList className="w-full flex justify-start overflow-x-auto no-scrollbar bg-slate-200 dark:bg-slate-800 p-1 gap-1">
                                    <TabsTrigger value="ai" className="flex-shrink-0 gap-2 px-3">
                                        <Sparkles className="w-4 h-4 text-purple-500" /> Magic
                                    </TabsTrigger>
                                    <TabsTrigger value="template" className="flex-shrink-0 gap-2 px-3">
                                        <Layout className="w-4 h-4" /> Template
                                    </TabsTrigger>
                                    <TabsTrigger value="components" className="flex-shrink-0 gap-2 px-3">
                                        <Grid className="w-4 h-4" /> Components
                                    </TabsTrigger>
                                    <TabsTrigger value="style" className="flex-shrink-0 gap-2 px-3">
                                        <Palette className="w-4 h-4" /> Style
                                    </TabsTrigger>
                                    <TabsTrigger value="text" className="flex-shrink-0 gap-2 px-3">
                                        <Type className="w-4 h-4" /> Text
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                <TabsContent value="ai" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Generate with AI
                                        </h3>
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-lg">
                                            <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                                Describe your design
                                            </label>
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="e.g. A futuristic cyberpunk dashboard with neon green accents and dark mode..."
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 min-h-[100px] mb-3 text-sm"
                                            />
                                            <Button
                                                onClick={handleGenerate}
                                                disabled={isGenerating || !prompt.trim()}
                                                className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
                                            >
                                                {isGenerating ? (
                                                    <span className="flex items-center gap-2">Generating...</span>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        Generate Magic Design
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            AI will generate a color palette, fonts, and messages based on your description.
                                        </p>
                                    </div>
                                </TabsContent>

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

                                <TabsContent value="components" className="mt-0 space-y-6">
                                    <ComponentCustomizer
                                        design={design}
                                        onChange={updateDesign}
                                    />
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
