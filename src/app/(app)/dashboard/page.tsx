"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArticleCard, Article } from "@/components/ArticleCard";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommended");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, articlesRes, meRes] = await Promise.all([
          api.get("/users/me/dashboard").catch(() => ({ data: {} })),
          api.get("/news?limit=6").catch(() => ({ data: [] })),
          api.get("/auth/me").catch(() => ({ data: {} }))
        ]);
        setStats(statsRes.data);
        setRecentArticles(articlesRes.data);
        if (meRes.data?.full_name) {
          setUserName(meRes.data.full_name.split(" ")[0]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // When tab changes, fetch different category of articles
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    const fetchTabArticles = async () => {
      try {
        const catParam = activeTab === "recommended" ? "" : `&category=${activeTab}`;
        const res = await api.get(`/news?limit=6${catParam}`).catch(() => ({ data: [] }));
        setRecentArticles(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTabArticles();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <div className="flex justify-center items-center h-[calc(100vh-57px)] text-primary">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const articlesRead = stats?.articles_read ?? 0;
  const timeSaved = stats?.time_saved_minutes ?? 0;
  const bookmarks = stats?.bookmarks_count ?? 0;
  const avgCred = stats?.avg_credibility ?? 0;
  const trendingTopics: {name: string; rank: number}[] = stats?.trending_topics || [];
  const sentimentBreakdown = stats?.sentiment_breakdown || { positive: 0, neutral: 0, negative: 0 };
  
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-[1100px] mx-auto px-5 py-[28px]">
        <div className="flex justify-between items-start mb-[28px] flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-[27px] font-bold text-foreground m-0 mb-[3px]">
              {greeting}{userName ? `, ${userName}` : ""} 👋
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
            <p className="text-muted-foreground text-[10px] font-semibold mb-[7px] uppercase tracking-[0.5px]">Avg Credibility</p>
            <p className="text-[24px] font-bold text-[#10b981] mb-[3px]">{avgCred}/100</p>
            <p className="text-muted-foreground/80 text-[11px]">Of articles read</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-[18px]">
            <p className="text-muted-foreground text-[10px] font-semibold mb-[7px] uppercase tracking-[0.5px]">Bookmarks</p>
            <p className="text-[24px] font-bold text-[#f59e0b] mb-[3px]">{bookmarks}</p>
            <p className="text-muted-foreground/80 text-[11px]">Saved articles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="flex gap-[7px] mb-[16px] overflow-x-auto pb-2 scrollbar-hide">
              {["Recommended", "Technology", "Business", "Health", "Science"].map(t => (
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
                  <ArticleCard key={(article as any).article_id || article.id} article={article} />
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
              {trendingTopics.length > 0 ? (
                trendingTopics.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-[8px] py-[7px] border-b border-border last:border-0">
                    <span className="text-primary text-[11px] font-mono font-semibold min-w-[18px]">#{i + 1}</span>
                    <span className="text-muted-foreground text-[12px]">{t.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-[12px]">Processing articles to identify trends...</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-[18px]">
              <h3 className="font-serif text-[15px] text-foreground mb-[14px] font-bold">📊 Today&apos;s Sentiment</h3>
              {[
                ["Positive", `${sentimentBreakdown.positive}%`, "#16a34a"], 
                ["Neutral", `${sentimentBreakdown.neutral}%`, "#d97706"], 
                ["Negative", `${sentimentBreakdown.negative}%`, "#dc2626"]
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
              {sentimentBreakdown.positive === 0 && sentimentBreakdown.negative === 0 && (
                <p className="text-muted-foreground text-[11px] mt-2">Sentiment data updates as articles are processed by AI.</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#0f1d35] to-[#14122a] border border-[#6366f1]/30 rounded-xl p-[18px]">
              <h3 className="font-serif text-[15px] text-foreground mb-[7px] font-bold">✨ AI Daily Brief</h3>
              <p className="text-muted-foreground text-[12px] leading-[1.6] mb-[12px]">
                Ask the AI chatbot for a daily summary of today&apos;s top stories across all categories.
              </p>
              <button 
                onClick={() => router.push('/chat?prompt=Give me a brief summary of the most important news stories from today')}
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
