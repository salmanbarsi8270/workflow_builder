import { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, SearchIcon, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from "@hugeicons/react";
import { SlackIcon, GithubIcon, ZapIcon, DiscordIcon, TiktokIcon, WhatsappIcon, TelegramIcon, SmartPhoneIcon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppLogoMap } from '../utils/Applogo';
import moment from "moment-timezone";

interface Template {
  id: string;
  name: string;
  description: string;
  category?: string;
  apps?: string[];
  savings?: string;
  created_at?: string;
}

export interface TemplateGalleryHandle {
  refresh: () => void;
}

interface TemplateGalleryProps {
  userId: string;
  onSuccess?: (flowId: string) => void;
  hideTitle?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  viewMode1?: boolean
}

const getAppLogo = (appName: string) => {
  const lower = appName.toLowerCase();
  
  // Try to find in AppLogoMap first
  for (const [key, value] of Object.entries(AppLogoMap)) {
    if (lower.includes(key)) return value;
  }

  // Handle aliases
  if (lower.includes('gmail') || lower.includes('google mail')) return AppLogoMap['gmail'];
  if (lower.includes('sheet')) return AppLogoMap['sheets'];
  if (lower.includes('doc')) return AppLogoMap['docs'];
  if (lower.includes('drive')) return AppLogoMap['drive'];
  if (lower.includes('excel')) return AppLogoMap['excel'];
  if (lower.includes('word')) return AppLogoMap['word'];
  if (lower.includes('onenote') || lower.includes('onedrive')) return AppLogoMap['onedrive'];
  if (lower.includes('http')) return AppLogoMap['http'];
  if (lower.includes('delay') || lower.includes('wait')) return AppLogoMap['wait'];
  
  return null;
};

// Fallback for icons not in AppLogoMap
const getFallbackIcon = (appName: string) => {
  const lower = appName.toLowerCase();
  if (lower.includes('slack')) return { icon: SlackIcon, color: "bg-[#4A154B]" };
  if (lower.includes('github')) return { icon: GithubIcon, color: "bg-[#181717]" };
  if (lower.includes('discord')) return { icon: DiscordIcon, color: "bg-[#5865F2]" };
  if (lower.includes('whatsapp')) return { icon: WhatsappIcon, color: "bg-[#25D366]" };
  if (lower.includes('telegram')) return { icon: TelegramIcon, color: "bg-[#0088cc]" };
  if (lower.includes('tiktok')) return { icon: TiktokIcon, color: "bg-black" };
  if (lower.includes('twilio')) return { icon: SmartPhoneIcon, color: "bg-[#F22F46]" };
  return { icon: ZapIcon, color: "bg-blue-600" };
};

export const TemplateGallery = forwardRef<TemplateGalleryHandle, TemplateGalleryProps>(({ 
  userId, 
  onSuccess, 
  hideTitle,
  onLoadingChange ,
  viewMode1
}, ref) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newAutomationName, setNewAutomationName] = useState("");
  const [isInstantiating, setIsInstantiating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(viewMode1 ? "list" : "grid");

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/templates`, {
        withCredentials: true
      });
      // response.data is now the array directly based on user feedback
      const fetchedTemplates = Array.isArray(response.data) ? response.data : 
                               (response.data.data || []);
      
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchTemplates
  }));

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (selectedTemplate) {
      setNewAutomationName(`My ${selectedTemplate.name}`);
      setIsDialogOpen(true);
    }
  }, [selectedTemplate]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTemplate(null);
    setNewAutomationName("");
  };

  const handleInstantiate = async () => {
    if (!selectedTemplate) return;
    if (!newAutomationName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsInstantiating(true);
    try {
      const response = await axios.post(`${API_URL}/api/templates/${selectedTemplate.id}/instantiate`, {
        name: newAutomationName,
        userId: userId
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success("Automation created!");
        const newId = response.data.data?.id;
        setIsDialogOpen(false);
        if (onSuccess) {
          onSuccess(newId);
        } else if (newId) {
          navigate(`/automation/${newId}`);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create automation");
    } finally {
      setIsInstantiating(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [templates, searchQuery]);

  return (
    <div className={cn(
      "flex flex-col h-full bg-transparent text-slate-900 dark:text-white",
      hideTitle ? "px-0" : ""
    )}>
      {/* Header Section */}
      {!hideTitle && (
        <div className={cn("pt-8 pb-4", hideTitle ? "px-4" : "px-8")}>
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-2xl group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                  <SearchIcon className="h-4 w-4" />
               </div>
               <Input
                  placeholder="Search templates..."
                  className="h-10 pl-10 pr-4 bg-muted/50 border-border focus:bg-background transition-all text-sm rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            {!hideTitle && (
              <div className="flex items-center gap-2 ml-4">
                 <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-10 w-10 text-muted-foreground", viewMode === 'grid' && "bg-secondary text-foreground")}
                    onClick={() => setViewMode('grid')}
                 >
                    <LayoutGrid className="h-4 w-4" />
                 </Button>
                 <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-10 w-10 text-muted-foreground", viewMode === 'list' && "bg-secondary text-foreground")}
                    onClick={() => setViewMode('list')}
                 >
                    <List className="h-4 w-4" />
                 </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={cn("flex-1 overflow-y-auto pb-12 pt-6", hideTitle ? "px-4" : "px-8")}>
        {isLoading ? (
          <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3")}>
            {[...Array(viewMode === 'grid' ? 6 : 10)].map((_, i) => (
              <div key={i} className={cn("overflow-hidden bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 p-6 space-y-4 rounded-xl relative", viewMode === 'grid' ? "h-[220px] w-full" : "w-full h-[100px]")}>
                <div className={cn("space-y-4", viewMode === 'list' && "flex items-start justify-between gap-8 space-y-0")}>
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-5 w-3/4 bg-slate-200 dark:bg-white/10" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full bg-slate-200 dark:bg-white/10" />
                      <Skeleton className="h-3 w-5/6 bg-slate-200 dark:bg-white/10" />
                    </div>
                  </div>
                  {viewMode === 'list' && (
                    <Skeleton className="h-6 w-24 rounded-full bg-gray-200 shrink-0" />
                  )}
                </div>
                
                <div className={cn(
                  "flex items-center justify-between pt-6 border-t border-border/50",
                  viewMode === 'grid' ? "mt-4" : "mt-2"
                )}>
                  <div className="flex -space-x-2">
                     <Skeleton className="h-7 w-7 rounded-md bg-slate-200 dark:bg-white/10" />
                     <Skeleton className="h-7 w-7 rounded-md bg-slate-200 dark:bg-white/10" />
                     <Skeleton className="h-7 w-7 rounded-md bg-slate-200 dark:bg-white/10" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" 
                  : "flex flex-col gap-3"
              )}
            >
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  layoutId={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                  onClick={() => setSelectedTemplate(template)}
                  className={cn(
                    "group relative cursor-pointer", // Wrapper for positioning
                    viewMode === 'grid' ? "h-[220px] w-full" : "w-full h-auto"
                  )}
                >
                 {/* Stabilized Hover Glow */}
                <div className={cn(
                    "absolute -inset-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-all duration-500"
                )} />

                <div className={cn(
                  "relative bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl dark:shadow-2xl group-hover:border-blue-500/30 transition-all duration-300 h-full flex flex-col justify-between overflow-hidden",
                )}>
                  <div className={cn("space-y-3", viewMode === 'list' && "flex items-start justify-between gap-8 space-y-0")}>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300 line-clamp-1">
                        {template.name}
                      </h3>
                      <p className={cn(
                        "text-xs text-slate-500 dark:text-slate-400 leading-relaxed",
                        viewMode === 'grid' ? "line-clamp-3" : "line-clamp-1"
                      )}>
                        {template.description}
                      </p>
                    </div>
                    {template.created_at && (
                       <div className="inline-flex mt-1 items-center px-2 py-1 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-xs font-mono text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 shrink-0">
                         {moment(template.created_at).format("DD MMM YYYY")}
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "flex items-center justify-between pt-4 mt-auto",
                    viewMode === 'list' && "mt-0 pt-0" // Adjust for list view
                  )}>
                     <div className="flex -space-x-2">
                        {template.apps?.map((app, i) => {
                           const logo = getAppLogo(app);
                           if (logo) {
                             return (
                               <div 
                                 key={i} 
                                 className="h-8 w-8 rounded-xl flex items-center justify-center border border-white dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 relative z-10 shadow-sm transition-transform hover:-translate-y-1 hover:z-20"
                                 title={app}
                               >
                                 <img 
                                     src={logo} 
                                     alt={app} 
                                     className={cn(
                                         "h-full w-full object-contain",
                                         ['wait', 'delay', 'utility', 'agent'].some(k => app.toLowerCase().includes(k)) && "invert dark:invert-0"
                                     )} 
                                 />
                               </div>
                             );
                           }
                           
                           const fallback = getFallbackIcon(app);
                           return ( 
                             <div 
                               key={i} 
                               className={cn(
                                 "h-8 w-8 rounded-xl flex items-center justify-center border border-white dark:border-slate-800 relative z-10 shadow-sm transition-transform hover:-translate-y-1 hover:z-20", 
                                 fallback.color
                               )}
                               title={app}
                             >
                               <HugeiconsIcon icon={fallback.icon} className="h-4 w-4 text-white" />
                             </div>
                           );
                        })}
                     </div>
                     <motion.div 
                       className="h-8 w-8 rounded-full bg-blue-100 dark:bg-white/10 flex items-center justify-center text-blue-600 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                     >
                        <ArrowRight className="h-4 w-4" />
                     </motion.div>
                  </div>
                </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
             <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center border border-border text-muted-foreground">
                <SearchIcon className="h-8 w-8" />
             </div>
             <div>
                <h3 className="text-base font-bold text-foreground">No results found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                   We couldn't find any templates for "{searchQuery}". Try broadening your search.
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Instantiate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Give it a name</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Personalize your new <strong>{selectedTemplate?.name}</strong> automation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <Input
                value={newAutomationName}
                onChange={(e) => setNewAutomationName(e.target.value)}
                placeholder="Marketing Campaign Automation"
                className="bg-muted focus:bg-background border-border h-11"
                autoFocus
             />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCloseDialog} className="hover:bg-accent text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button 
              onClick={handleInstantiate} 
              disabled={isInstantiating}
              className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all duration-300"
            >
              {isInstantiating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default TemplateGallery;