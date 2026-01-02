import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WaitNode = ({ data }: any) => {
    const isSelected = data.selected;
    const label = data.label || 'Wait';
    const subLabel = data.subLabel || (data.params?.waitType === 'approval' ? 'Wait for Approval' : 'Delay');
    
    // Status Styles (Consistent with CustomNode)
    const statusColor = 
        data.status === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
        data.status === 'running' ? 'border-blue-500 ring-2 ring-blue-500/20' :
        data.status === 'waiting' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' :
        data.status === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
        data.status === 'skipped' ? 'border-gray-200 opacity-60' :
        isSelected ? 'border-primary ring-2 ring-primary/20' : 
        'border-border bg-card';

    return (
        <Card className={`min-w-[280px] shadow-sm transition-all duration-200 ${statusColor}`}>
           <Handle type="target" position={Position.Top} className="bg-muted-foreground! w-3 h-3" />
           
           <CardHeader className="p-3 pb-2 flex flex-row items-center space-y-0 gap-2">
                <div className={`p-2 rounded-md ${
                    data.status === 'waiting' ? 'bg-orange-100 text-orange-600 animate-pulse' : 
                    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                    <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <CardTitle className="text-sm font-semibold leading-none tracking-tight">{label}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {subLabel}
                        {data.params?.waitType === 'delay' && data.params?.delayDuration && (
                            <span className="ml-1 font-semibold">({data.params.delayDuration} {data.params.delayUnit || 's'})</span>
                        )}
                    </p>
                </div>
                {data.status && (
                    <Badge variant={data.status === 'success' ? 'default' : 'secondary'} className={`ml-auto capitalize text-[10px] h-5 px-1.5 
                        ${data.status === 'success' ? 'bg-green-500 hover:bg-green-600' : 
                          data.status === 'waiting' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                    `}>
                        {data.status}
                    </Badge>
                )}
           </CardHeader>

           <CardContent className="p-3 pt-0">
               {/* Optional Visualization */}
           </CardContent>

           <Handle type="source" position={Position.Bottom} className="bg-muted-foreground! w-3 h-3" />
        </Card>
    );
};

export default memo(WaitNode);
