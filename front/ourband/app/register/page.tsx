"use client";

// @ts-nocheck

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music2, ArrowRight, Mail, Lock, User, Guitar, Briefcase, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// 💡 실제 프로젝트 구조에 맞게 API 호출 함수들을 임포트하세요.
import { registerUserApi, loginUserApi } from "@/api/account/userService";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<"user" | "business">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [instrument, setInstrument] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessFile, setBusinessFile] = useState<File | null>(null);
  
  // 💡 비동기 통신을 위한 로딩 및 에러 상태 추가
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. 프론트엔드 유효성 검사
    if (accountType === "business") {
        if (!businessNumber) {
            setError("사업자 등록 번호를 입력해주세요.");
            return;
        }
        if (!businessFile) {
            setError("사업자 등록증 사본을 첨부해주세요.");
            return;
        }
    }
    if (accountType === "user" && !instrument) {
        setError("주 포지션을 선택해주세요.");
        return;
    }

    if (!name || !email || !password) {
        setError("닉네임, 이메일, 비밀번호를 모두 입력해야 합니다.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 2. 백엔드 스펙에 맞게 데이터 준비
      const payload = {
        nickname: name, // UI에서는 name을 쓰지만, 기존 API 스펙인 nickname으로 매핑
        email,
        password,
        type: accountType,
        instrument,
        businessNumber
        // 💡 백엔드 스펙에 따라 아래 데이터도 넘겨야 할 수 있습니다.
        // accountType, instrument, businessNumber, 등
      };

      // 3. 회원가입 API 호출
      await registerUserApi(payload);
      
      // (선택 사항) 사업자 회원의 경우 별도 처리 로직이 필요하다면 여기에 작성
      // if (accountType === "business") { ... }

      // 4. ⭐ 회원가입 성공 시 자동 로그인 처리 ⭐
      // 회원가입 직후 곧바로 로그인 API를 호출하여 토큰을 발급받습니다.
      const loginPayload = { email, password };
      const loginResponse = await loginUserApi(loginPayload);

      // 💡 토큰 쿠키 저장 (백엔드가 HttpOnly 쿠키로 주지 않고 JSON으로 줄 경우 프론트에서 세팅)
      // 만약 백엔드에서 자체적으로 세팅해준다면 이 부분은 생략해도 됩니다.
      // 예시 (js-cookie 라이브러리 등을 사용하거나 document.cookie 사용):
      // document.cookie = `access_token=${loginResponse.data.token}; path=/; max-age=3600`;

      // 5. 로그인 완료 후 메인 페이지('/')로 리다이렉트
      // router.refresh()를 호출해 미들웨어가 쿠키 변화를 감지하게 합니다.
      router.refresh();
      router.push("/");

    } catch (e: any) {
      console.error("Sign Up Error:", e);
      if (e.response && e.response.data) {
        const message = e.response.data.message || "알 수 없는 오류가 발생했습니다.";
        setError(`가입 실패: ${message}`);
      } else {
        setError("네트워크 오류가 발생했습니다. 백엔드 서버가 정상 작동 중인지 확인해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden overflow-y-auto">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm z-10 py-12"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-secondary border border-border rounded-2xl flex items-center justify-center mb-6">
            <Music2 size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">새로운 여정</h1>
          <p className="text-slate-400 text-sm font-medium">당신의 음악적 프로필을 완성하세요.</p>
        </div>

        {/* Account Type Toggle */}
        {/* <div className="flex p-1 bg-secondary border border-border rounded-xl mb-8 relative">
          <div 
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-sm transition-all duration-300", 
              accountType === "business" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
            )}
          />
          <button
            type="button"
            onClick={() => setAccountType("user")}
            className={cn("flex-1 py-2.5 text-sm font-bold z-10 transition-colors", accountType === "user" ? "text-white" : "text-slate-500")}
          >
            일반 회원
          </button>
          <button
            type="button"
            onClick={() => setAccountType("business")}
            className={cn("flex-1 py-2.5 text-sm font-bold z-10 transition-colors", accountType === "business" ? "text-white" : "text-slate-500")}
          >
            사업자 회원
          </button>
        </div> */}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 pl-1">활동명 (닉네임)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={accountType === "business" ? "예: 사운드홀릭 대표" : "예: 홍대 불꽃기타"} 
                className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                required
              />
            </div>
          </div>

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
                placeholder="최소 8자 이상" 
                className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                required
                minLength={8}
              />
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {accountType === "user" ? (
              <motion.div
                key="user-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-bold text-slate-400 pl-1">주 포지션</label>
                <div className="relative">
                  <Guitar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <select 
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>포지션을 선택해주세요</option>
                    <option value="vocal">보컬</option>
                    <option value="guitar">기타</option>
                    <option value="bass">베이스</option>
                    <option value="drum">드럼</option>
                    <option value="keyboard">건반 / 피아노</option>
                    <option value="midi">작곡 / 미디</option>
                    <option value="other">기타 악기</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="business-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 pl-1">사업자 등록 번호</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      value={businessNumber}
                      onChange={(e) => setBusinessNumber(e.target.value)}
                      placeholder="000-00-00000" 
                      className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-slate-400 pl-1">사업자 등록증 첨부</label>
                  <label className="w-full bg-secondary border border-dashed border-border hover:border-primary/50 hover:bg-slate-800/50 rounded-xl py-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                    <FileText className={businessFile ? "text-primary" : "text-slate-500"} size={24} />
                    <span className="text-sm font-medium text-slate-300">
                      {businessFile ? businessFile.name : "눌러서 파일 업로드"}
                    </span>
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf" 
                      className="hidden" 
                      onChange={(e) => setBusinessFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 💡 에러 발생 시 UI 출력 영역 */}
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-xl">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-4 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all group mt-6"
          >
            {isLoading ? "가입 처리 중..." : "가입 완료하기"}
            {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          이미 계정이 있으신가요? &nbsp;
          <Link href="/login" className="text-primary font-bold hover:text-indigo-400 transition-colors">
            로그인
          </Link>
        </div>
      </motion.div>
    </div>
  );
}