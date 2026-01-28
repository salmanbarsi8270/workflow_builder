import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Send, CheckCircle2 } from 'lucide-react';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'password' | 'select' | 'email';
    placeholder?: string;
    options?: string[];
    required?: boolean;
}

interface SupportFormProps {
    data: {
        title: string;
        fields: FormField[];
        submitText?: string;
    };
}

export const SupportForm: React.FC<SupportFormProps> = ({ data }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form Submitted:', formData);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <Card className="p-6 bg-green-500/5 border-green-500/20 text-center flex flex-col items-center gap-3">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <div>
                    <h3 className="font-bold text-green-700 dark:text-green-400">Configuration Submitted</h3>
                    <p className="text-sm text-green-600/80">I've received your configuration and I'm processing it.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-5 bg-white/50 dark:bg-white/5 backdrop-blur-md border-slate-200 dark:border-white/10 shadow-xl rounded-2xl">
            <h3 className="text-lg font-bold mb-4 text-foreground/90 border-b pb-2 border-slate-200 dark:border-white/5">
                {data.title || 'Dynamic Configuration'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {data.fields.map((field) => (
                    <div key={field.name} className="space-y-1.5">
                        <Label htmlFor={field.name} className="text-xs font-semibold text-muted-foreground ml-1">
                            {field.label}
                        </Label>
                        {field.type === 'select' ? (
                            <select 
                                id={field.name}
                                className="w-full h-10 px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                value={formData[field.name] || ''}
                                required={field.required}
                            >
                                <option value="" disabled>Select an option...</option>
                                {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <Input 
                                id={field.name}
                                type={field.type}
                                placeholder={field.placeholder || `Enter ${field.label}...`}
                                className="bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/10 rounded-xl focus-visible:ring-primary/20"
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                value={formData[field.name] || ''}
                                required={field.required}
                            />
                        )}
                    </div>
                ))}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-11 gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2">
                    <Send className="h-4 w-4" />
                    {data.submitText || 'Save Configuration'}
                </Button>
            </form>
        </Card>
    );
};
