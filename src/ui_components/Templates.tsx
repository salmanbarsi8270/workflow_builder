import { TemplateGallery } from './Automation/components/TemplateGallery';
import { useUser } from '@/context/UserContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HugeiconsIcon } from "@hugeicons/react";
import { Layout01Icon, Rocket01Icon } from "@hugeicons/core-free-icons";
import { motion } from 'framer-motion';

export default function Templates() {
    const { user } = useUser();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col gap-6 h-[calc(100vh-2rem)]"
        >
            {/* Minimal Header */}
            <div className="flex flex-col gap-2 pb-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                        <HugeiconsIcon icon={Layout01Icon} className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Template Gallery</h2>
                        <p className="text-muted-foreground text-base">
                            Jumpstart your automation with pre-built, production-ready workflows.
                        </p>
                    </div>
                </div>
            </div>

            <Card className="flex-1 border-none shadow-xl bg-background/40 backdrop-blur-xl ring-1 ring-border/50 overflow-hidden flex flex-col">
                <CardHeader className="pb-2 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                         <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <HugeiconsIcon icon={Rocket01Icon} className="h-5 w-5 text-violet-500" />
                                Recommended Blueprints
                            </CardTitle>
                            <CardDescription>
                                Browse and instantiate templates instantly. Search by name or description.
                            </CardDescription>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-6 min-h-0 overflow-hidden">
                    <TemplateGallery 
                        userId={user?.id || ""} 
                        gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start"
                        headerClassName="hidden" 
                        showNameInput={true}
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}
