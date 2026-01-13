import React from 'react';
import { HexColorPicker } from 'react-colorful';
import type { UIDesign } from './types';

interface ColorCustomizerProps {
    design: Partial<UIDesign>;
    onChange: (updates: Partial<UIDesign>) => void;
}

const PRESET_COLORS = [
    '#4dabf7', // Blue
    '#2563eb', // Dark Blue
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#6366f1', // Indigo
];

export default function ColorCustomizer({ design, onChange }: ColorCustomizerProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Primary Theme Color
                </label>

                {/* Preset Colors Grid */}
                <div className="grid grid-cols-4 gap-2">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => onChange({ theme_color: color })}
                            className={`
                h-8 w-full rounded-md border transition-all hover:scale-105 active:scale-95
                ${design.theme_color === color
                                    ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900'
                                    : 'border-transparent'
                                }
              `}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>

                {/* Custom Color Picker */}
                <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        Custom Color
                    </label>
                    <div className="w-full">
                        <HexColorPicker
                            color={design.theme_color || '#4dabf7'}
                            onChange={(color) => onChange({ theme_color: color })}
                            style={{ width: '100%', height: '160px', borderRadius: '8px' }}
                        />
                    </div>
                </div>

                {/* Manual Input */}
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700"
                        style={{ backgroundColor: design.theme_color }}
                    />
                    <input
                        type="text"
                        value={design.theme_color || ''}
                        onChange={(e) => onChange({ theme_color: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    />
                </div>
            </div>
        </div>
    );
}
