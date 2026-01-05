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
import { motion } from 'framer-motion';
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
  return { icon: ZapIcon, color: "bg-violet-600" };
};

export const TemplateGallery = forwardRef<TemplateGalleryHandle, TemplateGalleryProps>(({ 
  userId, 
  onSuccess, 
  hideTitle,
  onLoadingChange 
}, ref) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newAutomationName, setNewAutomationName] = useState("");
  const [isInstantiating, setIsInstantiating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Header Section */}
      {!hideTitle && (
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-2xl group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                  <SearchIcon className="h-4 w-4" />
               </div>
               <Input
                  placeholder="Search templates by name or description"
                  className="h-12 pl-12 pr-4 bg-muted/50 border-border focus:bg-background transition-all text-sm rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
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
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 pb-12">
        {isLoading ? (
          <div className={cn(viewMode === 'grid' ? "flex flex-wrap gap-4" : "flex flex-col gap-3")}>
            {[...Array(viewMode === 'grid' ? 8 : 10)].map((_, i) => (
              <div key={i} className={cn("p-6 bg-card border border-border/50 rounded-xl relative overflow-hidden", viewMode === 'grid' ? "h-[200px] w-[500px]" : "w-full h-[100px]")}>
                <div className={cn("space-y-4", viewMode === 'list' && "flex items-start justify-between gap-8 space-y-0")}>
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-5 w-3/4 bg-muted/20" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full bg-muted/20" />
                      <Skeleton className="h-3 w-5/6 bg-muted/20" />
                    </div>
                  </div>
                  {viewMode === 'list' && (
                    <Skeleton className="h-6 w-24 rounded-full bg-muted/20 shrink-0" />
                  )}
                </div>
                
                <div className={cn(
                  "flex items-center justify-between pt-6 border-t border-border/50",
                  viewMode === 'grid' ? "mt-4" : "mt-2"
                )}>
                  <div className="flex -space-x-2">
                     <Skeleton className="h-7 w-7 rounded-md bg-muted/20" />
                     <Skeleton className="h-7 w-7 rounded-md bg-muted/20" />
                     <Skeleton className="h-7 w-7 rounded-md bg-muted/20" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg bg-muted/20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className={cn(
            viewMode === 'grid' 
              ? "flex flex-wrap gap-4" 
              : "flex flex-col gap-3"
          )}>
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                layoutId={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTemplate(template)}
                className={cn(
                  "group relative flex flex-col justify-between p-6 bg-card border border-border/50 hover:border-border hover:bg-accent/40 rounded-xl cursor-pointer transition-all hover:shadow-xl overflow-hidden",
                  viewMode === 'grid' ? "h-[200px] w-[500px]" : "w-full h-auto"
                )}
              >
                <div className={cn("space-y-3", viewMode === 'list' && "flex items-start justify-between gap-8 space-y-0")}>
                  <div className="space-y-2">
                    <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-1 text-foreground">
                      {template.name}
                    </h3>
                    <p className={cn(
                      "text-xs text-muted-foreground leading-relaxed",
                      viewMode === 'grid' ? "line-clamp-2" : "line-clamp-1"
                    )}>
                      {template.description}
                    </p>
                  </div>
                  {template.created_at && (
                    <div className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                       <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{moment(template.created_at).format("DD MMMM YYYY, hh:mm:ss A")}</span>
                    </div>
                  )}
                </div>

                <div className={cn(
                  "flex items-center justify-between pt-4 border-t border-border/50",
                  viewMode === 'list' && "mt-4"
                )}>
                   <div className="flex -space-x-2">
                      {template.apps?.map((app, i) => {
                         const logo = getAppLogo(app);
                         if (logo) {
                           return (
                             <div 
                               key={i} 
                               className="h-7 w-7 rounded-md flex items-center justify-center border border-border bg-background p-1 relative z-10 shadow-sm transition-transform hover:-translate-y-0.5"
                               title={app}
                             >
                               <img src={logo} alt={app} className="h-full w-full object-contain" />
                             </div>
                           );
                         }
                         
                         const fallback = getFallbackIcon(app);
                         return (
                           <div 
                             key={i} 
                             className={cn(
                               "h-7 w-7 rounded-md flex items-center justify-center border relative z-10 shadow-sm transition-transform hover:-translate-y-0.5", 
                               fallback.color
                             )}
                             title={app}
                           >
                             <HugeiconsIcon icon={fallback.icon} className="h-3.5 w-3.5 text-white" />
                           </div>
                         );
                      })}
                   </div>
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }}
                     whileHover={{ opacity: 1, x: 0 }}
                     className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center text-background shadow-lg"
                   >
                      <ArrowRight className="h-4 w-4" />
                   </motion.div>
                </div>

                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
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
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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