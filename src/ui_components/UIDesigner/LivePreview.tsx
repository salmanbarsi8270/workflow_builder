import React from 'react';
import { Send, User as UserIcon, Bot as BotIcon, Paperclip, Mic } from 'lucide-react';
import type { UIDesign } from './types';

interface LivePreviewProps {
    design: Partial<UIDesign>;
}

export default function LivePreview({ design }: LivePreviewProps) {
    const themeColor = design.theme_color || '#4dabf7';
    const fontFamily = design.font_family || 'Inter, sans-serif';

    return (
        <div className="w-full max-w-sm mx-auto h-[600px] bg-white dark:bg-slate-900 rounded-[2rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden flex flex-col relative">

            {/* 1. Header Area */}
            <div
                className="px-6 py-4 flex items-center justify-between shadow-sm z-10 transition-colors duration-300"
                style={{
                    backgroundColor: design.template_id === 'professional' ? '#ffffff' : themeColor,
                    color: design.template_id === 'professional' ? '#1e293b' : '#ffffff',
                    fontFamily
                }}
            >
                <div className="flex items-center gap-3">
                    <div className={`
             w-10 h-10 rounded-full flex items-center justify-center shadow-inner
             ${design.template_id === 'professional' ? 'bg-slate-100 text-slate-600' : 'bg-white/20 text-white'}
          `}>
                        {design.logo_url ? (
                            <img src={design.logo_url} alt="Logo" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <BotIcon className="w-6 h-6" />
                        )}
                    </div>
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

            {/* 2. Chat Area */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 space-y-4 overflow-y-auto" style={{ fontFamily }}>

                {/* Welcome Message (Bot) */}
                <div className="flex items-start gap-3">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: themeColor, color: '#fff' }}
                    >
                        <BotIcon className="w-4 h-4" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 max-w-[85%]">
                        {design.welcome_message || 'Hello! How can I help you today?'}
                    </div>
                </div>

                {/* User Message (Example) */}
                <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                        <UserIcon className="w-4 h-4" />
                    </div>
                    <div
                        className="p-3 rounded-2xl rounded-tr-none shadow-sm text-sm text-white max-w-[85%]"
                        style={{ backgroundColor: themeColor }}
                    >
                        Can you show me the latest features?
                    </div>
                </div>

                {/* Bot Reply (Typing Indicator) */}
                <div className="flex items-start gap-3">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-70"
                        style={{ backgroundColor: themeColor, color: '#fff' }}
                    >
                        <BotIcon className="w-4 h-4" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800" style={{ fontFamily }}>
                <div className="relative flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        placeholder={design.input_placeholder || "Type your message..."}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-opacity-50 outline-none"
                        style={{
                            color: '#334155',
                            '--tw-ring-color': themeColor
                        } as React.CSSProperties}
                        readOnly
                    />
                    {/* Send Button */}
                    <button
                        className="p-2.5 rounded-full text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                        style={{ backgroundColor: themeColor }}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <p className="text-[10px] text-slate-400">Powered by Agentic AI</p>
                </div>
            </div>

        </div>
    );
}
