import { TemplateGallery, type TemplateGalleryHandle } from '../Automation/components/TemplateGallery';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Layout, RefreshCw } from 'lucide-react';
import { useState, useRef } from 'react';

export default function Templates() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const galleryRef = useRef<TemplateGalleryHandle>(null);

    const handleRefresh = () => {
        galleryRef.current?.refresh();
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] p-2 overflow-hidden rounded-2xl border border-border shadow-2xl bg-background">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-linear-to-br from-primary/20 to-primary/10">
                            <Layout className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                              Templates
                            </h1>
                            <p className="text-muted-foreground">
                              Manage your favorite templates here
                            </p>
                          </div>
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
