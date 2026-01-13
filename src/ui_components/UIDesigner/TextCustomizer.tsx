
import type { UIDesign } from './types'

interface TextCustomizerProps {
    design: Partial<UIDesign>;
    onChange: (updates: Partial<UIDesign>) => void;
}

const FONTS = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif' },
    { name: 'Outfit', value: 'Outfit, sans-serif' },
    { name: 'System', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
];

export default function TextCustomizer({ design, onChange }: TextCustomizerProps) {
    return (
        <div className="space-y-6">

            {/* Bot Name & Identity */}
            <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Identity
                </label>

                <div className="space-y-2">
                    <label className="text-xs text-slate-500">Header Title</label>
                    <input
                        type="text"
                        value={design.title || ''}
                        onChange={(e) => onChange({ title: e.target.value })}
                        placeholder="e.g. AI Assistant"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-500">Subtitle / Status</label>
                    <input
                        type="text"
                        value={design.subtitle || ''}
                        onChange={(e) => onChange({ subtitle: e.target.value })}
                        placeholder="e.g. Online Now"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Messages
                </label>

                <div className="space-y-2">
                    <label className="text-xs text-slate-500">Welcome Message</label>
                    <textarea
                        value={design.welcome_message || ''}
                        onChange={(e) => onChange({ welcome_message: e.target.value })}
                        placeholder="e.g. Hello! How can I help you today?"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-500">Input Placeholder</label>
                    <input
                        type="text"
                        value={design.input_placeholder || ''}
                        onChange={(e) => onChange({ input_placeholder: e.target.value })}
                        placeholder="e.g. Type your message..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Typography */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Typography
                </label>

                <div className="grid grid-cols-2 gap-2">
                    {FONTS.map(font => (
                        <button
                            key={font.value}
                            onClick={() => onChange({ font_family: font.value })}
                            className={`
                    px-3 py-2 text-sm border rounded-md transition-colors text-left
                    ${design.font_family === font.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                                }
                  `}
                            style={{ fontFamily: font.value }}
                        >
                            {font.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
