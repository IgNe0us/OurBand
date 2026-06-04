"use client";

import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-secondary/30 border border-border rounded-3xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <AlertTriangle className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-black text-white">서버 점검 중입니다</h1>
        
        <p className="text-slate-400 text-sm leading-relaxed">
          더 나은 서비스를 제공하기 위해 임시 점검을 진행하고 있습니다.<br />
          이용에 불편을 드려 죄송합니다. 잠시 후 다시 접속해 주세요.
        </p>

        <div className="bg-background border border-border rounded-xl p-4 flex items-center justify-center gap-3">
          <Clock className="w-5 h-5 text-slate-500" />
          <span className="text-sm font-medium text-slate-300">신속하게 작업을 완료하겠습니다.</span>
        </div>

        <button 
          onClick={() => router.push("/")}
          className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-3 rounded-xl font-bold transition-all"
        >
          홈으로 돌아가기 시도
        </button>
      </div>
    </div>
  );
}
