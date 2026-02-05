import { History, Volume2, Moon } from 'lucide-react';

interface SupportHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNewChat: () => void;
  onToggleHistory: () => void;
}

export const SupportHeader = ({ 
  isDarkMode, 
  onToggleDarkMode, 
  onNewChat, 
  onToggleHistory 
}: SupportHeaderProps) => {
  return (
    <div className={`px-6 py-4 transition-colors ${
      isDarkMode 
        ? 'bg-primary text-white' 
        : 'bg-primary text-white'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onToggleHistory} className="p-2 bg-white/20 rounded-lg">
            <History className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm sm:text-lg font-semibold truncate max-w-[120px] sm:max-w-none">AI Support Assistant</h1>
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="opacity-90">Online • Instant Responses</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={onNewChat}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap"
          >
            New Chat
          </button>
          <button onClick={onToggleDarkMode} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Toggle dark mode">
            <Moon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
