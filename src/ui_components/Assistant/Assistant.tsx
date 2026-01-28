import { useState } from 'react';
import Support from './components/support';
import { Presentation } from './components/presentation';
import { useAssistantHistory } from './hooks/useAssistantHistory';
import { useUser } from '@/context/UserContext';

export const Assistant = () => {
  const { user } = useUser();
  const [activeView, setActiveView] = useState<'chat' | 'presentation'>('chat');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const history = useAssistantHistory(user?.id);

  return (
    <div className="relative w-full h-full flex flex-col">
      
      {/* Minimal Segmented Switch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-99">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 self-start md:self-center shrink-0">
                    <button
                        onClick={() => setActiveView('chat')}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-semibold transition-all
                            ${activeView === 'chat' 
                                ? 'bg-white dark:bg-[#333131] text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'}
                        `}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveView('presentation')}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-semibold transition-all
                            ${activeView === 'presentation' 
                                ? 'bg-white dark:bg-[#333131] text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'}
                        `}
                    >
                        Canvas
                    </button>
                </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'chat' && (
            <Support 
                activeSessionId={activeSessionId} 
                onSessionSelect={setActiveSessionId}
                history={history}
            />
        )}
        {activeView === 'presentation' && (
            <Presentation 
                activeSessionId={activeSessionId} 
                onSessionSelect={setActiveSessionId}
                history={history}
            />
        )}
      </div>
    </div>
  );
};
