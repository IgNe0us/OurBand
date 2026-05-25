"use client";

import React from "react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div className="bg-secondary/50 rounded-2xl border border-border p-6 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-border pb-2">기본 사이트 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-400">사이트 이름</label>
            <input type="text" defaultValue="OurBand" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-400">SEO Description</label>
            <input type="text" defaultValue="음악가들을 위한 커뮤니티" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-2xl border border-border p-6 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-border pb-2">접근 제어 (IP 블랙리스트/화이트리스트)</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-400">Blacklist IP (차단)</label>
            <textarea defaultValue="192.168.1.100\n10.0.0.5" className="w-full h-20 bg-background border border-border rounded-lg p-3 text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-400">Admin Whitelist IP (관리자 접속 허용)</label>
            <textarea defaultValue="172.16.0.1\n172.16.0.2" className="w-full h-20 bg-background border border-border rounded-lg p-3 text-white" />
            <p className="text-xs text-amber-500">주의: 화이트리스트를 비우면 모든 IP에서 관리자 접속이 허용됩니다.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
         <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-colors">설정 저장</button>
      </div>
    </div>
  );
}
