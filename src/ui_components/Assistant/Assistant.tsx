import React, { useState, useEffect } from 'react';
import Support from '../support';
import CanvasPage from '../Canvas/CanvasPage';
import { SidebarProvider } from '@/components/sidebar';
import { HistorySlider } from '../support/components/HistorySlider';
import { useUser } from '@/context/UserContext';
import { AI_URL } from '../api/apiurl';

export const Assistant = () => {
  const { user } = useUser();
  const [activeView, setActiveView] = useState<'chat' | 'canvas'>('chat');
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const userId = user?.id || localStorage.getItem('userId') || 'guest';

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${AI_URL}/api/memory/conversations?userId=${userId}&limit=50&offset=0`);
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations.map((c: any) => ({
          id: c.conversation_id,
          title: c.title || 'New Conversation',
          timestamp: new Date(c.updated_at),
          preview: 'Conversation history',
          messages: [],
          type: c.metadata?.type || 'chat' // Default to chat if unknown
        })));
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  useEffect(() => {
    if (userId) fetchConversations();
  }, [userId]);

  // Reset conversation ID when view changes if the current one doesn't match
  useEffect(() => {
    const currentConv = conversations.find(c => c.id === currentConversationId);
    if (currentConv && currentConv.type !== activeView) {
      setCurrentConversationId(null);
    }
  }, [activeView, conversations, currentConversationId]);

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setShowHistory(false);
  };

  const handleCreateNew = async () => {
    const title = `New Conversation ${new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`;
    try {
      const response = await fetch(`${AI_URL}/api/memory/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, metadata: { type: activeView }, resourceId: 'assistant' })
      });
      const data = await response.json();
      const newId = data.id || data.conversation?.id;
      if (newId) {
        fetchConversations();
        setCurrentConversationId(newId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await fetch(`${AI_URL}/api/memory/conversations/${id}?userId=${userId}`, { method: 'DELETE' });
      fetchConversations();
      if (currentConversationId === id) setCurrentConversationId(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await fetch(`${AI_URL}/api/memory/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, userId })
      });
      fetchConversations();
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all history?')) return;
    try {
      await fetch(`${AI_URL}/api/memory/agent/assistant?userId=${userId}`, { method: 'DELETE' });
      setConversations([]);
      setCurrentConversationId(null);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleConversationIdChange = (id: string) => {
    if (id && id !== currentConversationId) {
      setCurrentConversationId(id);
      fetchConversations();
    }
  };

  const filteredConversations = conversations.filter(c => c.type === activeView);

  return (
    <SidebarProvider open={showHistory} onOpenChange={setShowHistory} className="h-full min-h-0 relative">
      <HistorySlider 
        agentId="assistant"
        sessions={filteredConversations}
        currentSession={filteredConversations.find(s => s.id === currentConversationId) || { id: 'none', title: '', messages: [], timestamp: new Date(), preview: '' }}
        selectedSessionId={currentConversationId || ''}
        onSelectSession={handleSelectConversation}
        onDeleteSession={handleDeleteConversation}
        onPinSession={() => {}}
        onRenameSession={handleRenameConversation}
        onClearHistory={handleClearHistory}
        onExportSession={() => {}}
        onCreateNew={handleCreateNew}
        onClose={() => setShowHistory(false)}
      />

      <div className="relative w-full h-full flex flex-col bg-[#f8f9fa] dark:bg-[#050505] flex-1">
        {/* Segmented Switch */}
        <div className="absolute top-0 left-[50%] z-50 translate-x-[-50%]">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-md">
            <button
              onClick={() => setActiveView('chat')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${activeView === 'chat' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveView('canvas')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${activeView === 'canvas' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Canvas
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden pt-5">
          {activeView === 'chat' && (
            <Support 
              conversationId={currentConversationId} 
              onToggleHistory={() => setShowHistory(!showHistory)} 
              onConversationIdChange={handleConversationIdChange}
            />
          )}
          {activeView === 'canvas' && (
            <CanvasPage 
              conversationId={currentConversationId} 
              onToggleHistory={() => setShowHistory(!showHistory)} 
              onConversationIdChange={handleConversationIdChange}
            />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

