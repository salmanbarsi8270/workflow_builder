import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ActionParameter } from "./ActionDefinitions"
import ConnectionSelector from "../Connections/ConnectionSelector"

interface GenericActionFormProps {
    data: any;
    params: any;
    onChange: (params: any) => void;
    parameters: ActionParameter[];
    disabled?: boolean;
}

export default function GenericActionForm({ data, params, onChange, parameters, disabled }: GenericActionFormProps) {
    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    const appName = data.appName || 'App'; 

    return (
        <div className="flex flex-col gap-4">
            {parameters.map(param => (
                <div key={param.name} className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                        {param.label} {param.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {param.type === 'connection' && (
                        <ConnectionSelector 
                            appName={param.description?.includes('Gmail') ? 'Gmail' : 
                                     param.description?.includes('Drive') ? 'Google Drive' :
                                     param.description?.includes('Docs') ? 'Google Docs' :
                                     param.description?.includes('Sheets') ? 'Google Sheets' :
                                     appName}
                            value={params[param.name] || ''}
                            onChange={(val) => handleChange(param.name, val)}
                            disabled={disabled}
                        />
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
                        <Input 
                            value={Array.isArray(params[param.name]) ? JSON.stringify(params[param.name]) : (params[param.name] || '')}
                            onChange={(e) => handleChange(param.name, e.target.value)}
                            placeholder={param.description + " (JSON array or raw text)"}
                            disabled={disabled}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
