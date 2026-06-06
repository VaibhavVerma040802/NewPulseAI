"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArticleCard, Article } from "@/components/ArticleCard";
import { Navbar } from "@/components/navbar";

export default function FeedPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<string>("All Categories");
  const [sort, setSort] = useState<string>("Most Recent");
  const [skip, setSkip] = useState(0);
  const LIMIT = 12;

  const CATEGORIES = ["All Categories", "Technology", "Business", "Politics", "Health", "Science", "Finance", "Entertainment"];

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    const fetchNews = async () => {
      setLoading(true);
      try {
        const catParam = category === "All Categories" ? "" : `&category=${category}`;
        const sortParam = sort === "Most Recent" ? "recent" : "relevant"; // Adjust API later if needed
        const url = `/news?limit=${LIMIT}&skip=0${catParam}&sort=${sortParam}`;
        
        const newsRes = await api.get(url);
        setArticles(newsRes.data);
        setSkip(LIMIT);
      } catch (error) {
        console.error("Failed to fetch news", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [category, sort, router]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const catParam = category === "All Categories" ? "" : `&category=${category}`;
      const url = `/news?limit=${LIMIT}&skip=${skip}${catParam}`;
      const response = await api.get(url);
      setArticles((prev) => [...prev, ...response.data]);
      setSkip((prev) => prev + LIMIT);
    } catch (error) {
      console.error("Failed to load more news", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <div className="max-w-[1050px] mx-auto px-5 py-[28px]">
        <div className="flex justify-between items-center mb-[24px] flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-[26px] font-bold text-foreground m-0">News Feed</h1>
            <p className="text-muted-foreground text-[12px] m-0 mt-[3px]">
              {articles.length > 0 ? `Showing ${articles.length} articles` : "Loading articles..."} · Updated just now
            </p>
          </div>
          <div className="flex gap-[8px]">
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-auto text-[12px] py-[6px] px-[10px] pr-8"
            >
              <option>Most Recent</option>
              <option>Most Relevant</option>
            </select>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-auto text-[12px] py-[6px] px-[10px] pr-8"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-[7px] mb-[20px] flex-wrap">
          {["All", "Technology", "Business", "Politics", "Health", "Finance"].map(c => (
            <button 
              key={c}
              onClick={() => setCategory(c === "All" ? "All Categories" : c)}
              className={`px-[13px] py-[5px] rounded-[14px] border border-border cursor-pointer text-[12px] font-medium transition-colors ${
                (category === c || (category === "All Categories" && c === "All")) 
                ? "bg-primary/20 border-ring text-[#60a5fa]" 
                : "bg-transparent text-muted-foreground hover:border-[#64748b]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-primary">Loading...</div>
        ) : articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              {articles.map((article: any) => (
                <ArticleCard key={article.id || article.article_id} article={article} />
              ))}
            </div>
            
            <div className="flex justify-center mt-[28px]">
              <button 
                onClick={loadMore} 
                disabled={loadingMore}
                className="px-6 py-2 bg-card border border-border text-muted-foreground hover:border-ring hover:text-foreground rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 text-[13px] cursor-pointer"
              >
                {loadingMore ? "Loading..." : "Load More ↓"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-64 text-muted-foreground bg-card border border-border rounded-xl">
            No articles found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
