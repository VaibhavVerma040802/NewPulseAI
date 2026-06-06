"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const SCREENS = [
  { id: "feed", label: "News Feed" },
  { id: "search", label: "Search" },
  { id: "chat", label: "AI Chatbot" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "dashboard", label: "Dashboard" },
  { id: "admin", label: "Admin" }
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    // In a real implementation, you would get this from a UserContext or API
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data && res.data.full_name) {
          const names = res.data.full_name.split(" ");
          if (names.length >= 2) {
            setUserInitials((names[0][0] + names[1][0]).toUpperCase());
          } else {
            setUserInitials(names[0].substring(0, 2).toUpperCase());
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (localStorage.getItem("token")) {
      fetchMe();
    }
  }, []);

  // Map current pathname to an active ID
  const activeId = pathname.substring(1) || "dashboard";

  return (
    <nav className="bg-[#0f1623] border-b border-[#1e2d45] px-5 flex items-center h-[56px] sticky top-0 z-[100]">
      <div 
        onClick={() => router.push("/")} 
        className="cursor-pointer flex items-center gap-2 mr-auto"
      >
        <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[15px]">
          ⚡
        </div>
        <span className="font-serif font-bold text-[18px] text-[#f1f5f9]">
          NewsPulse<span className="text-[#3b82f6]">AI</span>
        </span>
      </div>
      
      {SCREENS.map(s => (
        <button 
          key={s.id}
          onClick={() => router.push(`/${s.id}`)} 
          className={`bg-transparent border-none font-sans text-[13px] font-medium px-3 h-[56px] cursor-pointer border-b-2 transition-all duration-200 hidden md:block ${
            activeId.startsWith(s.id) 
              ? "text-[#3b82f6] border-[#3b82f6]" 
              : "text-[#94a3b8] border-transparent hover:text-[#cbd5e1]"
          }`}
        >
          {s.label}
        </button>
      ))}

      <div 
        onClick={() => router.push("/profile")} 
        className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-[12px] cursor-pointer ml-3"
      >
        {userInitials}
      </div>
    </nav>
  );
}
