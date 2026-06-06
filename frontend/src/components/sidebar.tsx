"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Bookmark, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/reading-list", label: "Reading List", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth(false); // Don't require auth here, layout handles it

  const allItems = [...navItems];
  if (user?.role === "ADMIN") {
    allItems.push({ href: "/admin", label: "Admin", icon: Settings });
  }

  return (
    <aside className="w-64 border-r bg-card/50 hidden md:block h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-4 space-y-2">
        {allItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-primary/10 text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
