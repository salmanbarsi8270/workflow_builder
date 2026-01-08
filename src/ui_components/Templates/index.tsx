import { TemplateGallery, type TemplateGalleryHandle } from '../Automation/components/TemplateGallery';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Layout, RefreshCw, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';

export default function Templates() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const galleryRef = useRef<TemplateGalleryHandle>(null);

    const handleRefresh = () => {
        galleryRef.current?.refresh();
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] p-2 bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white relative overflow-hidden">
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4 p-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {/* Stabilized Glow */}
                        <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-20" />
                        <div className="relative bg-linear-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-xl">
                            <Layout className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-5xl font-black bg-linear-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-2">
                            Templates
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-blue-200/70 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Manage your favorite templates here
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>
            <TemplateGallery ref={galleryRef} userId={user?.id || ""} onLoadingChange={setIsLoading}/>
        </motion.div>
    );
}
