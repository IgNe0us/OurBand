"use client";

import React, { useState } from "react";
import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/store/userProfileContext";

const MOCK_USERS = [
  { id: "1", username: "드럼머신", email: "drum@example.com", joined: "2023-11-20", status: "active", reports: 0, role: "user", lastIp: "192.168.1.1" },
  { id: "2", username: "기타초보", email: "guitar@example.com", joined: "2023-12-01", status: "active", reports: 2, role: "user", lastIp: "192.168.1.25" },
  { id: "3", username: "스팸유저", email: "spam@example.com", joined: "2024-01-15", status: "banned", reports: 12, role: "user", lastIp: "10.0.0.5" },
  { id: "4", username: "운영자", email: "admin@ourband.com", joined: "2023-10-05", status: "active", reports: 0, role: "super_admin", lastIp: "172.16.0.1" },
  { id: "5", username: "부운영자", email: "subadmin@ourband.com", joined: "2023-11-01", status: "active", reports: 0, role: "admin", lastIp: "172.16.0.2" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const { openUserProfile } = useUserProfile();

  const handleToggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === "active" ? "banned" : "active" } : u));
  };

  const handleRoleChange = (id: string, role: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  };

  const filteredUsers = users.filter(u => 
    (userFilter === 'all' || u.status === userFilter || u.role === userFilter) &&
    (u.username.includes(searchQuery) || u.email.includes(searchQuery))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex space-x-2 border-b border-border mb-6">
        <button
          className="px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors border-primary text-white"
        >
          <User size={18} /> 일반 회원 관리
        </button>
      </div>

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
                    <div 
                      className="w-8 h-8 rounded-full bg-slate-800 shrink-0 cursor-pointer flex items-center justify-center overflow-hidden"
                      onClick={() => openUserProfile(Number(user.id), user.username, "")}
                    >
                      <User size={16} className="text-slate-500" />
                    </div>
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
    </div>
  );
}
