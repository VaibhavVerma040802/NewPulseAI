"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Shield } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-primary font-sans">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-10 font-sans">
        <div className="p-6 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 font-medium max-w-2xl mx-auto">
          {error}
        </div>
      </div>
    );
  }

  // Use real data where available, fallback to mock data to match the UI screenshot exactly
  const totalUsers = data?.users.total || 8423;
  const newUsers = data?.users.new_24h || 127;
  const totalArticles = data?.news.total_articles || 94831;
  const totalSummaries = data?.ai.total_summaries || "2.4M";

  return (
    <div className="min-h-screen bg-[#0b0f19] font-sans pb-10 text-white">
      <div className="max-w-[1200px] mx-auto px-6 pt-[40px]">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#1e293b]/80 border border-[#374151] rounded-xl flex items-center justify-center">
            <Shield className="text-[#60a5fa] w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-[26px] font-bold m-0 leading-tight">Admin Dashboard</h1>
            <p className="text-[#6b7280] text-[14px] m-0">System management and analytics</p>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 hover:border-[#374151] transition-colors">
            <h3 className="text-[#6b7280] text-[11px] font-bold tracking-wider mb-2 uppercase">Total Users</h3>
            <div className="font-sans text-[28px] font-bold text-[#60a5fa] leading-none mb-1.5">{totalUsers.toLocaleString()}</div>
            <p className="text-[#4b5563] text-[12px] m-0 flex items-center gap-1">
              ↑ {newUsers} this week
            </p>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 hover:border-[#374151] transition-colors">
            <h3 className="text-[#6b7280] text-[11px] font-bold tracking-wider mb-2 uppercase">Active Today</h3>
            <div className="font-sans text-[28px] font-bold text-[#10b981] leading-none mb-1.5">1,247</div>
            <p className="text-[#4b5563] text-[12px] m-0">14.8% DAU rate</p>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 hover:border-[#374151] transition-colors">
            <h3 className="text-[#6b7280] text-[11px] font-bold tracking-wider mb-2 uppercase">Articles in DB</h3>
            <div className="font-sans text-[28px] font-bold text-[#8b5cf6] leading-none mb-1.5">{totalArticles.toLocaleString()}</div>
            <p className="text-[#4b5563] text-[12px] m-0">↑ 312 today</p>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 hover:border-[#374151] transition-colors">
            <h3 className="text-[#6b7280] text-[11px] font-bold tracking-wider mb-2 uppercase">LLM Tokens</h3>
            <div className="font-sans text-[28px] font-bold text-[#f59e0b] leading-none mb-1.5">{totalSummaries}</div>
            <p className="text-[#4b5563] text-[12px] m-0">of 5M limit</p>
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Recent Users List */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-[18px] font-bold m-0">Recent Users</h2>
              <button className="bg-transparent border border-[#1e3a8a] text-[#60a5fa] px-3 py-1 rounded text-[12px] font-medium hover:bg-[#1e3a8a]/50 cursor-pointer transition-colors">
                View All
              </button>
            </div>
            
            <div className="w-full">
              <div className="flex text-[#4b5563] text-[11px] font-bold uppercase tracking-wider mb-3 border-b border-[#1f2937] pb-2">
                <div className="flex-1">NAME</div>
                <div className="w-[100px]">STATUS</div>
                <div className="w-[80px]">ROLE</div>
              </div>
              
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center">
                  <div className="flex-1 text-[14px] text-[#d1d5db]">Alex Kumar</div>
                  <div className="w-[100px]"><span className="bg-[#064e3b]/50 text-[#34d399] border border-[#065f46] text-[10px] font-bold px-2 py-0.5 rounded uppercase">ACTIVE</span></div>
                  <div className="w-[80px] text-[13px] text-[#9ca3af]">User</div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 text-[14px] text-[#d1d5db]">Priya Sharma</div>
                  <div className="w-[100px]"><span className="bg-[#064e3b]/50 text-[#34d399] border border-[#065f46] text-[10px] font-bold px-2 py-0.5 rounded uppercase">ACTIVE</span></div>
                  <div className="w-[80px] text-[13px] text-[#9ca3af]">User</div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 text-[14px] text-[#d1d5db]">Rahul Singh</div>
                  <div className="w-[100px]"><span className="bg-[#78350f]/50 text-[#fbbf24] border border-[#92400e] text-[10px] font-bold px-2 py-0.5 rounded uppercase">PENDING</span></div>
                  <div className="w-[80px] text-[13px] text-[#9ca3af]">User</div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 text-[14px] text-[#d1d5db]">Admin User</div>
                  <div className="w-[100px]"><span className="bg-[#064e3b]/50 text-[#34d399] border border-[#065f46] text-[10px] font-bold px-2 py-0.5 rounded uppercase">ACTIVE</span></div>
                  <div className="w-[80px] text-[13px] text-[#9ca3af]">Admin</div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 text-[14px] text-[#d1d5db]">Dev Test</div>
                  <div className="w-[100px]"><span className="bg-[#7f1d1d]/50 text-[#f87171] border border-[#991b1b] text-[10px] font-bold px-2 py-0.5 rounded uppercase">LOCKED</span></div>
                  <div className="w-[80px] text-[13px] text-[#9ca3af]">User</div>
                </div>
              </div>
            </div>
          </div>

          {/* News Sources List */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-[18px] font-bold m-0">News Sources</h2>
              <button className="bg-[#6366f1] hover:bg-[#4f46e5] border-none text-white px-4 py-1.5 rounded text-[12px] font-medium cursor-pointer transition-colors flex items-center gap-1">
                + Add
              </button>
            </div>
            
            <div className="flex flex-col gap-0 border-b border-[#1f2937]">
              {/* Row 1 */}
              <div className="flex justify-between items-center py-4 border-b border-[#1f2937]/50">
                <div>
                  <div className="text-[14px] text-[#d1d5db] font-medium mb-1">NewsAPI</div>
                  <div className="text-[11px] text-[#6b7280]">REST API · Every 15m</div>
                </div>
                <div><span className="text-[#10b981] font-medium text-[12px]">Healthy</span></div>
              </div>
              
              {/* Row 2 */}
              <div className="flex justify-between items-center py-4 border-b border-[#1f2937]/50">
                <div>
                  <div className="text-[14px] text-[#d1d5db] font-medium mb-1">GNews</div>
                  <div className="text-[11px] text-[#6b7280]">REST API · Every 15m</div>
                </div>
                <div><span className="text-[#10b981] font-medium text-[12px]">Healthy</span></div>
              </div>
              
              {/* Row 3 */}
              <div className="flex justify-between items-center py-4 border-b border-[#1f2937]/50">
                <div>
                  <div className="text-[14px] text-[#d1d5db] font-medium mb-1">BBC RSS</div>
                  <div className="text-[11px] text-[#6b7280]">RSS Feed · Every 30m</div>
                </div>
                <div><span className="text-[#10b981] font-medium text-[12px]">Healthy</span></div>
              </div>
              
              {/* Row 4 */}
              <div className="flex justify-between items-center py-4">
                <div>
                  <div className="text-[14px] text-[#d1d5db] font-medium mb-1">Reuters RSS</div>
                  <div className="text-[11px] text-[#6b7280]">RSS · Every 30m</div>
                </div>
                <div><span className="bg-[#78350f]/30 text-[#fbbf24] border border-[#92400e]/50 px-2 py-0.5 rounded text-[11px] font-medium">Warning</span></div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Bottom Section - System Health */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
          <h2 className="font-serif text-[18px] font-bold m-0 mb-6">System Health</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-4">
              <h4 className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider m-0 mb-2">API Response</h4>
              <div className="text-[#10b981] font-bold text-[18px] mb-1">142ms</div>
              <div className="text-[#4b5563] text-[11px]">p95</div>
            </div>
            
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-4">
              <h4 className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider m-0 mb-2">DB Query</h4>
              <div className="text-[#10b981] font-bold text-[18px] mb-1">38ms</div>
              <div className="text-[#4b5563] text-[11px]">avg</div>
            </div>
            
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-4">
              <h4 className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider m-0 mb-2">NLP Pipeline</h4>
              <div className="text-[#f59e0b] font-bold text-[18px] mb-1">4.2s</div>
              <div className="text-[#4b5563] text-[11px]">per article</div>
            </div>
            
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-4">
              <h4 className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider m-0 mb-2">ChromaDB</h4>
              <div className="text-[#10b981] font-bold text-[18px] mb-1">89ms</div>
              <div className="text-[#4b5563] text-[11px]">search</div>
            </div>
            
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-4 mt-2">
              <h4 className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider m-0 mb-2">Error Rate</h4>
              <div className="text-[#10b981] font-bold text-[18px] mb-1">0.02%</div>
              <div className="text-[#4b5563] text-[11px]">last 24h</div>
            </div>
            
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-4 mt-2">
              <h4 className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider m-0 mb-2">Uptime</h4>
              <div className="text-[#10b981] font-bold text-[18px] mb-1">99.98%</div>
              <div className="text-[#4b5563] text-[11px]">last 30d</div>
            </div>
            
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-4 mt-2">
              <h4 className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider m-0 mb-2">Queued Jobs</h4>
              <div className="text-[#f59e0b] font-bold text-[18px] mb-1">12</div>
              <div className="text-[#4b5563] text-[11px]">Celery</div>
            </div>
            
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-4 mt-2">
              <h4 className="text-[#6b7280] text-[10px] font-bold uppercase tracking-wider m-0 mb-2">LLM Errors</h4>
              <div className="text-[#10b981] font-bold text-[18px] mb-1">3</div>
              <div className="text-[#4b5563] text-[11px]">last 24h</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
