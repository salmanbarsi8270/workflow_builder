
import { Check } from 'lucide-react';
import { TEMPLATES, type UITemplate } from './types';

interface TemplateSelectorProps {
    activeTemplateId: string;
    onSelect: (template: UITemplate) => void;
}

export default function TemplateSelector({ activeTemplateId, onSelect }: TemplateSelectorProps) {
    return (
        <div className="grid grid-cols-1 gap-4">
            {TEMPLATES.map((template) => {
                const isActive = activeTemplateId === template.id;

                return (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className={`
              relative p-4 rounded-xl border-2 text-left transition-all duration-200
              ${isActive
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-600 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                            }
            `}
                    >
                        <div className="flex items-start gap-4">
                            {/* Preview Icon */}
                            <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-700'}
              `}>
                                {template.preview}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className={`font-semibold ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-white'}`}>
                                        {template.name}
                                    </h4>
                                    {isActive && (
                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <p className={`text-sm mt-1 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {template.description}
                                </p>
                            </div>
                        </div>

                        {/* Visual indicator of the template's vibe */}
                        <div
                            className="absolute bottom-0 right-0 h-1 w-full rounded-b-xl opacity-50"
                            style={{ backgroundColor: template.defaultConfig.theme_color }}
                        />
                    </button>
                );
            })}
        </div>
    );
}
