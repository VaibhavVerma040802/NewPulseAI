"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

const CATEGORIES = [
  "general",
  "technology",
  "business",
  "sports",
  "health",
  "entertainment",
  "science"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (selected.length === 0) {
      setError("Please select at least one topic.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      await api.post("/users/me/interests", { categories: selected });
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 relative font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      <div className="w-full max-w-[500px] bg-card border border-border rounded-[16px] p-8 relative shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-[24px] mb-4">
            🎯
          </div>
          <h1 className="font-serif text-[28px] font-bold text-foreground m-0 mb-2">Personalize Your Feed</h1>
          <p className="text-muted-foreground text-[14px] m-0">Select the topics you care about most so we can curate the best news for you.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-8">
          {CATEGORIES.map((cat) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`p-4 rounded-xl border cursor-pointer flex items-center justify-center text-[14px] font-medium capitalize transition-colors ${
                selected.includes(cat) 
                  ? "bg-primary/10 border-primary text-primary" 
                  : "bg-background border-border text-foreground hover:border-primary/50"
              }`}
            >
              {cat}
            </motion.div>
          ))}
        </div>

        <button 
          onClick={handleSave}
          disabled={loading || selected.length === 0}
          className="w-full bg-gradient-to-br from-primary to-primary/80 border-none text-white p-3.5 rounded-xl font-sans text-[15px] font-semibold cursor-pointer disabled:opacity-50 flex justify-center items-center transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        >
          {loading ? "Saving..." : "Continue to Dashboard"}
        </button>
      </div>
    </div>
  );
}
