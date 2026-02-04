import React, { useEffect, useRef } from 'react';
import {
  Bot,
  MessageCircle,
  Workflow,
  Users,
  History,
  PlayCircle,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { Message, SuggestionCard } from '../types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ChatMessagesProps {
  messages: Message[];
  typingText: string;
  isGeneratingTable: boolean;
  isDarkMode: boolean;
  onViewTable: (data: any[]) => void;
  onSuggestionClick: (message: string) => void;
  extractJSON: (
    text: string
  ) => {
    hasJSON: boolean;
    jsonData: any[] | null;
    beforeJSON: string;
    afterJSON: string;
    isPartialJSON?: boolean;
  };
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  streamingThinking?: string; // Add thinking text for streaming
}

/* -----------------------------
   Helper: Extract numbered list
------------------------------ */
const extractNumberedList = (text: string) => {
  if (!text || !text.trim()) {
    return { title: '', items: [] };
  }

  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const items = lines
    .filter(line => /^\d+\.\s+/.test(line))
    .map(line => line.replace(/^\d+\.\s+/, ''));

  const title =
    items.length > 0 && !/^\d+\./.test(lines[0])
      ? lines[0]
      : '';

  return { title, items };
};

export const ChatMessages = ({
  messages,
  typingText,
  isGeneratingTable,
  isDarkMode,
  onViewTable,
  onSuggestionClick,
  extractJSON,
  messagesEndRef,
  isLoading,
  // streamingThinking
}: ChatMessagesProps) => {
  // Ref for auto-scroll thinking content
  const thinkingRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll thinking content to bottom during streaming
  useEffect(() => {
    messages.forEach((message) => {
      if (message.thinking && isLoading) {
        const ref = thinkingRefs.current[`thinking-${message.id}`];
        if (ref) {
          ref.scrollTop = ref.scrollHeight;
        }
      }
    });
  }, [messages, isLoading]);

  /* -----------------------------
     Suggestion Cards
  ------------------------------ */
  const suggestionCards: SuggestionCard[] = [
    {
      icon: <Workflow className="w-5 h-5" />,
      title: 'List Workflows',
      description: 'View all workflows in your workspace',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      message: 'List all workflows'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'List Agents',
      description: 'See all AI agents and their status',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      message: 'List all agents'
    },
    {
      icon: <History className="w-5 h-5" />,
      title: 'Last Workflow Run',
      description: 'Check the most recent workflow execution',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      message: 'Show my last workflow run details'
    },
    {
      icon: <PlayCircle className="w-5 h-5" />,
      title: 'Run History',
      description: 'View recent workflow executions',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      message: 'Show recent workflow runs'
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      title: 'Failed Runs',
      description: 'Find workflows that failed recently',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      message: 'Show failed workflow runs'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Workflow Status',
      description: 'Check if workflows are active or paused',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      message: 'Check workflow status'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      {/* =============================
         WELCOME SCREEN
      ============================== */}
      {messages.length === 0 && !typingText ? (
        <div className="max-w-7xl mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`p-6 rounded-3xl shadow-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <MessageCircle
                className={`w-12 h-12 ${
                  isDarkMode ? 'text-violet-400' : 'text-violet-600'
                }`}
              />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-12">
            <h2
              className={`text-3xl font-bold mb-3 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}
            >
              How can we help you today?
            </h2>
            <p
              className={`max-w-xl mx-auto ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              I'm your AI workflow assistant. Ask me about workflows, agents, or
              execution history.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-4">
            {suggestionCards.map((card, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(card.message)}
                disabled={isLoading}
                className={`p-5 rounded-2xl border transition-all text-left group ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-violet-500'
                    : 'bg-white border-gray-200 hover:border-violet-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`inline-flex p-2.5 ${card.bgColor} rounded-lg mb-3 ${card.iconColor}`}
                >
                  {card.icon}
                </div>
                <h3
                  className={`font-semibold mb-1 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}
                >
                  {card.title}
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* =============================
           CHAT MESSAGES
        ============================== */
        <div className="max-w-[90%] mx-auto space-y-6">
          {messages.map((message, index) => {
            const { hasJSON, jsonData, beforeJSON, isPartialJSON } =
              message.role === 'assistant'
                ? extractJSON(message.content)
                : {
                    hasJSON: false,
                    jsonData: null,
                    beforeJSON: message.content,
                    isPartialJSON: false
                  };

            // Check if this is the last message and currently streaming
            const isLastMessage = index === messages.length - 1;
            const isStreamingThisMessage = isLastMessage && isLoading && message.thinking;

            return (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                {/* =============================
                   ASSISTANT WITH JSON
                ============================== */}
                {message.role === 'assistant' && (hasJSON || isPartialJSON) ? (
                  <div className="flex items-start space-x-3 w-full">
                    <div
                      className={`p-2 rounded-full ${
                        isDarkMode ? 'bg-gray-800' : 'bg-primary/10'
                      }`}
                    >
                      <Bot className="w-4 h-4 text-primary" />
                    </div>

                    <div
                      className={`flex-1 rounded-2xl px-4 py-3 ${
                        isDarkMode
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {(() => {
                        if (!beforeJSON || !beforeJSON.trim()) {
                          return null;
                        }

                        const { title, items } = extractNumberedList(beforeJSON.trim());

                        return (
                          <div className="space-y-3">
                            {/* Thinking Accordion */}
                            {message.thinking && (
                              <Accordion 
                                key={`accordion-${message.id}-${isStreamingThisMessage ? 'open' : 'closed'}`}
                                type="single" 
                                collapsible 
                                className="w-full"
                                defaultValue={isStreamingThisMessage ? 'thinking' : ''}
                              >
                                <AccordionItem value="thinking" className="border-none">
                                  <AccordionTrigger className="text-xs font-medium text-muted-foreground hover:no-underline py-2">
                                    🤔 View Thinking Process
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div 
                                      ref={(el) => {
                                        thinkingRefs.current[`thinking-${message.id}`] = el;
                                      }}
                                      className="max-h-[180px] overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap"
                                    >
                                      {message.thinking}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}

                            {/* Title */}
                            {title && !/^\d+\./.test(title) && (
                              <p className="font-semibold text-sm">
                                {title}
                              </p>
                            )}

                            {/* Pills */}
                            <div className="grid grid-cols-2 gap-2">
                              {items.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 rounded-full text-xs font-medium
                                    bg-violet-100 text-violet-700
                                    dark:bg-violet-900/30 dark:text-violet-300 w-fit"
                                >
                                  {idx + 1}. {item}
                                </span>
                              ))}
                            </div>

                            {/* Loading or View Table */}
                            {isPartialJSON ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                <span>Generating table...</span>
                              </div>
                            ) : jsonData && jsonData.length > 0 && (
                              <button
                                onClick={() => onViewTable(jsonData)}
                                className="text-primary hover:underline font-medium text-sm"
                              >
                                View Table
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : message.role === 'user' ? (
                  /* USER MESSAGE */
                  <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-primary text-white">
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  /* ASSISTANT TEXT */
                  <div className="flex items-start space-x-3 max-w-[75%]">
                    <div
                      className={`p-2 rounded-full ${
                        isDarkMode ? 'bg-gray-800' : 'bg-primary/10'
                      }`}
                    >
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div
                      className={`flex-1 rounded-2xl px-4 py-3 ${
                        isDarkMode
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {/* Check if message has thinking text */}
                      {message.thinking ? (
                        <div className="space-y-2">
                          <Accordion 
                            key={`accordion-${message.id}-${isStreamingThisMessage ? 'open' : 'closed'}`}
                            type="single" 
                            collapsible 
                            className="w-full"
                            defaultValue={isStreamingThisMessage ? 'thinking' : ''}
                          >
                            <AccordionItem value="thinking" className="border-none">
                              <AccordionTrigger className="text-xs font-medium text-muted-foreground hover:no-underline py-2">
                                🤔 View Thinking Process
                              </AccordionTrigger>
                              <AccordionContent>
                                <div 
                                  ref={(el) => {
                                    thinkingRefs.current[`thinking-${message.id}`] = el;
                                  }}
                                  className="max-h-[180px] overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap"
                                >
                                  {message.thinking}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* =============================
             TYPING INDICATOR
          ============================== */}
          {typingText && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[75%]">
                <div
                  className={`p-2 rounded-full ${
                    isDarkMode ? 'bg-gray-800' : 'bg-primary/10'
                  }`}
                >
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div
                  className={`flex-1 rounded-2xl px-4 py-3 ${
                    isDarkMode
                      ? 'bg-gray-800 text-gray-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{typingText}</p>
                  {isGeneratingTable && (
                    <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                      <span>Generating table...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
