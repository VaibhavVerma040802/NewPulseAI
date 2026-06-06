"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [article, setArticle] = useState<any>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState<"QUICK" | "DETAILED" | "BULLETS">("QUICK");
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get(`/news/${id}`);
        setArticle(response.data);
      } catch (error) {
        console.error("Failed to fetch article", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        // Adjust endpoint for different summary types if backend supports it
        const response = await api.get(`/news/${id}/summary`);
        setSummary(response.data.summary);
      } catch (error) {
        setSummary("Failed to load AI summary. Please try again later.");
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, [id]);

  if (loading || !article) {
    return (
      <div className="min-h-screen bg-[#0a101a] font-sans">
        <Navbar />
        <div className="max-w-[820px] mx-auto p-[28px_20px] text-center text-[#94a3b8]">
          Loading article...
        </div>
      </div>
    );
  }

  const cat = article.category || "Technology";
  const sentiment = article.sentiment?.headline_sentiment || "NEUTRAL";
  const source = article.source_name || "Unknown Source";
  const ago = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  
  const catColor = cat === "Technology" ? "#6366f1" : cat === "Business" ? "#0ea5e9" : "#8b5cf6";
  const sentColor = sentiment === "POSITIVE" ? "#16a34a" : sentiment === "NEGATIVE" ? "#dc2626" : "#f59e0b";

  return (
    <div className="min-h-screen bg-[#0a101a] font-sans">
      <Navbar />
      <div className="max-w-[820px] mx-auto py-[28px] px-[20px]">
        <button 
          onClick={() => router.back()}
          className="bg-transparent border-none text-[#64748b] cursor-pointer font-sans text-[13px] mb-[20px] hover:text-[#f1f5f9] transition-colors"
        >
          ← Back
        </button>

        <div className="bg-[#141e2e] border border-[#1e2d45] rounded-2xl p-[28px] mb-[20px]">
          <div className="flex gap-[7px] mb-[14px] flex-wrap">
            <span 
              className="text-[10px] font-semibold px-[8px] py-[3px] rounded uppercase tracking-[0.4px]"
              style={{ backgroundColor: `${catColor}22`, color: catColor }}
            >
              {cat}
            </span>
            <span 
              className="text-[10px] font-semibold px-[8px] py-[3px] rounded uppercase"
              style={{ backgroundColor: `${sentColor}22`, color: sentColor }}
            >
              {sentiment}
            </span>
            <span className="text-[10px] px-[8px] py-[3px] rounded bg-[#1e2d45] text-[#94a3b8]">
              ✓ Credibility: {article.credibility_score || 90}/100
            </span>
            <span className="text-[10px] px-[8px] py-[3px] rounded bg-[#1e2d45] text-[#94a3b8]">
              📰 {source}
            </span>
          </div>
          <h1 className="font-serif text-[26px] font-extrabold text-[#f1f5f9] leading-[1.3] m-0 mb-[14px]">
            {article.title}
          </h1>
          <p className="text-[#475569] text-[13px] font-sans m-0">
            By {article.author || "Unknown"} · {new Date(article.published_at).toLocaleDateString()} · {ago}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#0f1d35] to-[#14122a] border border-[#3b82f6]/25 rounded-2xl p-[22px] mb-[20px]">
          <div className="flex justify-between items-center mb-[14px]">
            <h3 className="font-serif text-[17px] text-[#f1f5f9] m-0">⚡ AI Summary</h3>
            <div className="flex gap-[5px]">
              {["QUICK", "DETAILED", "BULLETS"].map((t: any) => (
                <button 
                  key={t}
                  onClick={() => setSummaryType(t)}
                  className={`px-[9px] py-[4px] rounded-lg border cursor-pointer font-sans text-[10px] font-semibold transition-colors ${
                    summaryType === t 
                      ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#60a5fa]" 
                      : "bg-transparent border-[#1e2d45] text-[#475569] hover:text-[#94a3b8]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          {loadingSummary ? (
            <p className="text-[#94a3b8] text-[14px] leading-[1.8] font-sans">Generating AI summary...</p>
          ) : (
            summaryType === "BULLETS" ? (
              <ul className="p-0 m-0 list-none">
                {summary?.split('. ').filter(Boolean).map((b, i) => (
                  <li key={i} className="text-[#94a3b8] text-[13px] font-sans leading-[1.6] mb-[7px] flex gap-[8px]">
                    <span className="text-[#3b82f6] shrink-0">▸</span> {b.trim()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#94a3b8] text-[14px] font-sans leading-[1.8] m-0">
                {summary || article.snippet || "Summary not available."}
              </p>
            )
          )}
        </div>

        {article.entities && article.entities.length > 0 && (
          <div className="bg-[#141e2e] border border-[#1e2d45] rounded-2xl p-[22px] mb-[20px]">
            <h3 className="font-serif text-[15px] text-[#f1f5f9] m-0 mb-[14px]">🏷️ Key Entities</h3>
            <div className="flex gap-[7px] flex-wrap">
              {article.entities.map((e: any) => (
                <span 
                  key={e.entity_text} 
                  className="px-[10px] py-[4px] rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#60a5fa] text-[12px] font-sans font-medium"
                >
                  {e.entity_text} <span className="opacity-60 text-[10px] ml-1">{e.entity_type}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#141e2e] border border-[#1e2d45] rounded-2xl p-[22px] flex gap-[14px] items-center">
          <div className="text-[28px] shrink-0">💬</div>
          <div className="flex-1">
            <h3 className="font-serif text-[15px] text-[#f1f5f9] m-0 mb-[3px]">Ask AI about this article</h3>
            <p className="text-[#64748b] text-[12px] font-sans m-0">Dig deeper, compare sources, or get context</p>
          </div>
          <button 
            onClick={() => router.push(`/chat?prompt=Tell me more about the article: ${encodeURIComponent(article.title)}`)}
            className="bg-gradient-to-br from-[#3b82f6] to-[#6366f1] border-none text-white px-[18px] py-[9px] rounded-lg cursor-pointer font-sans text-[12px] font-medium whitespace-nowrap hover:opacity-90"
          >
            Open Chatbot →
          </button>
        </div>

      </div>
    </div>
  );
}
