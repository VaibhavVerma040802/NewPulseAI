"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface Citation {
  article_id: string;
  title: string;
  source: string;
  relevance_score: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm the NewsPulse AI. I have access to thousands of recent news articles. What would you like to know about today's news?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track if we've initialized the query prompt so we only do it once
  const [initializedPrompt, setInitializedPrompt] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle query parameter prompt auto-submission
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt && !initializedPrompt) {
      setInitializedPrompt(true);
      submitMessage(prompt);
    }
  }, [searchParams, initializedPrompt]);

  const submitMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.post("/chat", {
        message: userMessage.content,
        session_id: sessionId
      });
      
      const data = response.data;
      if (!sessionId && data.session_id) {
        setSessionId(data.session_id);
      }
      
      const aiMessage: Message = {
        id: Date.now().toString() + "_ai",
        role: "assistant",
        content: data.reply,
        citations: data.citations
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "_error",
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input;
    setInput("");
    await submitMessage(currentInput);
  };

  return (
    <div className="min-h-screen bg-[#0a101a] font-sans flex flex-col">
      <Navbar />
      
      <div className="max-w-[900px] w-full mx-auto h-[calc(100vh-57px)] flex flex-col p-5 pb-10">
        <div className="text-center mb-[30px] shrink-0">
          <h1 className="font-serif text-[32px] font-bold text-[#f1f5f9] m-0 mb-2">Ask NewsPulse</h1>
          <p className="text-[#64748b] text-[14px] m-0">Our RAG pipeline retrieves the most relevant articles to answer your questions.</p>
        </div>

        <div className="flex-1 bg-[#141e2e] border border-[#1e2d45] rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                >
                  {msg.role === "assistant" ? (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[16px] shrink-0">
                      ⚡
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-[12px] shrink-0">
                      AK
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <div className={`font-sans text-[14px] leading-[1.5] whitespace-pre-wrap ${
                      msg.role === "user" 
                        ? "bg-[#3b82f6] text-white p-3 rounded-[12px_0_12px_12px]" 
                        : "bg-[#1e2d45] text-[#f1f5f9] p-3 rounded-[0_12px_12px_12px]"
                    }`}>
                      {msg.content}
                    </div>
                    
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex gap-[6px] flex-wrap">
                        {msg.citations.map((cite, i) => (
                          <span 
                            key={i} 
                            className="text-[11px] text-[#94a3b8] bg-[#0a101a] border border-[#1e2d45] px-2 py-1 rounded-[4px] flex items-center gap-1 cursor-pointer hover:bg-[#1e2d45]"
                            title={cite.title}
                          >
                            📰 {cite.source}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[80%] self-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[16px] shrink-0">
                  ⚡
                </div>
                <div className="bg-[#1e2d45] text-[#94a3b8] p-3 rounded-[0_12px_12px_12px] font-sans text-[14px]">
                  Thinking...
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[#1e2d45] bg-[#0f1623]">
            <form onSubmit={handleSend} className="flex gap-2.5 bg-[#0a101a] border border-[#1e2d45] rounded-xl p-2 relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any news topic..."
                className="flex-1 bg-transparent border-none text-[#f1f5f9] font-sans text-[14px] px-2 focus:outline-none placeholder:text-[#475569]"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 border-none text-white w-9 h-9 rounded-lg cursor-pointer flex items-center justify-center transition-colors"
              >
                →
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
