"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export interface Article {
  id: string | number;
  category: string;
  title: string;
  source: string;
  published_at: string;
  sentiment: string;
  credibility_score: number;
  summary_quick: string;
}

const CATCOL: Record<string, string> = { 
  Technology: "#6366f1", 
  Business: "#0ea5e9", 
  Politics: "#8b5cf6", 
  Health: "#10b981", 
  Finance: "#f59e0b", 
  Science: "#06b6d4", 
  Sports: "#ef4444", 
  Entertainment: "#ec4899" 
};

const SENTCOL: Record<string, string> = { 
  POSITIVE: "#16a34a", 
  NEUTRAL: "#d97706", 
  NEGATIVE: "#dc2626" 
};

const ICONS: Record<string, string> = {
  Technology: "🤖",
  Business: "📊",
  Politics: "🌍",
  Health: "💊",
  Finance: "💹",
  Science: "🔭",
  Sports: "🏅",
  Entertainment: "🎭"
};

function formatTimeAgo(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return dateStr;
  }
}

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export function ArticleCard({ article, initialBookmarked = false }: { article: Article, initialBookmarked?: boolean }) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const toggleBm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real implementation, you would call the backend here
    // await api.post(`/articles/${article.id}/bookmark`);
    setBookmarked(!bookmarked);
  };

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiSummary) {
      setAiSummary(null);
      return;
    }
    setSummarizing(true);
    try {
      // Use full URL if article.id is string
      const res = await api.post(`/nlp/summarize/${article.id}`);
      setAiSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setAiSummary("AI summary generation failed or timed out.");
    } finally {
      setSummarizing(false);
    }
  };

  const catColor = CATCOL[article.category] || "#6366f1";
  const sentColor = SENTCOL[article.sentiment] || "#d97706";
  const icon = ICONS[article.category] || "📰";

  return (
    <div className="art-card" onClick={() => router.push(`/article/${article.id}`)}>
      <div className="flex justify-between items-start gap-2.5">
        <div className="flex-1">
          <div className="flex gap-1.5 mb-2 flex-wrap">
            <span 
              className="text-[10px] font-semibold px-[7px] py-[3px] rounded bg-opacity-20 uppercase tracking-[0.4px]"
              style={{ backgroundColor: `${catColor}22`, color: catColor }}
            >
              {article.category}
            </span>
            <span 
              className="text-[10px] font-semibold px-[7px] py-[3px] rounded bg-opacity-20 uppercase"
              style={{ backgroundColor: `${sentColor}22`, color: sentColor }}
            >
              {article.sentiment || "NEUTRAL"}
            </span>
            <span className="text-[10px] px-[7px] py-[3px] rounded bg-muted text-muted-foreground">
              ✓ {article.credibility_score || 90}/100
            </span>
          </div>
          <h3 className="font-serif text-[14px] font-bold text-foreground m-0 leading-[1.4]">
            {article.title}
          </h3>
        </div>
        <div className="text-[28px] shrink-0">{icon}</div>
      </div>
      <p className="text-[12px] text-muted-foreground leading-[1.6] my-2 line-clamp-2">
        {article.summary_quick}
      </p>

      <AnimatePresence>
        {aiSummary && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 mb-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-[13px] text-foreground leading-[1.6]">
              <div className="flex items-center gap-1.5 font-semibold text-primary mb-1 text-[11px] uppercase tracking-wider">
                <Sparkles size={12} /> AI Summary
              </div>
              {aiSummary}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/50">
        <span className="text-[11px] text-muted-foreground/80">
          📰 {article.source} · {formatTimeAgo(article.published_at)}
        </span>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSummarize}
            disabled={summarizing}
            className="flex items-center gap-1.5 bg-transparent border border-border text-[11px] font-medium text-foreground px-2 py-1 rounded cursor-pointer hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Sparkles size={12} className={aiSummary ? "text-primary" : "text-muted-foreground"} />
            {summarizing ? "Thinking..." : aiSummary ? "Hide Summary" : "Summarize"}
          </button>
          <button 
            onClick={toggleBm} 
            className="bg-transparent border-none text-[16px] cursor-pointer"
            style={{ color: bookmarked ? "#f59e0b" : "#475569" }}
          >
            {bookmarked ? "★" : "☆"}
          </button>
        </div>
      </div>
    </div>
  );
}
