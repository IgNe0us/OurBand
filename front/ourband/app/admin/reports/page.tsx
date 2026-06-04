"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Ban, Loader2, Search, Filter, Calendar, ChevronLeft, ChevronRight, AlertCircle, ExternalLink } from "lucide-react";
import { getAdminReportsApi, updateAdminReportStatusApi, AdminReport } from "@/api/admin/adminService";
import toast from "react-hot-toast";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getAdminReportsApi();
      setReports(data);
    } catch (error) {
      toast.error("신고 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateReportStatus = async (id: string, status: string) => {
    try {
      await updateAdminReportStatusApi(id, status);
      setReports(reports.map(r => r.id === id ? { ...r, status } : r));
      toast.success("신고 상태가 변경되었습니다.");
    } catch (error: any) {
      console.error(error);
      toast.error(`신고 상태 변경에 실패했습니다: ${error?.response?.data?.message || error.message || '알 수 없는 오류'}`);
    }
  };

  // Extract unique types for the filter dropdown
  const uniqueTypes = useMemo(() => Array.from(new Set(reports.map(r => r.type))), [reports]);

  // Apply Filters
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // 1. Status Filter
      if (filterStatus !== "ALL" && report.status !== filterStatus) return false;
      // 2. Type Filter
      if (filterType !== "ALL" && report.type !== filterType) return false;
      // 3. Search Filter (Author or Content)
      if (searchKeyword.trim() !== "") {
        const keyword = searchKeyword.toLowerCase();
        const contentMatch = report.content.toLowerCase().includes(keyword);
        const authorMatch = report.author.toLowerCase().includes(keyword);
        if (!contentMatch && !authorMatch) return false;
      }
      // 4. Date Filter
      if (startDate && new Date(report.date) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(report.date) > end) return false;
      }
      return true;
    });
  }, [reports, filterStatus, filterType, searchKeyword, startDate, endDate]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, searchKeyword, startDate, endDate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">대기 중</span>;
      case 'in_progress': return <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">처리 중</span>;
      case 'resolved': return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">처리 완료</span>;
      case 'rejected': return <span className="bg-slate-500/20 text-slate-400 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">기각</span>;
      default: return <span className="bg-slate-500/20 text-slate-400 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">{status}</span>;
    }
  };

  const formatReportType = (type: string) => {
    const typeMap: Record<string, string> = {
      'COMMUNITY_POST': '커뮤니티 글',
      'COMMUNITY_COMMENT': '커뮤니티 댓글',
      'BAND_POST': '밴드 모집 글',
      'BAND_COMMENT': '밴드 모집 댓글',
      'JAM_POST': '오디오잼',
      'JAM_COMMENT': '오디오잼 댓글',
      'HISTORY_POST': '프로필 히스토리',
      'HISTORY_COMMENT': '히스토리 댓글',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <AlertCircle className="text-rose-500" />
          신고/모니터링 현황
        </h2>
        
        {/* Status Tabs */}
        <div className="flex bg-secondary p-1 rounded-xl border border-border">
          {['ALL', 'pending', 'in_progress', 'resolved', 'rejected'].map(status => {
            const labelMap: Record<string, string> = { ALL: '전체', pending: '대기 중', in_progress: '처리 중', resolved: '처리 완료', rejected: '기각' };
            const isActive = filterStatus === status;
            return (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  isActive ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {labelMap[status]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-secondary/50 border border-border rounded-2xl p-4 flex flex-col xl:flex-row gap-4 items-end xl:items-center">
        {/* Search */}
        <div className="flex-1 w-full relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="신고자 이름 또는 내용 검색..."
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className="w-full bg-background border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <Calendar size={18} className="text-slate-400" />
          <input 
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary [color-scheme:dark]"
          />
          <span className="text-slate-500">~</span>
          <input 
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary [color-scheme:dark]"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary min-w-[150px]"
          >
            <option value="ALL">모든 유형</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{formatReportType(type)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-20 bg-secondary/30 rounded-2xl border border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-secondary/30 rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-border bg-secondary/80">
                  <th className="p-4 text-xs font-bold text-slate-400 w-24">상태</th>
                  <th className="p-4 text-xs font-bold text-slate-400 w-32">신고일</th>
                  <th className="p-4 text-xs font-bold text-slate-400 w-32">유형</th>
                  <th className="p-4 text-xs font-bold text-slate-400 w-32">신고자</th>
                  <th className="p-4 text-xs font-bold text-slate-400 w-32">사유</th>
                  <th className="p-4 text-xs font-bold text-slate-400 max-w-xs">신고 내용 요약</th>
                  <th className="p-4 text-xs font-bold text-slate-400 w-44 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">조건에 맞는 신고 내역이 없습니다.</td>
                  </tr>
                ) : (
                  paginatedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 align-middle">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="p-4 text-sm text-slate-300 whitespace-nowrap">
                        {new Date(report.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm font-semibold text-white truncate">
                        {formatReportType(report.type)}
                      </td>
                      <td className="p-4 text-sm text-slate-400 truncate">
                        {report.author}
                      </td>
                      <td className="p-4 text-sm text-rose-400 truncate font-medium">
                        {report.reason}
                      </td>
                      <td className="p-4 text-sm text-slate-300 max-w-xs truncate" title={report.content}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{report.content}</span>
                          {report.url && (
                            <a href={report.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 shrink-0 bg-primary/20 text-primary hover:bg-primary hover:text-white px-2 py-0.5 rounded text-xs font-bold transition-colors">
                              <ExternalLink size={12} /> 이동
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-end gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                          {report.status === 'pending' && (
                            <button onClick={() => updateReportStatus(report.id, 'in_progress')} className="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                              처리 시작
                            </button>
                          )}
                          {report.status === 'in_progress' && (
                            <>
                              <button onClick={() => updateReportStatus(report.id, 'resolved')} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                                제재
                              </button>
                              <button onClick={() => updateReportStatus(report.id, 'rejected')} className="px-3 py-1.5 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                                기각
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border bg-secondary/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                총 {filteredReports.length}건 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredReports.length)}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border-border text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => {
                  // Simple logic to show only surrounding pages
                  if (i + 1 === 1 || i + 1 === totalPages || Math.abs(currentPage - (i + 1)) <= 1) {
                    return (
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          currentPage === i + 1 ? 'bg-primary text-white border-transparent' : 'bg-background border border-border text-slate-400 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  } else if (Math.abs(currentPage - (i + 1)) === 2) {
                    return <span key={i} className="text-slate-500 px-1">...</span>;
                  }
                  return null;
                })}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border-border text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
