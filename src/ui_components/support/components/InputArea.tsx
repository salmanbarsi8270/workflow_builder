import { Send, Paperclip, Code, Smile } from 'lucide-react';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isDarkMode: boolean;
  onSuggestionClick: (message: string) => void;
}

export const InputArea = ({ 
  value, 
  onChange, 
  onSend, 
  isLoading, 
  isDarkMode,
  onSuggestionClick 
}: InputAreaProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`border-t p-6 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Input Container */}
        <div className={`rounded-2xl border shadow-sm ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center px-4 py-3">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isLoading}
              className={`flex-1 bg-transparent focus:outline-none ${
                isDarkMode 
                  ? 'text-gray-100 placeholder-gray-500' 
                  : 'text-gray-900 placeholder-gray-400'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            
            <button
              onClick={onSend}
              disabled={!value.trim() || isLoading}
              className={`ml-3 p-2.5 rounded-xl transition-all ${
                !value.trim() || isLoading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-violet-600 hover:bg-violet-700'
              } text-white`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Bottom Bar */}
          <div className={`flex items-center justify-between px-4 py-2 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            {/* Left Icons */}
            <div className="flex items-center space-x-2">
              <button 
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button 
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Insert code"
              >
                <Code className="w-4 h-4" />
              </button>
              <button 
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>
            
            {/* Right Hint */}
            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Press 'Enter' to send
            </span>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="flex justify-center items-center space-x-6 mt-4 text-xs">
          <button 
            onClick={() => onSuggestionClick("List all workflows")}
            className={`transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-violet-400' : 'text-gray-500 hover:text-violet-600'
            }`}
          >
            List Workflows
          </button>
          <button 
            onClick={() => onSuggestionClick("List all agents")}
            className={`transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-violet-400' : 'text-gray-500 hover:text-violet-600'
            }`}
          >
            List Agents
          </button>
          <button 
            onClick={() => onSuggestionClick("Show recent workflow runs")}
            className={`transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-violet-400' : 'text-gray-500 hover:text-violet-600'
            }`}
          >
            Run History
          </button>
          <button 
            onClick={() => onSuggestionClick("Show failed workflow runs")}
            className={`transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-violet-400' : 'text-gray-500 hover:text-violet-600'
            }`}
          >
            Failed Runs
          </button>
        </div>
      </div>
    </div>
  );
};
