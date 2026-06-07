"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ThemeToggle } from "./theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, Home, Compass, MessageSquare, 
  Bookmark, UserCircle, ShieldAlert, LogOut, Search
} from "lucide-react";

const SCREENS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "feed", label: "News Feed", icon: Compass },
  { id: "search", label: "Search", icon: Search },
  { id: "chat", label: "AI Chatbot", icon: MessageSquare },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
];

const SETTINGS = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "admin", label: "Admin", icon: ShieldAlert }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userInitials, setUserInitials] = useState("U");
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState("USER");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data) {
          if (res.data.full_name) {
            const names = res.data.full_name.split(" ");
            if (names.length >= 2) {
              setUserInitials((names[0][0] + names[1][0]).toUpperCase());
            } else {
              setUserInitials(names[0].substring(0, 2).toUpperCase());
            }
          }
          if (res.data.role) {
             setUserRole(res.data.role);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (localStorage.getItem("token")) {
      fetchMe();
    }
  }, [pathname]); // Refetch when pathname changes, so Admin role updates properly

  const activeId = pathname.substring(1) || "dashboard";

  const handleNavigation = (id: string) => {
    router.push(`/${id}`);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: "-100%", opacity: 0 }
  };

  const SidebarContent = () => (
    <>
        <div className="p-5 flex items-center justify-between">
          <div 
            onClick={() => handleNavigation("dashboard")} 
            className="cursor-pointer flex items-center gap-2"
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-[15px]">
              ⚡
            </div>
            <span className="font-serif font-bold text-[18px] text-foreground">
              NewsPulse<span className="text-primary">AI</span>
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden bg-transparent border-none text-muted-foreground p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3 mt-2">Menu</div>
          {SCREENS.map(s => {
            const Icon = s.icon;
            const isActive = activeId.startsWith(s.id);
            return (
              <button 
                key={s.id}
                onClick={() => handleNavigation(s.id)} 
                className={`flex items-center gap-3 bg-transparent border-none font-sans text-[14px] font-medium px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 w-full text-left ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
                {s.label}
              </button>
            );
          })}

          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3 mt-6">Settings</div>
          {SETTINGS.map(s => {
             if (s.id === "admin" && userRole !== "ADMIN") return null;

             const Icon = s.icon;
             const isActive = activeId.startsWith(s.id);
             return (
               <button 
                 key={s.id}
                 onClick={() => handleNavigation(s.id)} 
                 className={`flex items-center gap-3 bg-transparent border-none font-sans text-[14px] font-medium px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 w-full text-left ${
                   isActive 
                     ? "bg-primary/10 text-primary" 
                     : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                 }`}
               >
                 <Icon size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
                 {s.label}
               </button>
             );
          })}
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-[14px]">
                {userInitials}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-foreground">My Account</span>
                <span className="text-[11px] text-muted-foreground">{userRole === "ADMIN" ? "Admin" : "User"}</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors border-none cursor-pointer font-medium text-[13px]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
        <div 
          onClick={() => handleNavigation("dashboard")} 
          className="cursor-pointer flex items-center gap-2"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-[15px]">
            ⚡
          </div>
          <span className="font-serif font-bold text-[18px] text-foreground">
            NewsPulse<span className="text-primary">AI</span>
          </span>
        </div>
        <button onClick={() => setIsOpen(true)} className="bg-transparent border-none text-foreground p-2 cursor-pointer">
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Content */}
      <motion.div 
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 w-[260px] bg-card border-r border-border flex flex-col z-50 md:hidden"
      >
        <SidebarContent />
      </motion.div>

      {/* Desktop Static Sidebar Content */}
      <div className="hidden md:flex flex-col w-[260px] bg-card border-r border-border relative z-0 h-full">
        <SidebarContent />
      </div>
    </>
  );
}
