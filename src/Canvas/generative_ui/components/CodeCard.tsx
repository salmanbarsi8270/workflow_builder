import { cn } from '@/lib/utils';
import { Copy, Terminal, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import * as Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Supported languages for syntax highlighting
const LANGUAGES = {
  json: 'json',
  javascript: 'javascript',
  typescript: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  python: 'python',
  bash: 'bash',
  html: 'html',
  css: 'css',
  sql: 'sql',
} as const;

export const CodeCard = ({
  code,
  title,
  language = 'json',
  className,
  showLineNumbers = true,
  maxHeight = '400px',
  span,
  rowSpan
}: any) => {
  const spanClass = span ? (typeof span === 'string' ? span : `col-span-${span}`) : 'col-span-12';
  const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  // Get language for syntax highlighting
  const lang = LANGUAGES[language as keyof typeof LANGUAGES] || 'json';

  // Format and highlight code
  const formattedCode = (() => {
    if (language === 'json') {
      try {
        return JSON.stringify(JSON.parse(code), null, 2);
      } catch {
        return code;
      }
    }
    return code;
  })();

  // Syntax highlighting
  const highlightedCode = (() => {
    try {
      return Prism.highlight(formattedCode, Prism.languages[lang], lang);
    } catch {
      return formattedCode;
    }
  })();

  return (
    <div className={cn(
      "group flex flex-col rounded-lg border border-border bg-card shadow-sm",
      "transition-all hover:shadow-md",
      spanClass,
      rowSpanClass,
      className
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">
              {title || language.toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {language}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all",
            "hover:bg-primary/10 active:scale-95",
            copied
              ? "text-green-600 bg-green-50 dark:bg-green-950/30"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="relative">
        {/* Gradient scroll indicators */}
        <div className="absolute inset-x-0 top-0 h-4 bg-linear-to-b from-card/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-linear-to-t from-card/80 to-transparent z-10 pointer-events-none" />

        {/* Code content */}
        <div
          className="overflow-x-auto overflow-y-auto p-4"
          style={{ maxHeight }}
        >
          <div className="relative min-w-min">
            {showLineNumbers && (
              <div className="absolute left-0 top-0 bottom-0 pr-3 text-right select-none border-r border-border/50">
                {formattedCode.split('\n').map((_: any, i: number) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground/50 px-1 font-mono"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            )}

            <pre className={cn(
              "font-mono text-sm leading-relaxed",
              showLineNumbers && "pl-12"
            )}>
              <code
                className={cn(
                  `language-${lang}`,
                  "text-foreground/90"
                )}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <span>{language}</span>
        <span className="text-[10px]">
          {formattedCode.split('\n').length} lines
        </span>
      </div>
    </div>
  );
};