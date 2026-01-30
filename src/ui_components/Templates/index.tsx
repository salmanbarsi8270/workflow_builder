import { TemplateGallery, type TemplateGalleryHandle } from '../Automation/components/TemplateGallery';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Layout, RefreshCw, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export default function Templates() {
    const { user } = useUser();
    const { accentColor } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const galleryRef = useRef<TemplateGalleryHandle>(null);

    const handleRefresh = () => {
        galleryRef.current?.refresh();
    };

    return (
        <div className="min-h-full bg-transparent text-slate-900 dark:text-white overflow-y-auto relative animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />
            
            <div className="relative z-10 p-8 w-full flex flex-col min-h-full">
                <div className="mb-4 animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                        <div className="flex-1">
                            <div className="mb-6">
                                <div className="items-center gap-4 mb-3">
                                    <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                                        Templates
                                    </h1>
                                    <div 
                                        className="h-1.5 w-12 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]" 
                                        style={{ backgroundColor: accentColor }}
                                    />
                                </div>
                            </div>
                            
                            <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                                Browse and manage your favorite workflow templates. Jumpstart your automation process with pre-built solutions.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="h-14 w-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                            >
                                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pt-4">
                    <TemplateGallery ref={galleryRef} userId={user?.id || ""} onLoadingChange={setIsLoading}/>
                </div>
            </div>
        </div>
    );
}
