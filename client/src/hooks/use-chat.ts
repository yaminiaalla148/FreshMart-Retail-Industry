import { useState, useCallback } from "react";
import { api } from "@shared/routes";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useChat(branchId: number) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your grocery assistant. Ask me about item locations, prices, discounts, or help with recipes!" }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!branchId) return;
    
    setIsLoading(true);
    
    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    try {
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const res = await fetch(api.chat.message.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, branchId }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Chat failed");
      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantResponse += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { 
                    role: "assistant", 
                    content: assistantResponse 
                  };
                  return newMessages;
                });
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: "assistant", 
          content: "Sorry, I had trouble connecting. Please try again." 
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  const clearMessages = useCallback(() => {
    setMessages([
      { role: "assistant", content: "Hi! I'm your grocery assistant. Ask me about item locations, prices, discounts, or help with recipes!" }
    ]);
  }, []);

  return { messages, sendMessage, isLoading, clearMessages };
}
