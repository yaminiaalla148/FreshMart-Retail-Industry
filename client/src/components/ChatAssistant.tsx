import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { useAuthStore } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { branch } = useAuthStore();
  const [location] = useLocation();
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  
  // Get branchId from URL params or auth store
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const branchIdFromUrl = params.get('branch');
  const branchId = branchIdFromUrl ? parseInt(branchIdFromUrl) : branch?.id || 1;
  
  const suggestedQuestions = [
    "Where is Kurkure?",
    "Show me discounts",
    "Which floor has vegetables?",
    "Suggest popular items"
  ];
  
  const { messages, sendMessage, isLoading } = useChat(branchId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    setSuggestionsOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
    setInput("");
    setSuggestionsOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[350px] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-border/50 z-50 flex flex-col overflow-hidden"
            data-testid="chat-assistant-panel"
          >
            <div className="p-4 bg-gradient-to-r from-primary to-emerald-600 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Smart Assistant</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Online & Ready
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 rounded-full h-8 w-8"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="flex flex-col gap-3 h-full justify-center items-center text-center">
                  <Bot className="w-8 h-8 text-primary/40" />
                  <p className="text-xs text-muted-foreground">Ask me about products, discounts, or store locations!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-white text-foreground border border-border/50 rounded-tl-sm"
                    }`}
                  >
                    {msg.content || (
                      <span className="flex gap-1 items-center h-5">
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white border-t border-border/50 space-y-3">
              {suggestionsOpen && messages.length === 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(q)}
                      className="text-left p-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-700 font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setSuggestionsOpen(true)}
                  placeholder="Ask about items or discounts..."
                  className="pr-12 rounded-xl border-border/50 bg-slate-50 focus:bg-white transition-all shadow-inner"
                  disabled={isLoading}
                  data-testid="input-chat-message"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-1 h-8 w-8 rounded-lg" 
                  disabled={isLoading || !input.trim()}
                  data-testid="button-send-chat"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40 flex items-center justify-center z-50 hover:bg-primary/90 transition-colors"
        data-testid="button-open-chat"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white animate-pulse" />
      </motion.button>
    </>
  );
}
