"use client";

import React, { useState } from "react";
import { Ban } from "lucide-react";

const MOCK_REPORTS = [
  { id: "1", type: "post", url: "/post/1", author: "스팸유저", reason: "광고/스팸", date: "2024-02-10", status: "pending", content: "최고의 악기 할인점에서 저렴하게 구매하세요!" },
  { id: "2", type: "comment", url: "/post/2", author: "기타초보", reason: "욕설/비방", date: "2024-02-12", status: "in_progress", content: "이딴 곡을 노래라고 올렸냐" },
  { id: "3", type: "jam", url: "/jam/4", author: "어그로꾼", reason: "부적절한 오디오", date: "2024-02-14", status: "resolved", content: "노이즈 및 비명 소리 위주" },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState(MOCK_REPORTS);

  const updateReportStatus = (id: string, status: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-lg font-bold text-white mb-4">신고 대기열 (Kanban)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['pending', 'in_progress', 'resolved'].map((colStatus) => {
          const colReports = reports.filter(r => r.status === colStatus);
          const titleMap: Record<string, string> = { pending: '대기 중', in_progress: '처리 중', resolved: '처리 완료' };
          const borderColorMap: Record<string, string> = { pending: 'border-red-500/30', in_progress: 'border-amber-500/30', resolved: 'border-emerald-500/30' };
          
          return (
            <div key={colStatus} className="flex flex-col gap-3">
              <div className={`p-3 rounded-xl border ${borderColorMap[colStatus]} bg-secondary/80 font-bold flex justify-between`}>
                <span className="text-white">{titleMap[colStatus]}</span>
                <span className="text-slate-400 bg-background px-2 rounded-full text-sm">{colReports.length}</span>
              </div>
              
              {colReports.map(report => (
                <div key={report.id} className="bg-secondary/50 border border-border rounded-xl p-4 flex flex-col gap-2 shadow-lg">
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold bg-background border border-border px-1.5 py-0.5 rounded text-slate-400">{report.type}</span>
                    <span className="text-xs text-slate-500">{report.date}</span>
                  </div>
                  <div className="text-red-400 font-bold text-sm">{report.reason}</div>
                  <div className="text-sm text-slate-300 line-clamp-2 bg-background/50 p-2 rounded border border-border/50">"{report.content}"</div>
                  <div className="text-xs text-slate-400">신고자: <span className="text-indigo-400">{report.author}</span></div>
                  
                  <select 
                    value={report.status} 
                    onChange={(e) => updateReportStatus(report.id, e.target.value)}
                    className="mt-2 text-xs bg-background border border-border rounded-lg px-2 py-1.5 w-full text-white"
                  >
                    <option value="pending">대기 중으로 이동</option>
                    <option value="in_progress">처리 중으로 이동</option>
                    <option value="resolved">완료 처리 (무시/삭제)</option>
                  </select>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-secondary/50 rounded-2xl border border-border p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Ban size={18} className="text-amber-500" /> 금칙어 설정</h3>
        <textarea 
          className="w-full h-24 bg-background border border-border rounded-xl p-3 text-sm text-white focus:border-primary focus:outline-none mb-3"
          defaultValue="도박, 불법, ㅆㅂ, ㅂㅅ, 바카라, 성인물"
          placeholder="콤마(,)로 구분하여 입력하세요"
        />
        <div className="flex justify-end"><button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">금칙어 업데이트</button></div>
      </div>
    </div>
  );
}
