import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, X, Loader2, UserCircle } from "lucide-react";
import type { ConnectedAccount } from '../types';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConnectionListCardProps {
  account: ConnectedAccount;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}

export function ConnectionListCard({ account, onDelete, isDeleting }: ConnectionListCardProps) {
  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-0 shadow-xl dark:shadow-2xl group transition-all duration-300 h-full flex flex-col justify-between overflow-hidden hover:border-blue-500/30">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-8 flex-1">
            {/* Service Icon with Glow */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="h-20 w-20 rounded-[1.25rem] bg-white dark:bg-[#1e293b]/50 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500 relative z-10">
                <img 
                  src={account.serviceIcon} 
                  alt={account.serviceName} 
                  className="w-10 h-10 object-contain" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.serviceName)}&background=3b82f6&color=fff`;
                  }}
                />
              </div>
            </div>

            {/* Main Info Section */}
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xl">
                    {account.username}
                  </h4>
                  <Badge variant="outline" className="h-5 px-2 text-[9px] font-black uppercase tracking-widest rounded-md bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                  {account.serviceName}
                </Badge>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 bg-slate-900/5 dark:bg-black/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                    <UserCircle className="h-4 w-4 text-blue-500/70 shrink-0" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{account.externalId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Zap className="h-4 w-4 fill-current animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">{Math.floor(Math.random() * 40 + 60)}% POPULAR</span>
                  </div>
                </div>
              </div>

              {/* Usage Section */}
              <div className="flex flex-col gap-2 px-8 border-x border-slate-100 dark:border-white/5">
                 <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Active In</span>
                 <div className="flex -space-x-3">
                   {account.usage && account.usage.length > 0 ? (
                     account.usage.slice(0, 4).map((item, i) => (
                       <Tooltip key={i}>
                         <TooltipTrigger asChild>
                           <div 
                             className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative z-1"
                             style={{ zIndex: 10 - i }}
                           >
                             <div className={`h-full w-full rounded-full flex items-center justify-center ${item.type === 'flow' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                               {item.type === 'flow' ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                             </div>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p className='font-bold lowercase tracking-widest text-xs'><span className="font-bold uppercase tracking-widest">{item.type}</span>: {item.name}</p>
                         </TooltipContent>
                       </Tooltip>
                     ))
                   ) : (
                     <div className="h-10 flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-50">Inactive</div>
                   )}
                 </div>
              </div>

              {/* Action Button */}
              <div className="pl-6">
                <Button 
                  variant="outline" 
                  onClick={() => onDelete(account.id, account.username)} 
                  disabled={isDeleting}
                  className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-red-600 hover:border-red-600 text-white border-blue-600 font-black tracking-widest text-xs transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-red-500/30 group/btn uppercase"
                >
                   {isDeleting ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <span className="flex items-center gap-2 text-white">
                       <X className="h-4 w-4 transition-transform group-hover/btn:rotate-90" />
                       Disconnect
                     </span>
                   )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
