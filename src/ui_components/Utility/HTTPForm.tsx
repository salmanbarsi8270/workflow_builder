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
import { Switch } from "@/components/ui/switch"
import { FilePicker } from "../Automation/components/FilePicker"
import { DictionaryInput } from "../Automation/components/SharedInputs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, Info, Send, Check, Copy, Globe, Upload } from "lucide-react"
import { API_URL } from "@/ui_components/api/apiurl"
import { toast } from "sonner"
import { Button } from "@/components/button"

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
    const [copiedCurl, setCopiedCurl] = useState(false);
    const [activeCurlTab, setActiveCurlTab] = useState('POST');

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

        const handleCopyCurl = () => {
            if (!flowId) {
                toast.error("Please save the workflow first");
                return;
            }
            
            let curlCmd = '';
            if (activeCurlTab === 'UPLOAD') {
                curlCmd = `curl -X POST "${webhookUrl}" \\\n-F "file=@/path/to/your/file.png"`;
            } else {
                curlCmd = `curl -X ${activeCurlTab} "${webhookUrl}" \\\n-H "Content-Type: application/json" \\\n-d '{"message": "Hello from frontend"}'`;
            }

            navigator.clipboard.writeText(curlCmd);
            setCopiedCurl(true);
            toast.success("cURL command copied to clipboard");
            setTimeout(() => setCopiedCurl(false), 2000);
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

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            Test Command (cURL)
                        </Label>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyCurl}
                            className="h-6 w-6"
                            disabled={!flowId}
                        >
                            {copiedCurl ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    </div>

                    <Tabs value={activeCurlTab} onValueChange={setActiveCurlTab} className="w-full">
                        <TabsList className="w-full grid grid-cols-5 h-8 bg-muted/50 p-1 mb-2">
                            <TabsTrigger value="GET" className="text-[9px] py-1">GET</TabsTrigger>
                            <TabsTrigger value="POST" className="text-[9px] py-1">POST</TabsTrigger>
                            <TabsTrigger value="PUT" className="text-[9px] py-1">PUT</TabsTrigger>
                            <TabsTrigger value="DELETE" className="text-[9px] py-1">DELETE</TabsTrigger>
                            <TabsTrigger value="UPLOAD" className="text-[9px] py-1 flex items-center gap-1">
                                <Upload className="h-2.5 w-2.5" /> UPLOAD
                            </TabsTrigger>
                        </TabsList>
                        
                        <div className="bg-slate-950 text-slate-50 p-3 rounded-md font-mono text-[10px] overflow-x-auto whitespace-pre-wrap relative group min-h-[60px] flex items-center">
                            {activeCurlTab === 'UPLOAD' ? (
                                `curl -X POST "${webhookUrl}" \\
-F "file=@/path/to/your/file.png"`
                            ) : (
                                `curl -X ${activeCurlTab} "${webhookUrl}" \\
-H "Content-Type: application/json" \\
-d '{"message": "Hello from frontend"}'`
                            )}
                        </div>
                    </Tabs>

                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {activeCurlTab === 'UPLOAD' 
                            ? "Use -F to upload files via multipart/form-data. The uploaded files will be available as {{trigger.files}} and the first file as {{trigger.file}} in your workflow."
                            : "Copy and run this in your terminal to test the trigger."}
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

            {/* Query Params */}
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                        Query Parameters
                    </Label>
                </div>
                <DictionaryInput
                    value={params.queryParams}
                    onChange={(val:any) => handleChange('queryParams', val)}
                    nodes={nodes}
                    edges={edges}
                    nodeId={nodeId}
                    disabled={disabled}
                    placeholder="Key-value pairs for the URL query string"
                />
            </div>

            {/* Body Configuration (Only for non-GET/HEAD) */}
            {(params.method !== 'GET' && params.method !== 'HEAD') && (
                <div className="space-y-4 border-t pt-4">
                    <div className="grid gap-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            Body Type
                        </Label>
                        <Select
                            value={params.bodyType || 'json'}
                            onValueChange={(val) => handleChange('bodyType', val)}
                            disabled={disabled}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Body Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="json">JSON</SelectItem>
                                <SelectItem value="form-data">Form Data</SelectItem>
                                <SelectItem value="multipart/form-data">Multipart / File Upload</SelectItem>
                                <SelectItem value="text">Raw Text</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(params.bodyType !== 'multipart/form-data') && (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                                    {params.bodyType === 'json' ? 'Body (JSON)' : 'Body (Raw)'} <span className="text-red-500">*</span>
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
                                placeholder={params.bodyType === 'json' ? '{ "key": "value" }' : 'Enter raw body content...'}
                                className="font-mono text-xs min-h-[120px]"
                                disabled={disabled}
                                required
                            />
                        </div>
                    )}

                    {(params.bodyType === 'multipart/form-data' || params.bodyType === 'form-data') && (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                                    Files to Upload
                                </Label>
                            </div>
                            <FilePicker
                                value={params.files}
                                onChange={(val) => handleChange('files', val)}
                                nodes={nodes}
                                edges={edges}
                                nodeId={nodeId}
                                disabled={disabled}
                                placeholder="Select or upload a file for the multipart request"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                Note: This will construct a multipart/form-data request with the chosen file.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Examples & Guide Section */}
            <div className="mt-6 border-t pt-6">
                <div className="flex items-center gap-2 mb-4 text-primary font-semibold">
                    <HelpCircle className="h-4 w-4" />
                    <h3 className="text-sm">Usage Examples & Guide</h3>
                </div>
                <Tabs defaultValue="get" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 h-auto gap-1 bg-muted/50 p-1">
                        <TabsTrigger value="get" className="text-[10px] py-1">GET/DELETE</TabsTrigger>
                        <TabsTrigger value="post" className="text-[10px] py-1">POST/PUT</TabsTrigger>
                        <TabsTrigger value="upload" className="text-[10px] py-1">FILE UPLOAD</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="get" className="mt-2 space-y-3">
                        <div className="p-3 rounded-md bg-muted/30 border space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600">
                                <Info className="h-3 w-3" />
                                <span>READING DATA</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Use <b>GET</b> to fetch data. Parameters should go into <b>Query Parameters</b>.
                            </p>
                            <div className="bg-slate-950 p-2 rounded font-mono text-[9px] text-slate-300">
                                URL: https://api.ex.com/users<br/>
                                Query: {"{ \"id\": \"123\" }"}<br/>
                                Output: {"{ \"name\": \"John\" }"}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="post" className="mt-2 space-y-3">
                        <div className="p-3 rounded-md bg-muted/30 border space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-green-600">
                                <Send className="h-3 w-3" />
                                <span>SENDING DATA</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Use <b>POST</b> or <b>PUT</b>. Set Body Type to <b>JSON</b> and provide a valid JSON object.
                            </p>
                            <div className="bg-slate-950 p-2 rounded font-mono text-[9px] text-slate-300">
                                Method: POST<br/>
                                Body Type: JSON<br/>
                                Body: {"{ \"status\": \"active\" }"}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-2 space-y-3">
                        <div className="p-3 rounded-md bg-muted/30 border space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-purple-600">
                                <Upload className="h-3 w-3" />
                                <span>UPLOADING FILES</span>
                            </div>
                            <ol className="text-[10px] text-muted-foreground list-decimal pl-4 space-y-1">
                                <li>Set Method to <b>POST</b> or <b>PUT</b>.</li>
                                <li>Set Body Type to <b>Multipart</b>.</li>
                                <li>Use the <b>File Picker</b> to select/upload a file.</li>
                            </ol>
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700">
                                Tip: You can also use variable from a previous "Download" step as the file source.
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
