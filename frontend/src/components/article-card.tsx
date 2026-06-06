"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CATCOL: Record<string, string> = {
  Technology: "#6366f1",
  Business: "#0ea5e9",
  Politics: "#8b5cf6",
  Health: "#10b981",
  Finance: "#f59e0b",
  Science: "#06b6d4",
  Sports: "#ef4444",
  Entertainment: "#ec4899",
  General: "#8b5cf6"
};

const CATEMOJI: Record<string, string> = {
  Technology: "🤖",
  Business: "📊",
  Politics: "🌍",
  Health: "💊",
  Finance: "💹",
  Science: "🔭",
  Sports: "🏆",
  Entertainment: "🎭",
  General: "📰"
};

const SENTCOL: Record<string, string> = {
  POSITIVE: "#16a34a",
  NEUTRAL: "#d97706",
  NEGATIVE: "#dc2626"
};

interface ArticleProps {
  article: {
    article_id: string;
    title: string;
    source_name: string;
    snippet?: string;
    published_at: string;
    url: string;
    category?: string;
    sentiment?: { headline_sentiment: string };
    credibility?: { score: number };
  };
  initialBookmarked?: boolean;
}

export function ArticleCard({ article, initialBookmarked = false }: ArticleProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  const cat = article.category || "General";
  const catColor = CATCOL[cat] || "#6366f1";
  const catEmoji = CATEMOJI[cat] || "📰";
  const sentiment = article.sentiment?.headline_sentiment || "NEUTRAL";
  const sentColor = SENTCOL[sentiment] || "#d97706";
  const cred = article.credibility ? Math.round(article.credibility.score) : 85;
  const ago = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });

  const toggleBm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!bookmarked) {
        await api.post("/bookmarks", { article_id: article.article_id });
        setBookmarked(true);
      } else {
        await api.post("/bookmarks", { article_id: article.article_id });
        setBookmarked(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div 
      className="art-card" 
      onClick={() => router.push(`/article/${article.article_id}`)}
    >
      <div className="flex justify-between items-start gap-2.5">
        <div className="flex-1">
          <div className="flex gap-[6px] mb-2 flex-wrap">
            <span 
              style={{ background: `${catColor}22`, color: catColor }}
              className="text-[10px] font-semibold px-[7px] py-[3px] rounded bg-opacity-20 uppercase tracking-[0.4px]"
            >
              {cat}
            </span>
            <span 
              style={{ background: `${sentColor}22`, color: sentColor }}
              className="text-[10px] font-semibold px-[7px] py-[3px] rounded uppercase"
            >
              {sentiment}
            </span>
            {article.credibility && (
              <span className="text-[10px] px-[7px] py-[3px] rounded bg-[#1e2d45] text-[#94a3b8]">
                ✓ {cred}/100
              </span>
            )}
          </div>
          <h3 className="font-serif text-[14px] font-bold text-[#f1f5f9] m-0 leading-[1.4]">
            {article.title}
          </h3>
        </div>
        <div className="text-[28px] shrink-0">{catEmoji}</div>
      </div>
      
      <p className="text-[12px] text-[#64748b] leading-[1.6] my-2 line-clamp-3">
        {article.snippet}
      </p>
      
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#1e2d45]/50">
        <span className="text-[11px] text-[#475569]">📰 {article.source_name} · {ago}</span>
        <button 
          onClick={toggleBm} 
          className="bg-transparent border-none text-[16px] cursor-pointer hover:scale-110 transition-transform"
          style={{ color: bookmarked ? "#f59e0b" : "#475569" }}
          title={bookmarked ? "Remove Bookmark" : "Bookmark Article"}
        >
          {bookmarked ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}
