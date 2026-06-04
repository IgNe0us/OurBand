"use client";

// @ts-nocheck

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music2, ArrowRight, Mail, Lock, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

import { loginUserApi } from "@/api/account/userService";
import { getPublicSettingsApi } from "@/api/settings/settingsService";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  React.useEffect(() => {
    getPublicSettingsApi().then(res => {
      if (res['maintenance_mode'] === 'true') {
        setIsMaintenance(true);
      }
    }).catch(console.error);
  }, []);

  const handleLogin = async(e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      await loginUserApi( { email, password });
      router.refresh();
      router.push("/");

    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message || "로그인 실패";
      toast.error(<div className="whitespace-pre-line">{errorMsg}</div>);
    } finally {
      setIsLoading(false);
    }
    // setIsLoading(true);
    
    // if (email === "admin" || email.startsWith("admin")) {
    //   localStorage.setItem('ourband_isAdmin', 'true');
    // } else {
    //   localStorage.removeItem('ourband_isAdmin');
    // }
    
    // // 로그인 처리 후 메인으로 이동 (시뮬레이션)
    // setTimeout(() => {
    //   navigate("/");
    // }, 800);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    localStorage.removeItem('ourband_isAdmin');
    // 향후 실제 OAuth 연동 필요 (카카오, 네이버, 구글)
    setTimeout(() => {
      navigate("/");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-6">
            <Music2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">다시 오셨네요!</h1>
          <p className="text-slate-400 text-sm font-medium">뮤지션들의 연결 고리, 계속 연주해볼까요?</p>
        </div>

        {isMaintenance && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-500 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">
              현재 시스템 점검 중입니다.<br />
              <span className="text-rose-400/80">일반 계정 로그인이 차단되며, 관리자 계정으로만 접근할 수 있습니다.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 pl-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="musician@example.com" 
                className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 pl-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-1 pb-4">
            <Link href="/find-account" className="text-xs text-primary font-semibold hover:text-indigo-400 transition-colors">
              로그인에 어려움이 있으신가요?
            </Link>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl py-4 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "로그인 중..." : "이메일로 로그인"} <ArrowRight size={18} className={isLoading ? "hidden" : "group-hover:translate-x-1 transition-transform"} />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          아직 계정이 없으신가요? &nbsp;
          <Link href="/register" className="text-primary font-bold hover:text-indigo-400 transition-colors">
            회원가입
          </Link>
        </div>

        {/* Test Admin Accounts for Interviewers */}
        <div className="mt-8 p-5 bg-secondary/50 backdrop-blur-sm border border-primary/20 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">관리자 계정 (하단 계정 클릭시 자동입력)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">빠른 테스트를 위해 제공되는 관리자 계정입니다.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">유저 계정은 회원가입을 통해 진행해 주세요.</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div 
              className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/50 hover:border-indigo-500/50 transition-colors cursor-pointer group/item" 
              onClick={() => { setEmail('sys@c.com'); setPassword('netid001'); }}
            >
              <div>
                <div className="text-xs font-bold text-indigo-400 mb-0.5">시스템 관리자</div>
                <div className="text-xs text-slate-300">sys@c.com</div>
              </div>
              <div className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20 group-hover/item:bg-indigo-500/20 transition-colors">
                자동 입력
              </div>
            </div>
            
            <div 
              className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/50 hover:border-pink-500/50 transition-colors cursor-pointer group/item" 
              onClick={() => { setEmail('ser@c.com'); setPassword('netid001'); }}
            >
              <div>
                <div className="text-xs font-bold text-pink-400 mb-0.5">서비스 관리자</div>
                <div className="text-xs text-slate-300">ser@c.com</div>
              </div>
              <div className="text-[10px] bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-md border border-pink-500/20 group-hover/item:bg-pink-500/20 transition-colors">
                자동 입력
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
