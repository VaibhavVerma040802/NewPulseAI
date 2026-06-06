"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ArticleCard, Article } from "@/components/ArticleCard";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommended");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, articlesRes] = await Promise.all([
          api.get("/users/me/stats").catch(() => ({ data: {} })),
          api.get("/articles?limit=3").catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data);
        setRecentArticles(articlesRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-57px)] text-primary">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const articlesRead = stats?.articles_read || 0;
  const timeSaved = stats?.time_saved_minutes || 0;
  const queries = stats?.queries || 0;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <div className="max-w-[1100px] mx-auto px-5 py-[28px]">
        <div className="flex justify-between items-start mb-[28px] flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-[27px] font-bold text-foreground m-0 mb-[3px]">
              Good morning 👋
            </h1>
            <p className="text-muted-foreground text-[13px] m-0">Your personalized news intelligence for today</p>
          </div>
          <button 
            onClick={() => router.push('/chat')}
            className="bg-gradient-to-br from-primary to-primary/80 border-none text-white px-[18px] py-[9px] rounded-lg cursor-pointer font-medium text-[13px] hover:opacity-90 transition-opacity"
          >
            💬 Ask AI
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px] mb-[24px]">
          <div className="bg-card border border-border rounded-xl p-[18px]">
            <p className="text-muted-foreground text-[10px] font-semibold mb-[7px] uppercase tracking-[0.5px]">Articles Read</p>
            <p className="text-[24px] font-bold text-primary mb-[3px]">{articlesRead}</p>
            <p className="text-muted-foreground/80 text-[11px]">Total processed</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-[18px]">
            <p className="text-muted-foreground text-[10px] font-semibold mb-[7px] uppercase tracking-[0.5px]">Time Saved</p>
            <p className="text-[24px] font-bold text-[#8b5cf6] mb-[3px]">{timeSaved}m</p>
            <p className="text-muted-foreground/80 text-[11px]">Via AI Summaries</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-[18px]">
            <p className="text-muted-foreground text-[10px] font-semibold mb-[7px] uppercase tracking-[0.5px]">AI Queries</p>
            <p className="text-[24px] font-bold text-[#10b981] mb-[3px]">{queries}</p>
            <p className="text-muted-foreground/80 text-[11px]">Chat interactions</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-[18px]">
            <p className="text-muted-foreground text-[10px] font-semibold mb-[7px] uppercase tracking-[0.5px]">Bookmarks</p>
            <p className="text-[24px] font-bold text-[#f59e0b] mb-[3px]">{stats?.bookmarks_count || 0}</p>
            <p className="text-muted-foreground/80 text-[11px]">Saved articles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="flex gap-[7px] mb-[16px] overflow-x-auto pb-2 scrollbar-hide">
              {["Recommended", "Technology", "Business"].map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t.toLowerCase())}
                  className={`px-[13px] py-[6px] rounded-[18px] border cursor-pointer text-[12px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === t.toLowerCase()
                      ? "bg-primary/20 border-ring text-[#60a5fa]"
                      : "bg-transparent border-border text-muted-foreground hover:border-[#64748b]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-[14px]">
              {recentArticles.length > 0 ? (
                recentArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))
              ) : (
                <div className="text-center py-10 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground text-[14px]">No articles found in this category.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-[16px]">
            <div className="bg-card border border-border rounded-xl p-[18px]">
              <h3 className="font-serif text-[15px] text-foreground mb-[14px] font-bold">🔥 Trending Topics</h3>
              {["OpenAI GPT-5", "Federal Reserve", "Apple Earnings", "Climate Summit", "mRNA Vaccines"].map((t, i) => (
                <div key={t} className="flex items-center gap-[8px] py-[7px] border-b border-border last:border-0">
                  <span className="text-primary text-[11px] font-mono font-semibold min-w-[18px]">#{i + 1}</span>
                  <span className="text-muted-foreground text-[12px]">{t}</span>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-[18px]">
              <h3 className="font-serif text-[15px] text-foreground mb-[14px] font-bold">📊 Today's Sentiment</h3>
              {[
                ["Positive", "67%", "#16a34a"], 
                ["Neutral", "22%", "#d97706"], 
                ["Negative", "11%", "#dc2626"]
              ].map(([l, v, c]) => (
                <div key={l} className="mb-[10px] last:mb-0">
                  <div className="flex justify-between mb-[3px]">
                    <span className="text-muted-foreground text-[12px]">{l}</span>
                    <span className="text-[12px] font-mono font-medium" style={{ color: c }}>{v}</span>
                  </div>
                  <div className="h-[5px] bg-muted rounded-[3px] overflow-hidden">
                    <div className="h-full rounded-[3px]" style={{ width: v, backgroundColor: c }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#0f1d35] to-[#14122a] border border-[#6366f1]/30 rounded-xl p-[18px]">
              <h3 className="font-serif text-[15px] text-foreground mb-[7px] font-bold">✨ AI Daily Brief</h3>
              <p className="text-muted-foreground text-[12px] leading-[1.6] mb-[12px]">
                Today's key stories span AI advancements, central bank policy, and a landmark climate finance agreement.
              </p>
              <button 
                onClick={() => router.push('/chat?q=daily_brief')}
                className="bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#a5b4fc] px-[14px] py-[7px] rounded-lg cursor-pointer text-[12px] hover:bg-[#6366f1]/30 transition-colors"
              >
                Read Full Brief →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
