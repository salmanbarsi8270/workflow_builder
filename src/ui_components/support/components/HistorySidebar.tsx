import { History, Trash2, Edit, X, Check } from 'lucide-react';
import type { ChatSession } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSession: string;
  onLoadSession: (sessionId: string) => void;
  onNewChat: () => void;
  onClearChat: () => void;
  isDarkMode: boolean;
  editingSessionId: string | null;
  editingTitle: string;
  onStartRename: (session: ChatSession, e: React.MouseEvent) => void;
  onSaveRename: (sessionId: string) => void;
  onCancelRename: () => void;
  onEditingTitleChange: (title: string) => void;
  onDeleteConversation: (sessionId: string, conversationId: string, e: React.MouseEvent) => void;
  currentMessages: any[];
  formatTime: (date: Date) => string;
  isLoadingSession: boolean;
  isDeletingSession: string | null;
  isLoadingHistory: boolean;
}

export const HistorySidebar = ({
  isOpen,
  onClose,
  sessions,
  activeSession,
  onLoadSession,
  onNewChat,
  isDarkMode,
  editingSessionId,
  editingTitle,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onEditingTitleChange,
  onDeleteConversation,
  currentMessages,
  formatTime,
  isLoadingSession,
  isDeletingSession,
  isLoadingHistory,
  onClearChat
}: HistorySidebarProps) => {
  const todaySessions = sessions.filter(session => {
    const diff = new Date().getTime() - session.date.getTime();
    return diff < 24 * 60 * 60 * 1000;
  });

  const yesterdaySessions = sessions.filter(session => {
    const diff = new Date().getTime() - session.date.getTime();
    return diff >= 24 * 60 * 60 * 1000 && diff < 48 * 60 * 60 * 1000;
  });

  const last7DaysSessions = sessions.filter(session => {
    const diff = new Date().getTime() - session.date.getTime();
    return diff >= 48 * 60 * 60 * 1000 && diff < 7 * 24 * 60 * 60 * 1000;
  });

  const renderSessionItem = (session: ChatSession) => (
    <div
      key={session.id}
      className={`group p-3 rounded-lg cursor-pointer transition-all mb-2 relative ${
        activeSession === session.id 
          ? isDarkMode 
            ? 'bg-blue-900/30 border border-blue-800' 
            : 'bg-blue-50 border border-blue-100'
          : isDarkMode
            ? 'hover:bg-primary/20'
            : 'hover:bg-primary/20'
      }`}
    >
      {editingSessionId === session.id ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveRename(session.id);
              if (e.key === 'Escape') onCancelRename();
            }}
            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={() => onSaveRename(session.id)}
            className="p-1 hover:bg-green-100 rounded text-green-600"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCancelRename}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div onClick={() => onLoadSession(session.id)}>
          <div className="flex items-start justify-between mb-1">
            <h3 className={`text-sm font-medium truncate flex-1 dark:text-white ${
              activeSession === session.id ? 'text-blue-600' : 'text-gray-800'
            }`}>
              {session.title}
            </h3>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${
                activeSession === session.id ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {formatTime(session.date)}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                <button
                  onClick={(e) => onStartRename(session, e)}
                  className="p-1 hover:bg-blue-100 rounded text-blue-600"
                  title="Rename"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => onDeleteConversation(session.id, session.conversationId, e)}
                  className="p-1 hover:bg-red-100 rounded text-red-600 relative"
                  title="Delete"
                  disabled={isDeletingSession === session.id}
                >
                  {isDeletingSession === session.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 truncate">{session.subtitle}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={`
      ${isOpen ? 'w-72' : 'w-0'} 
      ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
      ${isOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      fixed sm:relative inset-y-0 left-0 z-50
      sm:border-r flex flex-col transition-all duration-300 ease-in-out overflow-hidden
    `}>
      {/* Sidebar Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            <History className="w-4 h-4" />
            <h2 className="text-sm font-semibold">History</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClearChat}
              className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
              title="Clear all history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className={`w-full py-2 px-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm font-medium ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200' 
              : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Sessions */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading History Indicator */}
        {isLoadingHistory && (
          <div className="px-4 py-6 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading history...</span>
          </div>
        )}
        
        {/* Loading Session Indicator */}
        {isLoadingSession && (
          <div className="px-4 py-3 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
          </div>
        )}
        
        {/* TODAY Section */}
        <div className="px-4 pt-4">
          <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Today</p>
          
          {/* Current Session */}
          {activeSession === 'current' && currentMessages.length > 0 && (
            <div 
              onClick={() => onLoadSession('current')}
              className={`p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                isDarkMode 
                  ? 'bg-blue-900/30 border border-blue-800' 
                  : 'bg-blue-50 border border-blue-100'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className={`text-sm font-medium truncate flex-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Current Session</h3>
                <span className={`text-xs ml-2 ${isDarkMode ? 'text-blue-500' : 'text-blue-400'}`}>Now</span>
              </div>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentMessages.length > 0 ? currentMessages[0].content.substring(0, 40) + '...' : ''}
              </p>
            </div>
          )}
          
          {todaySessions.map(renderSessionItem)}
        </div>

        {/* YESTERDAY Section */}
        {yesterdaySessions.length > 0 && (
          <div className="px-4 pt-4">
            <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Yesterday</p>
            {yesterdaySessions.map(renderSessionItem)}
          </div>
        )}

        {/* LAST 7 DAYS Section */}
        {last7DaysSessions.length > 0 && (
          <div className="px-4 pt-4">
            <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last 7 Days</p>
            {last7DaysSessions.map(renderSessionItem)}
          </div>
        )}
      </div>
    </div>
  );
};
