"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const CATEGORIES = ["Technology", "Business", "Politics", "Health", "Science", "Finance", "Entertainment"];

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    const fetchData = async () => {
      try {
        const [userRes, statsRes, interestsRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/users/me/dashboard").catch(() => ({ data: {} })),
          api.get("/users/me/interests").catch(() => ({ data: [] }))
        ]);
        setUser(userRes.data);
        setStats(statsRes.data);
        setInterests(interestsRes.data);
        setSelectedInterests(interestsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const saveInterests = async () => {
    try {
      await api.post("/users/me/interests", { categories: selectedInterests });
      setInterests(selectedInterests);
      setIsEditingInterests(false);
    } catch (err) {
      console.error("Failed to save interests", err);
    }
  };

  const toggleInterest = (cat: string) => {
    setSelectedInterests(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const getInitials = () => {
    if (!user?.full_name) return "U";
    const names = user.full_name.split(" ");
    return names.length > 1 ? (names[0][0] + names[1][0]).toUpperCase() : names[0].substring(0,2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-10">
            
      <div className="max-w-[760px] mx-auto px-[20px] pt-[28px]">
        <h1 className="font-serif text-[26px] font-bold text-foreground m-0 mb-[24px]">Profile & Settings</h1>
        
        <div className="bg-card border border-border rounded-2xl p-[24px] mb-[16px] flex gap-[18px] items-start">
          <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-[22px] shrink-0">
            {getInitials()}
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-[20px] font-bold text-foreground m-0 mb-[3px]">{user?.full_name || "Loading..."}</h2>
            <p className="text-muted-foreground text-[13px] font-sans m-0 mb-[10px]">{user?.email || "..."}</p>
            <div className="flex gap-[14px]">
              {[
                [stats?.articles_read || 0, "Read"], 
                [stats?.bookmarks_count || 0, "Saved"], 
                [stats?.queries || 0, "Queries"]
              ].map(([v, l]) => (
                <div key={l as string} className="text-center">
                  <p className="text-primary text-[17px] font-bold font-sans m-0">{v as string | number}</p>
                  <p className="text-muted-foreground/80 text-[11px] font-sans m-0">{l as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-[22px] mb-[14px]">
          <div className="flex justify-between items-center mb-[14px]">
            <h3 className="font-serif text-[15px] font-bold text-foreground m-0">News Preferences</h3>
            {!isEditingInterests ? (
              <button onClick={() => setIsEditingInterests(true)} className="bg-transparent border border-border text-muted-foreground px-[14px] py-[5px] rounded-lg cursor-pointer font-sans text-[11px] hover:bg-muted/50 transition-colors">
                Edit Interests
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setIsEditingInterests(false); setSelectedInterests(interests); }} className="bg-transparent border border-border text-muted-foreground px-[12px] py-[5px] rounded-lg cursor-pointer font-sans text-[11px] hover:bg-muted/50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveInterests} className="bg-primary border border-primary text-primary-foreground px-[12px] py-[5px] rounded-lg cursor-pointer font-sans text-[11px] hover:opacity-90 transition-opacity">
                  Save
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-[8px]">
            {!isEditingInterests ? (
              interests.length > 0 ? (
                interests.map((cat: string) => (
                  <span key={cat} className="px-[12px] py-[5px] rounded-[14px] bg-primary/20 border border-ring text-[#60a5fa] text-[12px] font-medium">
                    {cat}
                  </span>
                ))
              ) : (
                <p className="text-muted-foreground text-[13px] italic m-0">No specific interests set. You will see general news.</p>
              )
            ) : (
              CATEGORIES.map((cat: string) => {
                const isSelected = selectedInterests.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleInterest(cat)}
                    className={`px-[12px] py-[5px] rounded-[14px] border cursor-pointer text-[12px] font-medium transition-colors ${
                      isSelected 
                        ? "bg-primary/20 border-ring text-[#60a5fa]" 
                        : "bg-transparent border-border text-muted-foreground hover:border-[#64748b]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {[
          ["Account Information", [
            ["Email Address", user?.email || "..."], 
            ["Account Role", user?.role || "..."], 
            ["Status", user?.status || "..."]
          ]]
        ].map(([title, items]: any) => (
          <div key={title} className="bg-card border border-border rounded-2xl p-[22px] mb-[14px]">
            <h3 className="font-serif text-[15px] font-bold text-foreground m-0 mb-[14px]">{title}</h3>
            {items.map(([l, v]: any) => (
              <div key={l} className="flex justify-between items-center py-[10px] border-b border-border last:border-0">
                <div>
                  <p className="text-muted-foreground text-[13px] font-sans font-medium m-0">{l}</p>
                  <p className="text-muted-foreground/80 text-[11px] font-sans m-0 mt-[2px]">{v}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        <button 
          onClick={handleLogout}
          className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-[22px] py-[9px] rounded-lg cursor-pointer font-sans text-[13px] font-medium mt-[10px] hover:bg-rose-500/20 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

