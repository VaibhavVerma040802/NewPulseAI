"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CATEGORIES = [
  "Technology",
  "Business",
  "Politics",
  "Sports",
  "Health",
  "Entertainment",
  "Science",
  "Finance",
  "Climate",
  "AI/ML",
  "Startups",
  "Crypto",
  "World News",
  "Culture",
  "Education"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  const toggleCategory = (cat: string) => {
    setSelected(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async () => {
    if (selected.length < 3) return;
    
    setLoading(true);
    try {
      await api.post("/users/me/interests", { categories: selected });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 font-sans relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      <div className="w-full max-w-[700px] bg-[#111827] border border-border rounded-[24px] p-10 relative shadow-2xl flex flex-col">
        
        {/* Dot indicators at top */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-[#374151]"></div>
          <div className="w-8 h-2 rounded-full bg-[#3b82f6]"></div>
          <div className="w-2 h-2 rounded-full bg-[#374151]"></div>
        </div>

        <div className="text-center mb-10">
          <h1 className="font-serif text-[36px] font-bold text-white m-0 mb-3">What interests you?</h1>
          <p className="text-[#9ca3af] text-[16px] m-0">Select at least 3 topics to personalize your feed</p>
        </div>

        {/* Pills container */}
        <div className="flex flex-wrap justify-center gap-3.5 mb-14 max-w-[550px] mx-auto">
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-5 py-2.5 rounded-full border text-[15px] cursor-pointer transition-colors duration-200 font-medium ${
                  isSelected 
                    ? "bg-[#1e3a8a]/40 border-[#3b82f6] text-[#60a5fa]" 
                    : "bg-transparent border-[#374151] text-[#9ca3af] hover:border-[#4b5563] hover:text-white"
                }`}
              >
                {isSelected && <span className="mr-1.5 font-bold">✓</span>}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="text-[#9ca3af] text-[15px]">
            <span className={selected.length >= 3 ? "text-white font-medium" : ""}>{selected.length}</span> selected
          </div>
          <button 
            onClick={handleSave}
            disabled={loading || selected.length < 3}
            className={`px-6 py-3.5 rounded-xl font-sans text-[15px] font-semibold cursor-pointer border-none transition-colors flex items-center justify-center gap-2 ${
              selected.length >= 3
                ? "bg-[#5b6ef6] hover:bg-[#4b5ee6] text-white shadow-lg"
                : "bg-[#374151] text-[#9ca3af] cursor-not-allowed"
            }`}
          >
            {loading ? "Saving..." : "Continue to Dashboard →"}
          </button>
        </div>

      </div>
    </div>
  );
}
