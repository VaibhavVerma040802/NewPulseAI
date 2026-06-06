"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { api } from "@/lib/api";

interface AnalyticsData {
  users: { total: number; new_24h: number };
  news: { total_articles: number };
  ai: { total_summaries: number };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/admin/analytics");
        setData(response.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("Access Denied: Administrator privileges required.");
        } else {
          setError("Failed to load analytics.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a101a] font-sans pb-10">
      <Navbar />
      
      <div className="max-w-[1200px] mx-auto px-5 pt-[30px]">
        <div className="mb-[30px]">
          <h1 className="font-serif text-[28px] font-bold text-[#f1f5f9] m-0 mb-2">Admin Dashboard</h1>
          <p className="text-[#64748b] text-[14px] m-0">System analytics and overview.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#3b82f6]">Loading analytics...</div>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 font-medium font-sans">
            {error}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#141e2e] border border-[#1e2d45] rounded-xl p-6 hover:border-[#3b82f6]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 flex items-center justify-center mb-4 text-[20px]">
                👥
              </div>
              <h3 className="text-[#94a3b8] text-[13px] font-medium m-0 mb-2">Total Users</h3>
              <div className="font-serif text-[32px] font-bold text-[#f1f5f9] leading-none mb-2">{data.users.total}</div>
              <p className="text-[#10b981] text-[12px] m-0 font-medium">+{data.users.new_24h} in last 24h</p>
            </div>

            <div className="bg-[#141e2e] border border-[#1e2d45] rounded-xl p-6 hover:border-[#10b981]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center mb-4 text-[20px]">
                📰
              </div>
              <h3 className="text-[#94a3b8] text-[13px] font-medium m-0 mb-2">Total Articles Processed</h3>
              <div className="font-serif text-[32px] font-bold text-[#f1f5f9] leading-none">{data.news.total_articles}</div>
            </div>

            <div className="bg-[#141e2e] border border-[#1e2d45] rounded-xl p-6 hover:border-[#8b5cf6]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center mb-4 text-[20px]">
                ⚡
              </div>
              <h3 className="text-[#94a3b8] text-[13px] font-medium m-0 mb-2">AI Summaries Generated</h3>
              <div className="font-serif text-[32px] font-bold text-[#f1f5f9] leading-none">{data.ai.total_summaries}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
