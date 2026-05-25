"use client";

import React, { useState } from "react";
import { Users, UserPlus, MessageSquare, Activity } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const MOCK_VISITORS_TREND = [
  { name: 'Mon', DAU: 4000, MAU: 24000 },
  { name: 'Tue', DAU: 3000, MAU: 24500 },
  { name: 'Wed', DAU: 2000, MAU: 25000 },
  { name: 'Thu', DAU: 2780, MAU: 25500 },
  { name: 'Fri', DAU: 1890, MAU: 26000 },
  { name: 'Sat', DAU: 2390, MAU: 26500 },
  { name: 'Sun', DAU: 3490, MAU: 27000 },
];

export default function AdminOverviewPage() {
  const [reports] = useState([{ status: "pending" }, { status: "pending" }, { status: "resolved" }]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "DAU", value: "3,490", increase: "+12%", icon: Users },
          { label: "신규 가입자", value: "128", increase: "+5%", icon: UserPlus },
          { label: "총 게시글", value: "85,210", increase: "+1.2%", icon: MessageSquare },
          { label: "실시간 방문객", value: "482", increase: "안정적", icon: Activity },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-secondary/50 p-5 rounded-2xl border border-border">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 text-sm font-bold">{stat.label}</span>
                <Icon size={16} className="text-primary" />
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-emerald-400 mt-1">{stat.increase}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        <div className="lg:col-span-2 bg-secondary/50 p-5 rounded-2xl border border-border flex flex-col h-full">
          <h3 className="font-bold text-white mb-4">방문자 트렌드 (DAU/MAU)</h3>
          <div className="flex-1 min-h-0 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_VISITORS_TREND}>
                <defs>
                  <linearGradient id="colorDAU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="DAU" stroke="#6366f1" fillOpacity={1} fill="url(#colorDAU)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-secondary/50 p-5 rounded-2xl border border-border flex flex-col gap-4 h-full">
          <h3 className="font-bold text-white">실시간 시스템 상태</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">CPU 사용량</span><span className="text-emerald-400">24%</span></div>
              <div className="w-full bg-background rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: '24%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Memory (RAM)</span><span className="text-amber-400">68%</span></div>
              <div className="w-full bg-background rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '68%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">스토리지 용량</span><span className="text-primary">42%</span></div>
              <div className="w-full bg-background rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: '42%' }} /></div>
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-border">
            <h4 className="text-sm font-bold text-white mb-2">관리자 할 일</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-red-400 bg-red-400/10 p-2 rounded-lg">
                <span>미처리 신고</span> <span className="font-bold">{reports.filter(r => r.status === 'pending').length}건</span>
              </div>
              <div className="flex justify-between items-center text-amber-400 bg-amber-400/10 p-2 rounded-lg">
                <span>승인 대기 콘텐츠</span> <span className="font-bold">5건</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
