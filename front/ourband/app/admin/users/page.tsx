"use client";

import React, { useState } from "react";
import { Search, Building, User } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_USERS = [
  { id: "1", username: "드럼머신", email: "drum@example.com", joined: "2023-11-20", status: "active", reports: 0, role: "user", lastIp: "192.168.1.1" },
  { id: "2", username: "기타초보", email: "guitar@example.com", joined: "2023-12-01", status: "active", reports: 2, role: "user", lastIp: "192.168.1.25" },
  { id: "3", username: "스팸유저", email: "spam@example.com", joined: "2024-01-15", status: "banned", reports: 12, role: "user", lastIp: "10.0.0.5" },
  { id: "4", username: "운영자", email: "admin@ourband.com", joined: "2023-10-05", status: "active", reports: 0, role: "super_admin", lastIp: "172.16.0.1" },
  { id: "5", username: "부운영자", email: "subadmin@ourband.com", joined: "2023-11-01", status: "active", reports: 0, role: "admin", lastIp: "172.16.0.2" },
];

const MOCK_BUSINESS_APPS = [
  { id: "b1", username: "낙원악기상가", email: "contact@nakwon.com", appliedAt: "2024-04-20", status: "pending", businessNumber: "123-45-67890", description: "악기 전문 판매점입니다." },
  { id: "b2", username: "사운드스튜디오", email: "studio@sound.com", appliedAt: "2024-04-25", status: "pending", businessNumber: "098-76-54321", description: "홍대 인근 24시간 합주실 운영" },
];

export default function AdminUsersPage() {
  const [viewMode, setViewMode] = useState<"users" | "business">("users");
  const [users, setUsers] = useState(MOCK_USERS);
  const [businessApps, setBusinessApps] = useState(MOCK_BUSINESS_APPS);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const handleToggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === "active" ? "banned" : "active" } : u));
  };

  const handleRoleChange = (id: string, role: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  };

  const handleBusinessApprove = (id: string) => {
    setBusinessApps(businessApps.map(app => app.id === id ? { ...app, status: "approved" } : app));
    // In a real app, this would also add the user to the users list or change their role to 'business'
  };

  const handleBusinessReject = (id: string) => {
    setBusinessApps(businessApps.map(app => app.id === id ? { ...app, status: "rejected" } : app));
  };

  const filteredUsers = users.filter(u => 
    (userFilter === 'all' || u.status === userFilter || u.role === userFilter) &&
    (u.username.includes(searchQuery) || u.email.includes(searchQuery))
  );

  const pendingApps = businessApps.filter(app => app.status === "pending");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border mb-6">
        <button
          onClick={() => setViewMode("users")}
          className={cn(
            "px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors",
            viewMode === "users" ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <User size={18} /> 일반 회원 관리
        </button>
        <button
          onClick={() => setViewMode("business")}
          className={cn(
            "px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors",
            viewMode === "business" ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Building size={18} /> 사업자 가입 신청
          {pendingApps.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{pendingApps.length}</span>
          )}
        </button>
      </div>

      {viewMode === "users" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2">
              <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option value="all">전체 상태/권한</option>
                <option value="active">활성 사용자</option>
                <option value="banned">정지 사용자</option>
                <option value="admin">관리자/부운영자</option>
              </select>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="아이디/이메일 검색" 
                className="w-full bg-secondary border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="bg-secondary/50 rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-secondary border-b border-border uppercase text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-4">사용자</th>
                  <th className="px-4 py-4 hidden md:table-cell">가입일 / IP</th>
                  <th className="px-4 py-4">권한</th>
                  <th className="px-4 py-4">상태</th>
                  <th className="px-4 py-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0"><img src={`https://picsum.photos/seed/${user.id}/100/100`} className="rounded-full w-full h-full" alt={user.username} /></div>
                        <div>
                          <div className="font-bold text-white">{user.username}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div>{user.joined}</div>
                      <div className="text-xs text-slate-500">{user.lastIp}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="user">일반 유저</option>
                        <option value="business">사업자</option>
                        <option value="admin">부운영자</option>
                        <option value="super_admin">최고 관리자</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase", user.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleToggleUserStatus(user.id)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border", user.status === "active" ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white")}
                      >
                        {user.status === "active" ? "정지" : "해제"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">검색 결과가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-white mb-2">승인 대기중인 사업자 내역</h3>
          {pendingApps.length === 0 ? (
            <div className="bg-secondary/50 rounded-2xl border border-border flex flex-col items-center justify-center p-12 text-slate-400">
              <Building size={48} className="mb-4 text-slate-600" />
              <p>승인 대기중인 가입 신청이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApps.map(app => (
                <div key={app.id} className="bg-secondary/50 border border-border rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-lg">{app.username}</h4>
                      <div className="text-sm text-slate-400">{app.email}</div>
                    </div>
                    <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">신청 대기</span>
                  </div>
                  
                  <div className="bg-background rounded-lg p-3 text-sm space-y-2 border border-border/50">
                    <div className="flex justify-between">
                      <span className="text-slate-500">사업자 등록번호</span>
                      <span className="text-white font-mono">{app.businessNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">신청일자</span>
                      <span className="text-white">{app.appliedAt}</span>
                    </div>
                    <div className="pt-2 border-t border-border/50 mt-2">
                      <span className="text-slate-500 block mb-1">상세 설명</span>
                      <p className="text-slate-300">{app.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => handleBusinessReject(app.id)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      거절
                    </button>
                    <button 
                      onClick={() => handleBusinessApprove(app.id)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/80 transition-colors"
                    >
                      수락
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

