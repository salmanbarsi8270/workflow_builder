// Shared types for Support components
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;       // FINAL OUTPUT ONLY
  thinking?: string;     // THINKING ONLY
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  conversationId: string;
}

export interface SuggestionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
  message: string;
}
