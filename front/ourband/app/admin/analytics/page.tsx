"use client";

import React from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const MOCK_ADMIN_LOGS = [
  { id: 1, admin: "admin@ourband.com", action: "User Banned", target: "스팸유저", date: "2024-04-26 10:20:00" },
  { id: 2, admin: "subadmin@ourband.com", action: "Report Resolved", target: "Report #3", date: "2024-04-26 09:15:30" },
  { id: 3, admin: "admin@ourband.com", action: "System Setting Changed", target: "SEO Meta", date: "2024-04-25 15:00:00" },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-secondary/50 p-5 rounded-2xl border border-border h-80 flex flex-col">
          <h3 className="font-bold text-white mb-4">게시판별 활동률</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: '오디오잼', posts: 4000, comments: 2400 },
                { name: '합주실', posts: 3000, comments: 1398 },
                { name: '밴드모집', posts: 2000, comments: 9800 },
                { name: '자유게시판', posts: 2780, comments: 3908 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="posts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-secondary/50 border border-border p-5 flex flex-col rounded-2xl">
          <h3 className="font-bold text-white mb-4">관리자 활동 로그 (Audit Trail)</h3>
          <div className="flex-1 overflow-auto hide-scrollbar space-y-3">
             {MOCK_ADMIN_LOGS.map(log => (
               <div key={log.id} className="bg-background/80 p-3 rounded-xl border border-border text-sm">
                 <div className="flex justify-between mb-1">
                   <span className="font-bold text-indigo-400">{log.admin}</span>
                   <span className="text-xs text-slate-500">{log.date}</span>
                 </div>
                 <div className="text-white">
                   <span className="px-2 py-0.5 bg-slate-800 rounded font-bold text-xs mr-2">{log.action}</span>
                   <span className="text-slate-300">Target: {log.target}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
