"use client";

// @ts-nocheck

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music2, ArrowRight, Mail, Lock } from "lucide-react";
import { motion } from "motion/react";

import { loginUserApi } from "@/api/account/userService";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;

  const handleLogin = async(e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      await loginUserApi( { email, password });
      router.refresh();
      router.push("/");

    } catch (e) {
      console.error(e);
      toast.error("로그인 실패");
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
            <a href="#" className="text-xs text-primary font-semibold hover:text-indigo-400 transition-colors">
              비밀번호를 잊으셨나요?
            </a>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl py-4 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "로그인 중..." : "이메일로 로그인"} <ArrowRight size={18} className={isLoading ? "hidden" : "group-hover:translate-x-1 transition-transform"} />
          </button>
        </form>

        {/* <div className="mt-8 mb-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-4 text-slate-500 font-medium">또는 간편 로그인</span>
          </div>
        </div> */}

        {/* <div className="flex flex-col gap-3">
          <button 
            type="button" 
            disabled={isLoading}
            onClick={() => handleSocialLogin('kakao')}
            className="w-full bg-[#FEE500] hover:bg-[#F4DC00] text-black/90 font-bold rounded-xl py-3.5 flex justify-center items-center gap-3 transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute left-5">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 3c-4.97 0-9 3.18-9 7.1 0 2.54 1.7 4.76 4.25 5.97-.14.45-.48 1.66-.53 1.83-.06.2.06.2.18.12.16-.1 1.95-1.3 2.76-1.84.75.1 1.53.15 2.34.15 4.97 0 9-3.18 9-7.1S16.97 3 12 3z"/>
              </svg>
            </div>
            {isLoading ? "처리 중..." : "카카오 로그인"}
          </button>
          
          <button 
            type="button" 
            disabled={isLoading}
            onClick={() => handleSocialLogin('naver')}
            className="w-full bg-[#03C75A] hover:bg-[#02B351] text-white font-bold rounded-xl py-3.5 flex justify-center items-center gap-3 transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute left-5 font-black font-sans text-lg leading-none -mt-0.5">
              N
            </div>
            {isLoading ? "처리 중..." : "네이버 로그인"}
          </button>

          <button 
            type="button"  
            disabled={isLoading}
            onClick={() => handleSocialLogin('google')}
            className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl py-3.5 flex justify-center items-center gap-3 transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute left-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            {isLoading ? "처리 중..." : "구글 로그인"}
          </button>
        </div> */}

        <div className="mt-8 text-center text-sm text-slate-400">
          아직 계정이 없으신가요? &nbsp;
          <Link href="/register" className="text-primary font-bold hover:text-indigo-400 transition-colors">
            회원가입
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
