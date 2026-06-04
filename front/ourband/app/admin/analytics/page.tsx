"use client";

import React, { useState, useEffect } from "react";
import { getAdminStatisticsApi, AdminStatistics, getVisitorTrendsApi, DailyVisitorResponse } from "@/api/admin/adminService";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { Loader2, TrendingUp, Users, Music, MessageSquare } from "lucide-react";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStatistics | null>(null);
  const [visitorTrends, setVisitorTrends] = useState<DailyVisitorResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsData, trendsData] = await Promise.all([
          getAdminStatisticsApi(),
          getVisitorTrendsApi()
        ]);
        setStats(statsData);
        setVisitorTrends(trendsData);
      } catch (error) {
        console.error("통계 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // 실제 데이터 기반 파이 차트 데이터 생성
  const contentDistribution = [
    { name: '오디오 잼', value: stats.totalJams },
    { name: '커뮤니티 글', value: stats.totalCommunityPosts },
    { name: '밴드', value: stats.totalBands },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">통계 및 분석</h1>
        <p className="text-slate-400 text-sm">플랫폼의 주요 지표와 사용자 행동 패턴을 분석합니다.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary/50 p-5 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Users size={24} /></div>
          <div>
            <div className="text-sm text-slate-400">총 사용자</div>
            <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}명</div>
          </div>
        </div>
        <div className="bg-secondary/50 p-5 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Music size={24} /></div>
          <div>
            <div className="text-sm text-slate-400">총 잼 콘텐츠</div>
            <div className="text-2xl font-bold text-white">{stats.totalJams.toLocaleString()}개</div>
          </div>
        </div>
        <div className="bg-secondary/50 p-5 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><MessageSquare size={24} /></div>
          <div>
            <div className="text-sm text-slate-400">커뮤니티 활성도</div>
            <div className="text-2xl font-bold text-white">{stats.totalCommunityPosts.toLocaleString()}건</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주간 활동 트렌드 */}
        <div className="bg-secondary/50 p-5 rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp size={18} className="text-primary" /> 주간 활동 트렌드</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorTrends}>
                <defs>
                  <linearGradient id="colorDAU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMAU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Area type="monotone" dataKey="dau" name="DAU" stroke="#6366f1" fillOpacity={1} fill="url(#colorDAU)" />
                <Area type="monotone" dataKey="mau" name="MAU" stroke="#10b981" fillOpacity={1} fill="url(#colorMAU)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 콘텐츠 분포 */}
        <div className="bg-secondary/50 p-5 rounded-2xl border border-border">
          <h3 className="font-bold text-white mb-6">전체 누적 콘텐츠 분포</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {contentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
