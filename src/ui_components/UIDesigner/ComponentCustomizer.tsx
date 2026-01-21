
import type { UIDesign } from './types';
import { Circle, Square, Minus, type LucideIcon } from 'lucide-react';

interface ComponentCustomizerProps {
    design: Partial<UIDesign>;
    onChange: (updates: Partial<UIDesign>) => void;
}

export default function ComponentCustomizer({ design, onChange }: ComponentCustomizerProps) {
    const styles = design.component_styles || {
        avatar_style: 'circle',
        input_style: 'pill',
        bubble_style: 'rounded'
    };

    const updateStyle = (key: keyof typeof styles, value: string) => {
        onChange({
            component_styles: {
                ...styles,
                [key]: value
            }
        });
    };

    const toggleVisibility = (key: 'header_visible' | 'chat_visible' | 'input_visible' | 'logo_visible' | 'send_button') => {
        onChange({
            component_styles: {
                ...styles,
                [key]: !styles[key]
            }
        });
    };

    const OptionButton = ({
        active,
        onClick,
        icon: Icon,
        label
    }: { active: boolean; onClick: () => void; icon: LucideIcon; label: string }) => (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                ${active
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }
            `}
        >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <div className="space-y-8">
            {/* Structure (Visibility) */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Structure
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <OptionButton
                        active={!!styles.header_visible}
                        onClick={() => toggleVisibility('header_visible')}
                        icon={Minus} // Placeholder icon
                        label="Header"
                    />
                    <OptionButton
                        active={!!styles.chat_visible}
                        onClick={() => toggleVisibility('chat_visible')}
                        icon={Square} // Placeholder icon
                        label="Chat Area"
                    />
                    <OptionButton
                        active={!!styles.input_visible}
                        onClick={() => toggleVisibility('input_visible')}
                        icon={Minus} // Placeholder icon
                        label="Input Bar"
                    />
                    <OptionButton
                        active={!!styles.show_history}
                        onClick={() => toggleVisibility('show_history' as any)}
                        icon={Square} // Placeholder icon
                        label="History"
                    />
                    <OptionButton
                        active={!!styles.logo_visible}
                        onClick={() => toggleVisibility('logo_visible')}
                        icon={Circle} // Placeholder icon
                        label="Logo"
                    />
                </div>
            </div>

            {/* Avatar Style */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Avatar Shape
                </label>
                <div className="grid grid-cols-3 gap-3">
                    <OptionButton
                        active={styles.avatar_style === 'circle'}
                        onClick={() => updateStyle('avatar_style', 'circle')}
                        icon={Circle}
                        label="Circle"
                    />
                    <OptionButton
                        active={styles.avatar_style === 'rounded'}
                        onClick={() => updateStyle('avatar_style', 'rounded')}
                        icon={Square} // Using Square but forcing rounded via props for visual or just label
                        label="Rounded"
                    />
                    <OptionButton
                        active={styles.avatar_style === 'square'}
                        onClick={() => updateStyle('avatar_style', 'square')}
                        icon={Square}
                        label="Square"
                    />
                </div>
            </div>

            {/* Input Style */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Input Bar
                </label>
                {styles.input_visible ? (
                    <div className="grid grid-cols-3 gap-3">
                        <OptionButton
                            active={styles.input_style === 'pill'}
                            onClick={() => updateStyle('input_style', 'pill')}
                            icon={Circle}
                            label="Pill"
                        />
                        <OptionButton
                            active={styles.input_style === 'rounded'}
                            onClick={() => updateStyle('input_style', 'rounded')}
                            icon={Square}
                            label="Box"
                        />
                        <OptionButton
                            active={styles.input_style === 'line'}
                            onClick={() => updateStyle('input_style', 'line')}
                            icon={Minus}
                            label="Line"
                        />
                        <div className="col-span-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="grid grid-cols-2 gap-3">
                                <OptionButton
                                    active={!!styles.send_button}
                                    onClick={() => toggleVisibility('send_button')}
                                    icon={Circle} // Placeholder
                                    label="Send Button"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">Enable Input Bar in Structure to customize.</p>
                )}
            </div>

            {/* Bubble Style */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Message Bubbles
                </label>
                <div className="grid grid-cols-3 gap-3">
                    <OptionButton
                        active={styles.bubble_style === 'rounded'}
                        onClick={() => updateStyle('bubble_style', 'rounded')}
                        icon={Circle}
                        label="Round"
                    />
                    <OptionButton
                        active={styles.bubble_style === 'square'}
                        onClick={() => updateStyle('bubble_style', 'square')}
                        icon={Square}
                        label="Blocky"
                    />
                    <OptionButton
                        active={styles.bubble_style === 'leaf'}
                        onClick={() => updateStyle('bubble_style', 'leaf')}
                        icon={Circle} // Visual placeholder
                        label="Leaf"
                    />
                </div>
            </div>
        </div>
    );
}
