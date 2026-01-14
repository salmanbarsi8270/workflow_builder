import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { VariablePicker } from "../Automation/components/VariablePicker"
import { type Node } from "@xyflow/react"
import { useState } from "react"
import { API_URL } from "@/ui_components/api/apiurl"
import { Check, Copy, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface HTTPFormProps {
    data: any;
    params: any;
    onChange: (params: any) => void;
    disabled?: boolean;
    nodes: Node[];
    edges?: any[];
    nodeId?: string;
    flowId?: string;
}

export default function HTTPForm({ data: nodeData, params, onChange, disabled, nodes, edges = [], nodeId, flowId }: HTTPFormProps) {
    const [copied, setCopied] = useState(false);

    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    const handleVariableSelect = (field: string, variable: string) => {
        const currentValue = params[field] || '';
        handleChange(field, currentValue + variable);
    };

    // WEBHOOK TRIGGER VIEW
    if (nodeData.actionId === 'webhook' || nodeData.action === 'webhook' || nodeData.trigger === 'webhook') {
        // Construct Webhook URL
        const isWorkerMode = params.executionMode !== 'direct'; // Default to true (Queue)
        const workerQuery = isWorkerMode ? '' : '?worker=false';
        const webhookUrl = flowId ? `${API_URL}/api/webhooks/${flowId}${workerQuery}` : 'Save workflow to generate URL';

        const handleCopy = () => {
            if (!flowId) {
                toast.error("Please save the workflow first");
                return;
            }
            navigator.clipboard.writeText(webhookUrl);
            setCopied(true);
            toast.success("Webhook URL copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        };

        const toggleMethod = (method: string) => {
            const currentMethods = Array.isArray(params.methods) ? params.methods : ['GET', 'POST'];
            if (currentMethods.includes(method)) {
                // Don't allow emptying the list completely? or allow it
                if (currentMethods.length === 1) return; // minimal one
                handleChange('methods', currentMethods.filter((m: string) => m !== method));
            } else {
                handleChange('methods', [...currentMethods, method]);
            }
        };

        return (
            <div className="space-y-6">
                {/* Execution Mode */}
                <div className="p-4 bg-muted/30 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            Execution Mode
                            {isWorkerMode ? (
                                <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20">Async / Queue</span>
                            ) : (
                                <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/20">Sync / Direct</span>
                            )}
                        </Label>
                        <Switch
                            checked={!isWorkerMode}
                            onCheckedChange={(checked) => handleChange('executionMode', checked ? 'direct' : 'queue')}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {isWorkerMode
                            ? "Requests are queued and processed in the background. Returns immediate success. Best for high volume."
                            : "Requests are processed immediately. The caller waits for the workflow to complete and receives the final result."}
                    </p>
                </div>

                {/* Allowed Methods */}
                <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                        Allowed Methods
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].map((method) => {
                            const isSelected = (Array.isArray(params.methods) ? params.methods : ['GET', 'POST']).includes(method);
                            return (
                                <div
                                    key={method}
                                    onClick={() => !disabled && toggleMethod(method)}
                                    className={`
                                        cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold border transition-all select-none
                                        ${isSelected
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                                        }
                                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {method}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 bg-muted/30 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Globe className="h-4 w-4" />
                        <h3>Webhook URL</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Send a request to this URL to trigger this workflow.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="relative flex-1">
                            <Input
                                value={webhookUrl}
                                readOnly
                                className="pr-10 font-mono text-xs bg-background"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopy}
                            className="shrink-0"
                            disabled={!flowId}
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                        Test Command (cURL)
                    </Label>
                    <div className="bg-slate-950 text-slate-50 p-3 rounded-md font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                        {`curl -X ${(Array.isArray(params.methods) ? params.methods[0] : 'POST')} "${webhookUrl}" \\
-H "Content-Type: application/json" \\
-d '{"message": "Hello from frontend"}'`}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Copy and run this in your terminal to test the trigger.
                    </p>
                </div>
            </div>
        );
    }

    // HTTP REQUEST ACTION VIEW
    return (
        <div className="flex flex-col gap-4">
            {/* Method */}
            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    Method <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={params.method || 'GET'}
                    onValueChange={(val) => handleChange('method', val)}
                    disabled={disabled}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* URL */}
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                        URL <span className="text-red-500">*</span>
                    </Label>
                    <VariablePicker
                        nodes={nodes}
                        edges={edges}
                        onSelect={(v: string) => handleVariableSelect('url', v)}
                        currentNodeId={nodeId}
                    />
                </div>
                <Input
                    value={params.url || ''}
                    onChange={(e) => handleChange('url', e.target.value)}
                    placeholder="https://api.your-api.com/endpoint"
                    disabled={disabled}
                    required
                />
            </div>

            {/* Headers */}
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                        Headers (JSON) <span className="text-red-500">*</span>
                    </Label>
                    <VariablePicker
                        nodes={nodes}
                        edges={edges}
                        onSelect={(v: string) => handleVariableSelect('headers', v)}
                        currentNodeId={nodeId}
                    />
                </div>
                <Textarea
                    value={typeof params.headers === 'string' ? params.headers : JSON.stringify(params.headers, null, 2) || ''}
                    onChange={(e) => handleChange('headers', e.target.value)}
                    placeholder='{ "Authorization": "Bearer 123" }'
                    className="font-mono text-xs min-h-[100px]"
                    disabled={disabled}
                    required
                />
            </div>

            {/* Body */}
            {(params.method !== 'GET' && params.method !== 'DELETE') && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                            Body (JSON) <span className="text-red-500">*</span>
                        </Label>
                        <VariablePicker
                            nodes={nodes}
                            edges={edges}
                            onSelect={(v: string) => handleVariableSelect('body', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Textarea
                        value={typeof params.body === 'string' ? params.body : JSON.stringify(params.body, null, 2) || ''}
                        onChange={(e) => handleChange('body', e.target.value)}
                        placeholder='{ "data": "{{trigger.body.message}}" }'
                        className="font-mono text-xs min-h-[150px]"
                        disabled={disabled}
                        required
                    />
                </div>
            )}
        </div>
    );
}
