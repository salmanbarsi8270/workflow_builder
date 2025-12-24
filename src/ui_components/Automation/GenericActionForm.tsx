import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ActionParameter } from "./ActionDefinitions"
import ConnectionSelector from "../Connections/ConnectionSelector"

interface GenericActionFormProps {
    data: any;
    onUpdate: (data: any) => void;
    parameters: ActionParameter[];
}

export default function GenericActionForm({ data, onUpdate, parameters }: GenericActionFormProps) {
    const handleChange = (field: string, value: any) => {
        onUpdate({ ...data, [field]: value });
    };

    // Determine the app name for the ConnectionSelector
    // This is tricky: GenericActionForm receives just 'data'. 
    // Usually 'data.appName' is present from the node creation.
    const appName = data.appName || 'App'; 

    return (
        <div className="flex flex-col gap-4">
            {parameters.map(param => (
                <div key={param.name} className="grid gap-2">
                    <Label>{param.label} {param.required && <span className="text-red-500">*</span>}</Label>
                    
                    {param.type === 'connection' && (
                        <ConnectionSelector 
                            appName={param.description?.includes('Gmail') ? 'Gmail' : 
                                     param.description?.includes('Drive') ? 'Google Drive' :
                                     param.description?.includes('Docs') ? 'Google Docs' :
                                     param.description?.includes('Sheets') ? 'Google Sheets' :
                                     appName} // Fallback to detected appName or description hint
                            value={data[param.name]}
                            onChange={(val) => handleChange(param.name, val)}
                        />
                    )}

                    {param.type === 'string' && (
                        param.name === 'body' || param.name === 'description' ? (
                             <Textarea 
                                value={data[param.name] || param.default || ''}
                                onChange={(e) => handleChange(param.name, e.target.value)}
                                placeholder={param.description}
                                className="min-h-[100px]"
                             />
                        ) : (
                            <Input 
                                value={data[param.name] || param.default || ''}
                                onChange={(e) => handleChange(param.name, e.target.value)}
                                placeholder={param.description}
                            />
                        )
                    )}

                    {param.type === 'number' && (
                        <Input 
                            type="number"
                            value={data[param.name] || param.default || ''}
                            onChange={(e) => handleChange(param.name, Number(e.target.value))}
                            placeholder={param.description}
                        />
                    )}

                     {/* Fallback for array/boolean if needed, treating as string/text for now or JSON */}
                     {param.type === 'array' && (
                        <Input 
                            value={Array.isArray(data[param.name]) ? JSON.stringify(data[param.name]) : (data[param.name] || '')}
                            onChange={(e) => {
                                try {
                                    // Try to parse JSON if they paste it, otherwise just invalid
                                     // For simple CSV support:
                                     // handleChange(param.name, e.target.value.split(','));
                                     handleChange(param.name, e.target.value);
                                } catch (err) {
                                    handleChange(param.name, e.target.value);
                                }
                            }}
                            placeholder={param.description + " (JSON array or raw text)"}
                        />
                     )}
                </div>
            ))}
        </div>
    );
}
