import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Bot,
  Clock,
  Trash2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';

// Types
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: Date;
}

export const Support = () => {
  // State
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I assist you today?', sender: 'bot', timestamp: new Date(Date.now() - 300000) },
    { id: '2', text: 'I need help with my account.', sender: 'user', timestamp: new Date(Date.now() - 240000) },
    { id: '3', text: 'Sure! What specific issue are you facing with your account?', sender: 'bot', timestamp: new Date(Date.now() - 180000) },
  ]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([
    {
      id: 'session1',
      title: 'Account Issue',
      date: new Date(Date.now() - 86400000),
      messages: [
        { id: '1', text: 'Can you help me reset my password?', sender: 'user', timestamp: new Date(Date.now() - 86400000) },
        { id: '2', text: 'Absolutely! I can guide you through the password reset process.', sender: 'bot', timestamp: new Date(Date.now() - 86350000) },
      ]
    },
    {
      id: 'session2',
      title: 'Billing Question',
      date: new Date(Date.now() - 172800000),
      messages: [
        { id: '1', text: 'When will I be charged for my subscription?', sender: 'user', timestamp: new Date(Date.now() - 172800000) },
        { id: '2', text: 'Your subscription renews on the 15th of each month.', sender: 'bot', timestamp: new Date(Date.now() - 172795000) },
      ]
    },
    {
      id: 'session3',
      title: 'Feature Request',
      date: new Date(Date.now() - 259200000),
      messages: [
        { id: '1', text: 'Do you have dark mode?', sender: 'user', timestamp: new Date(Date.now() - 259200000) },
        { id: '2', text: 'Dark mode is coming in our next update!', sender: 'bot', timestamp: new Date(Date.now() - 259195000) },
      ]
    }
  ]);
  const [activeSession, setActiveSession] = useState<string>('current');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Simulate bot response
    setIsTyping(true);
    setTimeout(() => {
      const botResponses = [
        "Thanks for your message! How else can I help?",
        "I understand. Could you provide more details?",
        "Let me check that for you...",
        "I've noted your concern. Is there anything specific you'd like to know?",
        "Great question! Here's what I found..."
      ];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Load session from history
  const loadSession = (sessionId: string) => {
    if (sessionId === 'current') {
      setActiveSession('current');
      return;
    }
    
    const session = chatHistory.find(s => s.id === sessionId);
    if (session) {
      setMessages([...session.messages]);
      setActiveSession(sessionId);
      setIsHistoryOpen(false);
    }
  };

  // Start new chat
  const startNewChat = () => {
    if (messages.length > 0) {
      const newSession: ChatSession = {
        id: `session${chatHistory.length + 1}`,
        title: messages[0]?.text.substring(0, 30) + '...' || 'New Chat',
        date: new Date(),
        messages: [...messages]
      };
      
      setChatHistory(prev => [newSession, ...prev]);
    }
    
    setMessages([]);
    setActiveSession('current');
    inputRef.current?.focus();
  };

  // Clear current chat
  const clearChat = () => {
    if (messages.length > 0) {
      if (window.confirm('Are you sure you want to clear this chat?')) {
        setMessages([]);
      }
    }
  };

  // Delete history session
  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(session => session.id !== sessionId));
    if (activeSession === sessionId) {
      setActiveSession('current');
      setMessages([]);
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for history
  const formatHistoryDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-64px)]`}>
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold">AI Support Assistant</h1>
            <p className="text-sm opacity-90">24/7 Support • Instant Responses</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title={isSoundOn ? "Mute sounds" : "Unmute sounds"}
          >
            {isSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <button
            onClick={startNewChat}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            New Chat
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        <div className={`
          ${isHistoryOpen ? 'w-80' : 'w-0'} 
          bg-gray-50 border-r border-gray-200 
          transition-all duration-300 ease-in-out 
          overflow-hidden flex flex-col
        `}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">Chat History</h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Previous conversations</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Current Chat */}
            <div 
              onClick={() => loadSession('current')}
              className={`p-4 rounded-lg cursor-pointer transition-all ${activeSession === 'current' ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <h3 className="font-medium text-gray-800">Current Chat</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {messages.length > 0 
                      ? `${messages.length} messages` 
                      : 'No messages yet'}
                  </p>
                </div>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* History Sessions */}
            {chatHistory.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${activeSession === session.id ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800 truncate">{session.title}</h3>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="ml-2 p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {session.messages.length} messages
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatHistoryDate(session.date)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(session.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={clearChat}
              className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Current Chat</span>
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* History Toggle Button */}
          {!isHistoryOpen && (
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="absolute left-4 top-20 z-10 p-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 bg-linear-to-b from-white to-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
                <h3 className="text-xl font-medium mb-2">Start a Conversation</h3>
                <p className="text-center max-w-md">
                  Ask me anything! I'm here to help with account issues, billing questions, 
                  feature requests, or any other concerns you might have.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
                  {["Account Help", "Billing", "Technical Issues", "Feature Requests"].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setInputMessage(`I need help with ${topic.toLowerCase()}...`)}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <span className="font-medium text-gray-800">{topic}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-4 ${message.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`p-1 rounded-full ${message.sender === 'user' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                          {message.sender === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {message.sender === 'user' ? 'You' : 'Support AI'}
                        </span>
                        <span className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] rounded-2xl p-4 bg-gray-100 text-gray-800 rounded-bl-none">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="p-1 rounded-full bg-gray-300">
                          <Bot className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Support AI</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center space-x-4 max-w-4xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message here..."
                className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className={`p-4 rounded-xl ${!inputMessage.trim() || isTyping 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-500">
              <button 
                onClick={() => setInputMessage("How do I reset my password?")}
                className="hover:text-blue-600"
              >
                Password Reset
              </button>
              <button 
                onClick={() => setInputMessage("What are your business hours?")}
                className="hover:text-blue-600"
              >
                Business Hours
              </button>
              <button 
                onClick={() => setInputMessage("Can I upgrade my plan?")}
                className="hover:text-blue-600"
              >
                Plan Upgrade
              </button>
              <button 
                onClick={() => setInputMessage("Where can I find documentation?")}
                className="hover:text-blue-600"
              >
                Documentation
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

