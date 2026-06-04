"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, User, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/store/userProfileContext";
import { getAdminUsersApi, updateAdminUserStatusApi, updateAdminUserRoleApi, AdminUser } from "@/api/admin/adminService";
import { getUserInfoApi } from "@/api/account/userService";
import toast from "react-hot-toast";

const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { openUserProfile } = useUserProfile();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [isCustomDays, setIsCustomDays] = useState<boolean>(false);
  const [suspendReason, setSuspendReason] = useState<string>("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [data, userInfo] = await Promise.all([
        getAdminUsersApi(),
        getUserInfoApi()
      ]);
      setUsers(data);
      setCurrentUserType(userInfo.type);
    } catch (error) {
      toast.error("사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (id: string, currentStatus: string) => {
    if (currentStatus === "active") {
      setSelectedUserId(id);
      setSuspendDays(7);
      setIsCustomDays(false);
      setSuspendReason("");
      setIsModalOpen(true);
    } else {
      try {
        await updateAdminUserStatusApi(id, "active");
        setUsers(users.map(u => u.id === id ? { ...u, status: "active", suspendedUntil: undefined, suspendReason: undefined } : u));
        toast.success("사용자 정지가 해제되었습니다.");
      } catch (error) {
        toast.error("상태 변경에 실패했습니다.");
      }
    }
  };

  const handleSubmitSuspend = async () => {
    if (!selectedUserId) return;
    try {
      await updateAdminUserStatusApi(selectedUserId, "banned", suspendDays, suspendReason);
      setUsers(users.map(u => u.id === selectedUserId ? { ...u, status: "banned", suspendReason } : u));
      toast.success("사용자가 정지되었습니다.");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("사용자 정지에 실패했습니다.");
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateAdminUserRoleApi(id, role);
      setUsers(users.map(u => u.id === id ? { ...u, role } : u));
      toast.success("사용자 권한이 변경되었습니다.");
    } catch (error) {
      toast.error("권한 변경에 실패했습니다.");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (userFilter === 'all' || u.status === userFilter || u.role === userFilter) &&
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, userFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [userFilter, searchQuery]);

  // Clamp page if out of range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredUsers.length, totalPages, currentPage]);

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
            <option value="service_admin">서비스 관리자</option>
            <option value="system_admin">시스템 관리자</option>
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

      <div className="bg-secondary/50 rounded-2xl border border-border overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-secondary border-b border-border uppercase text-xs font-bold text-slate-500">
            <tr>
              <th className="px-4 py-4">사용자</th>
              <th className="px-4 py-4 hidden md:table-cell">가입일</th>
              <th className="px-4 py-4">권한</th>
              <th className="px-4 py-4">상태</th>
              <th className="px-4 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
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
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={currentUserType !== 'system_admin'}
                    className={cn(
                      "bg-background border border-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none",
                      currentUserType !== 'system_admin' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <option value="user">일반 유저</option>
                    <option value="service_admin">서비스 관리자</option>
                    <option value="system_admin">시스템 관리자</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase", user.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => handleToggleUserStatus(user.id, user.status)}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border", user.status === "active" ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white")}
                  >
                    {user.status === "active" ? "정지" : "해제"}
                  </button>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-background border border-border p-3 rounded-2xl">
          <span className="text-sm text-slate-400">
            총 <strong className="text-white">{filteredUsers.length}</strong>명 중{" "}
            <strong className="text-white">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}</strong>명
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-bold transition-colors",
                    pageNum === currentPage
                      ? "bg-primary text-white"
                      : "bg-secondary text-slate-400 hover:text-white"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-secondary border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-1">사용자 정지</h3>
              <p className="text-sm text-slate-400 mb-6">사용자 계정을 정지 처리합니다.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">정지 기간</label>
                  <div className="flex gap-2">
                    <select 
                      value={isCustomDays ? -1 : suspendDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val === -1) {
                          setIsCustomDays(true);
                          setSuspendDays(0);
                        } else {
                          setIsCustomDays(false);
                          setSuspendDays(val);
                        }
                      }}
                      className={cn("bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary", isCustomDays ? "w-1/2" : "w-full")}
                    >
                      <option value={1}>1일</option>
                      <option value={3}>3일</option>
                      <option value={7}>7일</option>
                      <option value={30}>30일</option>
                      <option value={9999}>영구 정지</option>
                      <option value={-1}>직접 입력</option>
                    </select>
                    {isCustomDays && (
                      <input 
                        type="number"
                        min="1"
                        max="36500"
                        value={suspendDays === 0 ? '' : suspendDays}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSuspendDays(val > 36500 ? 36500 : val);
                        }}
                        placeholder="일수 입력 (최대 36500)"
                        className="w-1/2 bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">정지 사유</label>
                  <textarea 
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="정지 사유를 입력하세요 (예: 욕설 및 비방)"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-background/50 border-t border-border p-4 flex justify-end gap-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleSubmitSuspend}
                disabled={!suspendReason.trim()}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                정지하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
