import React, { useState } from 'react';
import Support from '../support';
import { Presentation } from '../generative_ui';

export const Assistant = () => {
  const [activeView, setActiveView] = useState<'chat' | 'canvas'>('chat');

  return (
    <div className="relative w-full h-full flex flex-col bg-[#f8f9fa] dark:bg-[#050505]">

      {/* Segmented Switch - Repositioned to Right of Title area */}
      <div className="absolute top-[85px] right-12 z-40">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-md">
          <button
            onClick={() => setActiveView('chat')}
            className={`
              px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300
              ${activeView === 'chat'
                ? 'bg-slate-900 dark:bg-white/10 text-white dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'}
            `}
          >
            Chat
          </button>

          <button
            onClick={() => setActiveView('canvas')}
            className={`
              px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300
              ${activeView === 'canvas'
                ? 'bg-slate-900 dark:bg-white/10 text-white dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'}
            `}
          >
            Canvas
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'chat' && <Support />}
        {activeView === 'canvas' && <Presentation />}
      </div>
    </div>
  );
};
