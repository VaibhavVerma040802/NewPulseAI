"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    const fetchData = async () => {
      try {
        const [userRes, statsRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/users/me/stats").catch(() => ({ data: {} }))
        ]);
        setUser(userRes.data);
        setStats(statsRes.data);
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
          <button className="bg-transparent border border-border text-muted-foreground px-[14px] py-[7px] rounded-lg cursor-pointer font-sans text-[12px] hover:bg-muted/50 transition-colors">
            Edit
          </button>
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

