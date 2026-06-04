"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Music2, ArrowLeft, Mail, Lock, User } from "lucide-react";
import toast from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";
import { findIdSendEmailApi, sendAuthCodeApi, verifyAuthCodeApi, resetPasswordApi } from "@/api/account/userService";
import { cn } from "@/lib/utils";

export default function FindAccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"id" | "password">("id");
  
  // 공통 상태
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 이메일 찾기 상태
  const [nickname, setNickname] = useState("");

  // 비밀번호 찾기 상태
  const [email, setEmail] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [timer, setTimer] = useState(300);
  
  // 비밀번호 재설정 폼 상태
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCodeSent && timer > 0 && !isEmailVerified) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && !isEmailVerified) {
      setIsCodeSent(false);
      setError("인증 시간이 만료되었습니다. 다시 시도해주세요.");
    }
    return () => clearInterval(interval);
  }, [isCodeSent, timer, isEmailVerified]);

  const handleTabChange = (tab: "id" | "password") => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
    setIsCodeSent(false);
    setIsEmailVerified(false);
    setTimer(300);
    recaptchaRef.current?.reset();
  };

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!nickname) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    
    let captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      try {
        captchaToken = await recaptchaRef.current?.executeAsync();
      } catch (e) {
        setError("캡차 인증 중 오류가 발생했습니다.");
        return;
      }
    }

    if (!captchaToken) {
      setError("로봇이 아닙니다 인증을 완료해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await findIdSendEmailApi(nickname, captchaToken);
      setSuccessMsg(res.message);
      toast.success(res.message);
    } catch (e: any) {
      setError(e.response?.data?.message || "메일 발송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      recaptchaRef.current?.reset();
    }
  };

  const handleSendPwCode = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    let captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      try {
        captchaToken = await recaptchaRef.current?.executeAsync();
      } catch (e) {
        setError("캡차 인증 중 오류가 발생했습니다.");
        return;
      }
    }

    if (!captchaToken) {
      setError("로봇이 아닙니다 인증을 완료해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await sendAuthCodeApi(email, captchaToken, "find-password");
      setIsCodeSent(true);
      setTimer(300);
      toast.success("인증번호가 발송되었습니다.");
    } catch (e: any) {
      setError(e.response?.data?.message || "인증번호 발송에 실패했습니다.");
    } finally {
      setIsLoading(false);
      recaptchaRef.current?.reset();
    }
  };

  const handleVerifyCode = async () => {
    if (!authCode) {
      setError("인증번호를 입력해주세요.");
      return;
    }

    try {
      await verifyAuthCodeApi(email, authCode);
      setIsEmailVerified(true);
      setError(null);
      toast.success("인증이 완료되었습니다. 새 비밀번호를 입력해주세요.");
    } catch (e: any) {
      setError(e.response?.data?.message || "인증번호가 일치하지 않습니다.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/\-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordApi(email, authCode, newPassword);
      toast.success("비밀번호가 성공적으로 변경되었습니다.");
      router.push("/login");
    } catch (e: any) {
      setError(e.response?.data?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={() => router.push('/login')}
          className="flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} className="mr-1" />
          로그인으로 돌아가기
        </button>

        <div className="bg-[#111] border border-border rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
              <Music2 className="text-primary" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">로그인에 어려움이 있으신가요?</h1>
            <p className="text-sm text-slate-400 text-center">
              가입하신 계정 정보(이메일, 비밀번호)를 찾을 수 있도록 도와드릴게요.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-secondary p-1 rounded-xl mb-6">
            <button
              onClick={() => handleTabChange("id")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === "id" ? "bg-primary text-primary-foreground shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              이메일 찾기
            </button>
            <button
              onClick={() => handleTabChange("password")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === "password" ? "bg-primary text-primary-foreground shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              비밀번호 찾기
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "id" && (
              <motion.form 
                key="id-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleFindId}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 pl-1">가입 시 입력한 닉네임</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="닉네임 입력" 
                      className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  {/* @ts-ignore */}
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    size="invisible"
                    badge="bottomleft"
                    sitekey="6LcAiQgtAAAAAAUyTXZ7us-Cb2_MMwlpBZDq4RCa"
                    theme="dark"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm whitespace-pre-wrap text-center">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm whitespace-pre-wrap text-center">
                    {successMsg}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold mt-6 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? "처리 중..." : "안내 메일 발송하기"}
                </button>
              </motion.form>
            )}

            {activeTab === "password" && (
              <motion.form 
                key="pw-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                {!isEmailVerified ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 pl-1">가입한 이메일</label>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                              type="email" 
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setIsCodeSent(false);
                              }}
                              placeholder="musician@example.com" 
                              className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600 disabled:opacity-50"
                              required
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={handleSendPwCode}
                            disabled={isLoading || !email}
                            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 rounded-xl disabled:opacity-50 whitespace-nowrap"
                          >
                            {isLoading ? "발송 중" : "인증 발송"}
                          </button>
                        </div>
                        
                        <div>
                          {/* @ts-ignore */}
                          <ReCAPTCHA
                            ref={recaptchaRef}
                            size="invisible"
                            badge="bottomleft"
                            sitekey="6LcAiQgtAAAAAAUyTXZ7us-Cb2_MMwlpBZDq4RCa"
                            theme="dark"
                          />
                        </div>
                      </div>
                    </div>

                    {isCodeSent && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5"
                      >
                        <label className="text-xs font-bold text-slate-400 pl-1">인증번호</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              type="text" 
                              value={authCode}
                              onChange={(e) => setAuthCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                              placeholder="6자리 숫자 입력" 
                              className="w-full bg-secondary border border-border rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                              required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-primary">
                              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={authCode.length !== 6}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 rounded-xl disabled:opacity-50 whitespace-nowrap"
                          >
                            확인
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-4 text-green-400 text-sm text-center">
                      이메일 인증이 완료되었습니다. 새 비밀번호를 설정해주세요.
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 pl-1">새 비밀번호</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="영문, 숫자, 특수문자 포함 8자 이상" 
                          className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                          required
                          minLength={8}
                        />
                      </div>
                      {newPassword.length > 0 && !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/\-]).{8,}$/.test(newPassword) && (
                        <p className="text-[10px] text-red-400 pl-1 pt-1">
                          비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 모두 포함해야 합니다.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 pl-1">새 비밀번호 확인</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="새 비밀번호 다시 입력" 
                          className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                          required
                        />
                      </div>
                      {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                        <p className="text-[10px] text-red-400 pl-1 pt-1">
                          비밀번호가 일치하지 않습니다.
                        </p>
                      )}
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold mt-6 transition-transform active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? "변경 중..." : "비밀번호 변경 완료"}
                    </button>
                  </motion.div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm whitespace-pre-wrap text-center">
                    {error}
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        
        <div className="mt-6 text-[10px] text-slate-500 text-center leading-relaxed px-4">
          본 사이트는 reCAPTCHA에 의해 보호되며 Google <br/>
          <a href="https://policies.google.com/privacy" className="underline hover:text-slate-300" target="_blank" rel="noreferrer">개인정보처리방침</a> 및 <a href="https://policies.google.com/terms" className="underline hover:text-slate-300" target="_blank" rel="noreferrer">이용약관</a>이 적용됩니다.
        </div>
      </motion.div>
    </div>
  );
}
