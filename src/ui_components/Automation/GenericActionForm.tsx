import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ActionParameter } from "./ActionDefinitions"
import ConnectionSelector from "../Connections/ConnectionSelector"
import { useState, useEffect } from "react";

interface GenericActionFormProps {
    data: any;
    params: any;
    onChange: (params: any) => void;
    parameters: ActionParameter[];
    disabled?: boolean;
}

const ArrayInput = ({ value, onChange, placeholder, disabled }: { value: any, onChange: (val: any) => void, placeholder?: string, disabled?: boolean }) => {
    const [localValue, setLocalValue] = useState(Array.isArray(value) ? JSON.stringify(value) : (value || ''));

    // Sync if value changes from outside (e.g. from a different node selection)
    useEffect(() => {
        const strValue = Array.isArray(value) ? JSON.stringify(value) : (value || '');
        if (strValue !== localValue) {
            try {
                // Only update if the parsed local value is truly different
                const parsedLocal = JSON.parse(localValue);
                if (JSON.stringify(parsedLocal) !== strValue) {
                    setLocalValue(strValue);
                }
            } catch {
                setLocalValue(strValue);
            }
        }
    }, [value]);

    const handleBlur = () => {
        try {
            const parsed = JSON.parse(localValue);
            onChange(parsed);
        } catch {
            onChange(localValue);
        }
    };

    return (
        <Input 
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
        />
    );
};

export default function GenericActionForm({ data, params = {}, onChange, parameters, disabled }: GenericActionFormProps) {
    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    const appName = data.appName || 'App'; 

    return (
        <div className="flex flex-col gap-4">
            {parameters.map(param => {
                // Check conditional visibility
                if (param.dependsOn) {
                    const dependentValue = params[param.dependsOn.field];
                    if (dependentValue !== param.dependsOn.value) {
                        return null;
                    }
                }

                return (
                    <div key={param.name} className="grid gap-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            {param.label} {param.required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {param.type === 'connection' && (
                            <ConnectionSelector 
                                appName={param.label?.includes('Gmail') ? 'Gmail' : 
                                         param.label?.includes('Drive') ? 'Google Drive' :
                                         param.label?.includes('Docs') ? 'Google Docs' :
                                         param.label?.includes('Sheets') ? 'Google Sheets' :
                                         appName}
                                value={params[param.name] || ''}
                                onChange={(val) => handleChange(param.name, val)}
                                disabled={disabled}
                            />
                        )}

                        {param.type === 'select' && (
                            <Select 
                                value={params[param.name] || param.default || ''} 
                                onValueChange={(val) => handleChange(param.name, val)}
                                disabled={disabled}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={param.description || "Select an option"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {param.options?.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {param.type === 'string' && (
                            param.name === 'body' || param.name === 'description' || param.name === 'text' ? (
                                 <Textarea 
                                    value={params[param.name] || param.default || ''}
                                    onChange={(e) => handleChange(param.name, e.target.value)}
                                    placeholder={param.description}
                                    className="min-h-[100px]"
                                    disabled={disabled}
                                 />
                            ) : (
                                <Input 
                                    value={params[param.name] || param.default || ''}
                                    onChange={(e) => handleChange(param.name, e.target.value)}
                                    placeholder={param.description}
                                    disabled={disabled}
                                />
                            )
                        )}

                        {param.type === 'number' && (
                            <Input 
                                type="number"
                                value={params[param.name] || param.default || ''}
                                onChange={(e) => handleChange(param.name, Number(e.target.value))}
                                placeholder={param.description}
                                disabled={disabled}
                            />
                        )}

                        {param.type === 'array' && (
                            <ArrayInput 
                                value={params[param.name]}
                                onChange={(val) => handleChange(param.name, val)}
                                placeholder={param.description + " (e.g. [\"data1\", \"data2\"])"}
                                disabled={disabled}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
