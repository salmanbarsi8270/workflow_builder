import React from 'react';
import { Send, User as UserIcon, Bot as BotIcon, Paperclip } from 'lucide-react';
import type { UIDesign } from './types';

interface LivePreviewProps {
    design: Partial<UIDesign>;
}

export default function LivePreview({ design }: LivePreviewProps) {
    const themeColor = design.theme_color || '#4dabf7';
    const fontFamily = design.font_family || 'Inter, sans-serif';

    // Dynamic Font Loading
    React.useEffect(() => {
        if (!fontFamily || fontFamily.includes('system')) return;

        const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        const linkId = `font-loader-${fontName}`;

        if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
            document.head.appendChild(link);
        }
    }, [fontFamily]);

    // Style Helpers
    const styles = design.component_styles || {
        avatar_style: 'circle',
        input_style: 'pill',
        bubble_style: 'rounded'
    };

    const getAvatarClass = () => {
        if (styles.avatar_style === 'square') return 'rounded-md'; // Slight round for aesthetic
        if (styles.avatar_style === 'rounded') return 'rounded-xl';
        return 'rounded-full';
    };

    const getInputClass = () => {
        if (styles.input_style === 'line') return 'border-b border-slate-200 dark:border-slate-700 rounded-none bg-transparent px-0';
        if (styles.input_style === 'rounded') return 'rounded-md border border-slate-200 dark:border-slate-700';
        return 'rounded-full border-none bg-slate-100 dark:bg-slate-800'; // Pill default
    };

    const getBubbleClass = (isBot: boolean) => {
        const base = "p-3 shadow-sm text-sm max-w-[85%]";
        if (styles.bubble_style === 'square') {
            return `${base} rounded-md`;
        }
        if (styles.bubble_style === 'leaf') {
            return `${base} rounded-2xl ${isBot ? 'rounded-tl-none' : 'rounded-br-none'}`;
        }
        // Default Rounded
        return `${base} rounded-2xl ${isBot ? 'rounded-tl-none' : 'rounded-tr-none'}`;
    };

    // Visibility Helpers (Backward compatibility: default to true if undefined)
    const isVisible = (key: keyof typeof styles) => {
        return styles[key] !== false;
    };

    // Frame only visible if at least one component is visible
    const hasContent = isVisible('header_visible') || isVisible('chat_visible') || isVisible('input_visible');

    return (
        <div className={`
            w-full h-full flex flex-col relative transition-all duration-300
            ${hasContent
                ? 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden'
                : 'bg-transparent border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl items-center justify-center'
            }
        `}>
            {!hasContent && (
                <div className="text-center text-slate-400 dark:text-slate-600">
                    <p className="text-sm font-medium">Empty Canvas</p>
                    <p className="text-xs mt-1">Add components from the "Structure" menu</p>
                </div>
            )}

            {/* 1. Header Area */}
            {isVisible('header_visible') && (
                <div
                    className="px-6 py-4 shadow-sm z-10 transition-colors duration-300"
                    style={{
                        backgroundColor: design.template_id === 'professional' ? '#ffffff' : themeColor,
                        color: design.template_id === 'professional' ? '#1e293b' : '#ffffff',
                        fontFamily
                    }}
                >
                    <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isVisible('logo_visible') && (
                                <div className={`
                        w-10 h-10 flex items-center justify-center shadow-inner ${getAvatarClass()}
                        ${design.template_id === 'professional' ? 'bg-slate-100 text-slate-600' : 'bg-white/20 text-white'}
                    `}>
                                    {design.logo_url ? (
                                        <img src={design.logo_url} alt="Logo" className={`w-full h-full object-cover ${getAvatarClass()}`} />
                                    ) : (
                                        <BotIcon className="w-6 h-6" />
                                    )}
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-base leading-tight">
                                    {design.title || 'AI Assistant'}
                                </h3>
                                <p className={`text-xs opacity-90 flex items-center gap-1.5`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${design.template_id === 'professional' ? 'bg-green-500' : 'bg-white'}`}></span>
                                    {design.subtitle || 'Online'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Chat Area */}
            {isVisible('chat_visible') ? (
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto" style={{ fontFamily }}>
                    <div className="max-w-4xl mx-auto w-full space-y-4">
                        {/* Welcome Message (Bot) */}
                        <div className="flex items-start gap-3">
                            <div
                                className={`w-8 h-8 flex items-center justify-center shrink-0 ${getAvatarClass()}`}
                                style={{ backgroundColor: themeColor, color: '#fff' }}
                            >
                                <BotIcon className="w-4 h-4" />
                            </div>
                            <div className={`bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 ${getBubbleClass(true)}`}>
                                {design.welcome_message || 'Hello! How can I help you today?'}
                            </div>
                        </div>

                        {/* User Message (Example) */}
                        <div className="flex items-start gap-3 flex-row-reverse">
                            <div className={`w-8 h-8 bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 ${getAvatarClass()}`}>
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <div
                                className={`text-white ${getBubbleClass(false)}`}
                                style={{ backgroundColor: themeColor }}
                            >
                                Can you show me the latest features?
                            </div>
                        </div>

                        {/* Bot Reply (Typing Indicator) */}
                        <div className="flex items-start gap-3">
                            <div
                                className={`w-8 h-8 flex items-center justify-center shrink-0 opacity-70 ${getAvatarClass()}`}
                                style={{ backgroundColor: themeColor, color: '#fff' }}
                            >
                                <BotIcon className="w-4 h-4" />
                            </div>
                            <div className={`bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 ${getBubbleClass(true)}`}>
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Spacer if header exists but no chat, to make input sit at bottom */
                <div className="flex-1 bg-transparent"></div>
            )}

            {/* 3. Input Area */}
            {isVisible('input_visible') && (
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800" style={{ fontFamily }}>
                    <div className="max-w-4xl mx-auto w-full">
                        <div className="relative flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                placeholder={design.input_placeholder || "Type your message..."}
                                className={`flex-1 px-4 py-2.5 text-sm focus:ring-2 focus:ring-opacity-50 outline-none text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-200 ${getInputClass()}`}
                                style={{
                                    '--tw-ring-color': themeColor
                                } as React.CSSProperties}
                                readOnly
                            />
                            {/* Send Button */}
                            {isVisible('send_button') && (
                                <button
                                    className={`p-2.5 text-white shadow-md transition-transform hover:scale-105 active:scale-95 ${styles.avatar_style === 'square' ? 'rounded-md' : 'rounded-full'}`}
                                    style={{ backgroundColor: themeColor }}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="mt-2 text-center">
                            <p className="text-[10px] text-slate-400">Powered by Agentic AI</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
