import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Copy, Check, User, Zap } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "justify-end"}`}>
      {isAssistant && (
        <div className="flex-shrink-0 h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center mt-1">
          <Zap className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={`relative max-w-[85%] rounded-lg px-4 py-3 text-sm ${
          isAssistant
            ? "bg-muted/50 border border-border"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-sm prose-invert max-w-none [&_table]:w-full [&_table]:text-xs [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:border-b [&_th]:border-border [&_th]:font-semibold [&_td]:px-2 [&_td]:py-1.5 [&_td]:border-b [&_td]:border-border/50 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h3]:text-xs [&_h3]:font-semibold [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_strong]:text-foreground">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {isAssistant && message.content && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            onClick={handleCopy}
            style={{ opacity: copied ? 1 : undefined }}
          >
            {copied ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 h-7 w-7 rounded-md bg-secondary flex items-center justify-center mt-1">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}
