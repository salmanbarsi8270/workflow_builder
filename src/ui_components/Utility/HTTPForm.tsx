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
import { VariablePicker } from "../Automation/VariablePicker"
import { type Node } from "@xyflow/react"

interface HTTPFormProps {
    data: any;
    params: any;
    onChange: (params: any) => void;
    disabled?: boolean;
    nodes: Node[];
    nodeId?: string;
}

export default function HTTPForm({ data: _data, params, onChange, disabled, nodes, nodeId }: HTTPFormProps) {
    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    const handleVariableSelect = (field: string, variable: string) => {
        const currentValue = params[field] || '';
        handleChange(field, currentValue + variable);
    };

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
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                        URL <span className="text-red-500">*</span>
                    </Label>
                    <VariablePicker
                        nodes={nodes}
                        onSelect={(v) => handleVariableSelect('url', v)}
                        currentNodeId={nodeId}
                    />
                </div>
                <Input
                    value={params.url || ''}
                    onChange={(e) => handleChange('url', e.target.value)}
                    placeholder="https://api.example.com/v1/resource"
                    disabled={disabled}
                />
            </div>

            {/* Headers */}
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                        Headers (JSON)
                    </Label>
                    <VariablePicker
                        nodes={nodes}
                        onSelect={(v) => handleVariableSelect('headers', v)}
                        currentNodeId={nodeId}
                    />
                </div>
                <Textarea
                    value={typeof params.headers === 'string' ? params.headers : JSON.stringify(params.headers, null, 2) || ''}
                    onChange={(e) => handleChange('headers', e.target.value)}
                    placeholder='{ "Content-Type": "application/json" }'
                    className="font-mono text-xs min-h-[100px]"
                    disabled={disabled}
                />
            </div>

            {/* Body */}
            {(params.method !== 'GET' && params.method !== 'DELETE') && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            Body (JSON)
                        </Label>
                        <VariablePicker
                            nodes={nodes}
                            onSelect={(v) => handleVariableSelect('body', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Textarea
                        value={typeof params.body === 'string' ? params.body : JSON.stringify(params.body, null, 2) || ''}
                        onChange={(e) => handleChange('body', e.target.value)}
                        placeholder='{ "key": "value" }'
                        className="font-mono text-xs min-h-[150px]"
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    );
}
