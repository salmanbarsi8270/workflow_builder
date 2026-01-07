import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { IntegrationApp } from './types';

export const StatusIndicator = ({ status, size = "sm" }: { status: IntegrationApp['connectionStatus']; size?: "sm" | "md" }) => {
  const sizeClasses = size === "sm" ? "h-2 w-2" : "h-3 w-3";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <div className={`
              ${status === 'healthy' ? 'bg-green-500 animate-pulse' : 
                status === 'warning' ? 'bg-yellow-500' : 
                status === 'error' ? 'bg-red-500' : 'bg-gray-500'} 
              ${sizeClasses} rounded-full ring-2 ring-background
            `} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {status === 'healthy' ? 'Connected' : 
             status === 'warning' ? 'Warning' : 
             status === 'error' ? 'Error' : 'Unknown'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
