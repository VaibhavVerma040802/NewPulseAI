"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ArticleCard, Article } from "@/components/ArticleCard";
import { api } from "@/lib/api";

export default function BookmarksPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    
    const fetchBookmarks = async () => {
      try {
        const response = await api.get("/bookmarks");
        setArticles(response.data);
      } catch (err) {
        console.error("Failed to fetch bookmarks", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a101a] font-sans">
      <Navbar />
      
      <div className="max-w-[960px] mx-auto px-[20px] py-[28px]">
        <div className="flex justify-between items-center mb-[24px]">
          <div>
            <h1 className="font-serif text-[26px] font-bold text-[#f1f5f9] m-0 mb-[3px]">Saved Articles</h1>
            <p className="text-[#64748b] text-[12px] m-0 font-sans">{articles.length} saved · 3 reading lists</p>
          </div>
          <button className="bg-transparent border border-[#1e2d45] text-[#94a3b8] px-[14px] py-[7px] rounded-lg cursor-pointer font-sans text-[12px] hover:bg-[#1e2d45]/50 transition-colors">
            + New List
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-[20px]">
          <div className="bg-[#141e2e] border border-[#1e2d45] rounded-xl p-[18px] h-fit">
            <p className="text-[#475569] text-[10px] font-sans font-semibold uppercase tracking-[0.5px] m-0 mb-[10px]">Reading Lists</p>
            {[
              ["All Saved", articles.length.toString(), true], 
              ["AI & Tech", "12", false], 
              ["Weekly Digest", "8", false], 
              ["Research", "4", false]
            ].map(([n, c, a]: any) => (
              <div key={n} className="py-[9px] border-b border-[#1e2d45] cursor-pointer flex justify-between items-center last:border-0">
                <span className={`text-[13px] font-sans ${a ? "text-[#60a5fa] font-bold" : "text-[#94a3b8] font-normal"}`}>{n}</span>
                <span className="text-[#475569] text-[11px] font-mono">{c}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-[14px]">
            {loading ? (
              <div className="flex justify-center items-center h-[200px] text-[#3b82f6]">Loading bookmarks...</div>
            ) : articles.length === 0 ? (
              <div className="bg-[#141e2e] border border-[#1e2d45] rounded-2xl p-[40px] text-center">
                <div className="text-[36px] mb-[10px]">☆</div>
                <h3 className="font-serif text-[20px] font-bold text-[#f1f5f9] m-0 mb-[7px]">No saved articles yet</h3>
                <p className="text-[#64748b] text-[13px] font-sans m-0">Bookmark articles from the feed</p>
              </div>
            ) : (
              articles.map(a => <ArticleCard key={a.id || (a as any).article_id} article={a} initialBookmarked={true} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
