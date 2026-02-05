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
    thinking?: string;
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

const TableSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className={`w-full mt-4 rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white'} overflow-hidden`}>
    <div className={`h-10 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'} flex items-center px-4 space-x-4`}>
      <div className={`h-3 w-20 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-32 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-24 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
    <div className="p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className={`h-2 w-full rounded animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
          <div className={`h-2 w-full rounded animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
          <div className={`h-2 w-full rounded animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
        </div>
      ))}
    </div>
    <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-center space-x-2`}>
       <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
       <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Generating Data Insights...</span>
    </div>
  </div>
);

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
    description:
      'Get a complete overview of all workflows in your workspace, including their current status, creation details, and whether they are active or paused.',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    message: 'List all workflows and explain their current status'
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'List Agents',
    description:
      'View all AI agents configured in your system, along with their roles, activity state, and how they contribute to your workflow executions.',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    message: 'List all agents and summarize what each one does'
  },
  {
    icon: <History className="w-5 h-5" />,
    title: 'Last Workflow Run',
    description:
      'Inspect the most recent workflow execution, including when it ran, whether it succeeded or failed, and what that result means for your system.',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    message: 'Show my last workflow run and explain the result'
  },
  {
    icon: <PlayCircle className="w-5 h-5" />,
    title: 'Run History',
    description:
      'Analyze recent workflow executions over time to understand activity patterns, system stability, and overall execution trends.',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    message: 'Show recent workflow runs with a clear summary'
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Failed Runs',
    description:
      'Identify workflows that failed recently, including how often failures occur and what their current impact is on your automation setup.',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    message: 'Show failed workflow runs and explain the failures'
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: 'Workflow Status',
    description:
      'Check which workflows are currently active, paused, or inactive, and understand the overall operational state of your automation system.',
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    message: 'Check workflow status and summarize system health'
  }
];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* =============================
         WELCOME SCREEN
      ============================== */}
      {messages.length === 0 && !typingText ? (
        <div className="max-w-7xl mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div
              className={`p-4 sm:p-6 rounded-3xl shadow-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <MessageCircle
                className={`w-8 h-8 sm:w-12 sm:h-12 ${
                  isDarkMode ? 'text-violet-400' : 'text-violet-600'
                }`}
              />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h2
              className={`text-2xl sm:text-3xl font-bold mb-3 ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
            {suggestionCards.map((card, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(card.message)}
                disabled={isLoading}
                className={`p-4 sm:p-5 rounded-2xl border transition-all text-left group ${
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
        <div className="w-full max-w-5xl mx-auto space-y-6">
          {messages.map((message, index) => {
            const { hasJSON, jsonData, beforeJSON, isPartialJSON, thinking: extractedThinking } =
              message.role === 'assistant'
                ? extractJSON(message.content)
                : {
                    hasJSON: false,
                    jsonData: null,
                    beforeJSON: message.content,
                    isPartialJSON: false,
                    thinking: undefined
                  };

            const thinking = message.thinking || extractedThinking;

            // Check if this is the last message and currently streaming
            const isLastMessage = index === messages.length - 1;
            const isStreamingThisMessage = isLastMessage && isLoading && thinking;

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
                        const { title, items } = extractNumberedList(beforeJSON.trim());

                        return (
                          <div className="space-y-3">
                            {/* Thinking Accordion */}
                            {thinking && (
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
                                      {thinking}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}

                            {beforeJSON.trim() && (
                              <>
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
                              </>
                            )}

                            {/* Loading or View Table */}
                            {isPartialJSON ? (
                              <TableSkeleton isDarkMode={isDarkMode} />
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
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 bg-primary text-white">
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  /* ASSISTANT TEXT */
                  <div className="flex items-start space-x-3 max-w-[85%] sm:max-w-[75%]">
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
                      {thinking ? (
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
              <div className="flex items-start space-x-3 max-w-[85%] sm:max-w-[75%]">
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
