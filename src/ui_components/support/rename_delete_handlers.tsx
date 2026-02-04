import { useState } from 'react';
import { AI_URL } from '../api/apiurl';

export interface ChatSession {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  conversationId: string;
}

interface UseChatHistoryActionsProps {
  userId: string;
  activeSession: string;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveSession: React.Dispatch<React.SetStateAction<string>>;
  loadConversationHistory: () => Promise<void>;
}

export const useChatHistoryActions = ({
  userId,
  activeSession,
  setChatHistory,
  setMessages,
  setCurrentConversationId,
  setActiveSession,
  loadConversationHistory
}: UseChatHistoryActionsProps) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [isDeletingSession, setIsDeletingSession] = useState<string | null>(null);

  // Delete a conversation
  const deleteConversation = async (sessionId: string, conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the conversation
    
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      setIsDeletingSession(sessionId);
      try {
        const response = await fetch(
          `${AI_URL}/memory/conversation/${conversationId}?userId=${userId}`,
          { method: 'DELETE' }
        );
        
        if (response.ok) {
          // Remove from chat history
          setChatHistory(prev => prev.filter(session => session.id !== sessionId));
          
          // If this was the active session, clear it
          if (activeSession === sessionId) {
            setMessages([]);
            setCurrentConversationId(null);
            setActiveSession('current');
          }
          
          // Optionally reload to ensure sync
          await loadConversationHistory();
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      } finally {
        setIsDeletingSession(null);
      }
    }
  };

  // Start renaming a conversation
  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the conversation
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  // Save renamed conversation
  const saveRename = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      // For now, we update local state. 
      // If there's an endpoint for renaming, we should call it here.
      setChatHistory(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: editingTitle.trim() }
          : session
      ));
      
      setEditingSessionId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  // Cancel renaming
  const cancelRename = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  return {
    editingSessionId,
    editingTitle,
    isDeletingSession,
    setEditingTitle,
    deleteConversation,
    startRename,
    saveRename,
    cancelRename
  };
};
