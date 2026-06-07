"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";

export default function LandingPage() {
  const router = useRouter();
  const [publicArticles, setPublicArticles] = useState([]);
  const [loadingPublicNews, setLoadingPublicNews] = useState(true);

  useEffect(() => {
    const fetchPublicNews = async () => {
      try {
        const response = await api.get('/news/public');
        setPublicArticles(response.data);
      } catch (error) {
        console.error('Failed to fetch public news:', error);
      } finally {
        setLoadingPublicNews(false);
      }
    };

    fetchPublicNews();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="bg-background/95 border-b border-border px-5 flex items-center h-[60px] sticky top-0 z-[100] backdrop-blur-sm">
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-[17px]">
            ⚡
          </div>
          <span className="font-serif font-bold text-[20px] text-foreground">
            NewsPulse<span className="text-primary">AI</span>
          </span>
        </div>
        <button 
          onClick={() => router.push('/login')} 
          className="bg-transparent border border-border text-muted-foreground px-[18px] py-[7px] rounded-lg cursor-pointer font-medium text-[13px] mr-2 hover:bg-muted/50 transition-colors"
        >
          Sign In
        </button>
        <button 
          onClick={() => router.push('/register')} 
          className="bg-gradient-to-br from-primary to-primary/80 border-none text-white px-[18px] py-[7px] rounded-lg cursor-pointer font-semibold text-[13px] hover:opacity-90 transition-opacity"
        >
          Get Started
        </button>
      </nav>

      <div className="pt-[80px] px-5 pb-[60px] text-center max-w-[800px] mx-auto relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-[7px] bg-primary/10 border border-ring/30 rounded-[20px] px-[14px] py-[5px] mb-[28px]">
          <span className="w-[5px] h-[5px] rounded-full bg-primary inline-block"></span>
          <span className="text-[#60a5fa] text-[12px] font-medium">Powered by RAG + LLM Technology</span>
        </div>
        
        <h1 className="font-serif text-[42px] sm:text-[54px] font-black text-foreground leading-[1.1] mb-[20px]">
          News Intelligence,<br/>
          <span className="bg-gradient-to-br from-primary to-primary/80 text-transparent bg-clip-text">Reimagined by AI</span>
        </h1>
        
        <p className="text-muted-foreground text-[16px] sm:text-[17px] leading-[1.7] mb-[36px] font-light max-w-[600px] mx-auto">
          Stop reading. Start understanding. NewsPulse AI aggregates thousands of articles and distills them into AI summaries, sentiment analysis, and conversational insights — in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-[14px] justify-center items-center">
          <button 
            onClick={() => router.push('/register')} 
            className="w-full sm:w-auto bg-gradient-to-br from-primary to-primary/80 border-none text-white px-[32px] py-[12px] rounded-[10px] cursor-pointer font-semibold text-[15px] hover:scale-105 transition-transform"
          >
            Start for free →
          </button>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="w-full sm:w-auto bg-transparent border border-border text-muted-foreground px-[32px] py-[12px] rounded-[10px] cursor-pointer text-[15px] hover:bg-muted/50 transition-colors"
          >
            View Demo
          </button>
        </div>
      </div>

      <div className="flex gap-[10px] justify-center flex-wrap px-5 pb-[48px] max-w-[900px] mx-auto">
        {[
          "AI Summaries", "Sentiment Analysis", "Named Entities", 
          "Event Timelines", "RAG Chatbot", "Credibility Scores", 
          "Daily Brief", "Personalized Feed"
        ].map(f => (
          <span key={f} className="bg-card border border-border text-muted-foreground px-[16px] py-[7px] rounded-[20px] text-[12px] font-medium">
            {f}
          </span>
        ))}
      </div>

      <div className="max-w-[1000px] mx-auto px-5 pb-[60px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-[28px] font-bold text-foreground">Top Stories</h2>
        </div>
        {loadingPublicNews ? (
          <div className="text-center text-muted-foreground py-10">Loading latest news...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publicArticles.map((article: any) => (
              <ArticleCard key={article.article_id} article={article} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-[#0f1d35] to-[#14122a] border-t border-border py-[60px] px-5 text-center">
        <h2 className="font-serif text-[36px] font-extrabold text-foreground mb-3">Start reading smarter today</h2>
        <p className="text-muted-foreground text-[15px] mb-[28px]">Free to use. No credit card. Built as MCA Final Year Project.</p>
        <button 
          onClick={() => router.push('/register')} 
          className="bg-gradient-to-br from-primary to-primary/80 border-none text-white px-[40px] py-[12px] rounded-[10px] cursor-pointer font-semibold text-[15px] hover:scale-105 transition-transform"
        >
          Create Your Account →
        </button>
      </div>
    </div>
  );
}
