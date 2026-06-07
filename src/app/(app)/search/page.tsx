"use client";

import { useState, useEffect } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { api } from "@/lib/api";
import { Search as SearchIcon, Loader2 } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/recommendations/search?query=${encodeURIComponent(query)}&limit=15`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto min-h-screen">
      <h1 className="font-serif text-[32px] font-bold text-foreground m-0 mb-8 flex items-center gap-3">
        Semantic Search
        <span className="text-[16px] font-sans font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
          Powered by ChromaDB
        </span>
      </h1>

      <form onSubmit={handleSearch} className="mb-10 relative">
        <div className="relative flex items-center w-full max-w-2xl">
          <SearchIcon className="absolute left-4 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything or search for specific topics..."
            className="w-full bg-card border border-border rounded-xl py-4 pl-12 pr-32 text-foreground font-sans text-[16px] outline-none focus:border-primary/50 transition-colors shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 bg-primary text-primary-foreground font-medium rounded-lg px-6 py-2.5 text-[14px] cursor-pointer border-none hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p>Searching through vector embeddings...</p>
        </div>
      ) : hasSearched ? (
        results.length > 0 ? (
          <div>
            <h2 className="text-[18px] font-bold mb-6 text-foreground">
              Found {results.length} relevant articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((article: any) => (
                <ArticleCard key={article.id || article.article_id} article={article} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <div className="text-[40px] mb-4">🔍</div>
            <h3 className="text-[20px] font-bold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground text-[14px] max-w-md mx-auto">
              We couldn't find any articles semantically matching "{query}". Try adjusting your search terms or asking a broader question.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
          <div className="bg-card p-6 rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setQuery("What are the latest AI advancements?")}>
            <div className="text-[24px] mb-3">🤖</div>
            <h4 className="font-bold text-[15px] mb-2">Latest AI Advancements</h4>
            <p className="text-[13px] text-muted-foreground">Search for recent breakthroughs in artificial intelligence and machine learning.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setQuery("How is the economy doing?")}>
            <div className="text-[24px] mb-3">📈</div>
            <h4 className="font-bold text-[15px] mb-2">Economic Updates</h4>
            <p className="text-[13px] text-muted-foreground">Find articles discussing interest rates, inflation, and market trends.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setQuery("Renewable energy innovations")}>
            <div className="text-[24px] mb-3">🌱</div>
            <h4 className="font-bold text-[15px] mb-2">Renewable Energy</h4>
            <p className="text-[13px] text-muted-foreground">Discover news about solar, wind, and sustainable technology.</p>
          </div>
        </div>
      )}
    </div>
  );
}
