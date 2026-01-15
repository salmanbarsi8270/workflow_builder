
import type { UIDesign } from './types';

interface CssCustomizerProps {
    design: Partial<UIDesign>;
    onChange: (updates: Partial<UIDesign>) => void;
}

export default function CssCustomizer({ design, onChange }: CssCustomizerProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Custom CSS
                </label>
                <span className="text-xs text-slate-500">
                    Advanced
                </span>
            </div>

            <div className="space-y-2">
                <p className="text-xs text-slate-500">
                    Override styles for any element. Use valid CSS.
                </p>
                <textarea
                    value={design.custom_css || ''}
                    onChange={(e) => onChange({ custom_css: e.target.value })}
                    placeholder={`.chat-container { \n  border-radius: 0px; \n}\n\n.message-bubble {\n  box-shadow: 4px 4px 0px #000;\n}`}
                    className="w-full px-4 py-4 bg-slate-900 text-slate-200 font-mono text-xs border border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 min-h-[300px] resize-y"
                    spellCheck={false}
                />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                <strong>Tip:</strong> Changes apply instantly to the preview.
            </div>
        </div>
    );
}
