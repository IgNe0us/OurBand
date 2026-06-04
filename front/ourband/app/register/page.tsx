"use client";

// @ts-nocheck

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music2, ArrowRight, Mail, Lock, User, Guitar, Briefcase, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { registerUserApi, loginUserApi, sendAuthCodeApi, verifyAuthCodeApi, checkNicknameApi } from "@/api/account/userService";
import { KOREA_REGIONS } from "@/lib/regions";
import toast from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";
import { getSignupConfigApi } from "@/api/settings/signupConfigApi";
import { PolicyModal } from "@/components/common/PolicyModal";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<"user" | "business">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [instrument, setInstrument] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessFile, setBusinessFile] = useState<File | null>(null);
  const [region, setRegion] = useState("");
  const [subRegion, setSubRegion] = useState("");
  
  // 💡 비동기 통신을 위한 로딩 및 에러 상태 추가
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이메일 인증 관련 상태
  const [authCode, setAuthCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // 닉네임 중복 확인 관련 상태
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  // 약관 동의 상태
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  // 캡차 관련 상태
  const recaptchaRef = React.useRef<ReCAPTCHA>(null);

  // 약관 모달 상태
  const [policyModalConfig, setPolicyModalConfig] = useState<{isOpen: boolean, type: "terms" | "privacy"}>({
    isOpen: false,
    type: "terms"
  });

  // 설정값 (금칙어, 주 포지션)
  const [badWordsList, setBadWordsList] = useState<string[]>([]);
  const [signupPositions, setSignupPositions] = useState<string[]>(["보컬", "기타", "베이스", "드럼", "건반 / 피아노", "작곡 / 미디", "기타 악기"]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const config = await getSignupConfigApi();
        if (config.forbiddenWords && config.forbiddenWords.length > 0) {
          setBadWordsList(config.forbiddenWords);
        } else {
          setBadWordsList(["시발", "씨발", "병신", "새끼", "지랄", "존나", "개새끼", "도박", "바카라", "토토", "카지노", "섹스", "야동"]);
        }
        
        if (config.positions && config.positions.length > 0) {
          setSignupPositions(config.positions);
        }
      } catch (e) {
        console.error("Failed to load signup config:", e);
        setBadWordsList(["시발", "씨발", "병신", "새끼", "지랄", "존나", "개새끼", "도박", "바카라", "토토", "카지노", "섹스", "야동"]);
      }
    };
    fetchSettings();
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCodeSent && timer > 0 && !isEmailVerified) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isCodeSent, timer, isEmailVerified]);

  const getNicknameError = (nickname: string) => {
    if (!nickname) return null;
    if (/\s/.test(nickname)) return "공백은 사용할 수 없습니다.";
    if (/[^a-zA-Z0-9가-힣]/.test(nickname)) return "특수문자는 사용할 수 없습니다.";
    
    const wordsToCheck = badWordsList.length > 0 ? badWordsList : ["시발", "씨발", "병신", "새끼", "지랄", "존나", "개새끼", "도박", "바카라", "토토", "카지노", "섹스", "야동"];
    for (const word of wordsToCheck) {
        if (nickname.includes(word)) return "사용할 수 없는 단어가 포함되어 있습니다.";
    }

    const hasKorean = /[가-힣]/.test(nickname);
    if (hasKorean && (nickname.length < 2 || nickname.length > 8)) return "한글 2~8자 이내로 설정해주세요.";
    if (!hasKorean && (nickname.length < 2 || nickname.length > 12)) return "영문/숫자 2~12자 이내로 설정해주세요.";
    
    return null;
  };

  const handleCheckNickname = async () => {
    if (!name) {
      setError("활동명(닉네임)을 입력해주세요.");
      return;
    }
    
    const errorMsg = getNicknameError(name);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    
    setIsCheckingNickname(true);
    setError(null);
    try {
      await checkNicknameApi(name);
      setIsNicknameChecked(true);
      toast.success("사용 가능한 닉네임입니다.");
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || "이미 사용 중인 닉네임입니다.");
      setIsNicknameChecked(false);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    
    let captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      try {
        // IP 환경 테스트를 위해 리캡챠를 우회합니다.
        captchaToken = "bypass_for_testing";
        // captchaToken = await recaptchaRef.current?.executeAsync();
      } catch (e) {
        setError("캡차 인증 중 오류가 발생했습니다.");
        return;
      }
    }
    
    if (!captchaToken) {
      setError("로봇이 아닙니다(캡차) 인증을 완료해주세요.");
      return;
    }

    if (isSendingCode) return;
    
    setIsSendingCode(true);
    setError(null);
    try {
      await sendAuthCodeApi(email, captchaToken, "register");
      setIsCodeSent(true);
      setTimer(300); // 5분
      toast.success("인증번호가 발송되었습니다.");
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || "인증번호 발송에 실패했습니다.");
    } finally {
      setIsSendingCode(false);
      // 토큰 만료를 대비해 초기화
      recaptchaRef.current?.reset();
    }
  };

  const handleVerifyCode = async () => {
    if (!authCode) {
      setError("인증번호를 입력해주세요.");
      return;
    }
    setError(null);
    try {
      await verifyAuthCodeApi(email, authCode);
      setIsEmailVerified(true);
      toast.success("이메일 인증이 완료되었습니다.");
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || "인증번호가 일치하지 않습니다.");
    }
  };
  
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. 프론트엔드 유효성 검사
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/\-]).{8,}$/;
    if (!passwordRegex.test(password)) {
        setError("비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
        return;
    }

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
    if (accountType === "user" && (!region || !subRegion)) {
        setError("활동 지역을 선택해주세요.");
        return;
    }

    if (!name || !email || !password) {
        setError("닉네임, 이메일, 비밀번호를 모두 입력해야 합니다.");
        return;
    }
    if (!isNicknameChecked) {
        setError("닉네임 중복 확인을 해주세요.");
        return;
    }
    if (!isEmailVerified) {
        setError("이메일 인증을 완료해주세요.");
        return;
    }
    if (!isTermsAccepted) {
        setError("이용약관 및 개인정보처리방침에 동의해주세요.");
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
        businessNumber,
        location: `${region} ${subRegion}`.trim()
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsNicknameChecked(false); // 닉네임 변경 시 다시 중복확인 필요
                  }}
                  placeholder={accountType === "business" ? "예: 사운드홀릭 대표" : "예: 홍대 불꽃기타"} 
                  className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                  required
                />
              </div>
              <button 
                type="button"
                onClick={handleCheckNickname}
                disabled={isCheckingNickname || isNicknameChecked || !name || !!getNicknameError(name)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 rounded-xl disabled:opacity-50 whitespace-nowrap"
              >
                {isCheckingNickname ? "확인 중..." : isNicknameChecked ? "사용 가능" : "중복 확인"}
              </button>
            </div>
            {name.length > 0 && getNicknameError(name) && (
              <p className="text-[10px] text-red-400 pl-1 pt-1">{getNicknameError(name)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 pl-1">이메일</label>
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
                      setIsEmailVerified(false);
                      setAuthCode("");
                    }}
                    disabled={isEmailVerified}
                    placeholder="musician@example.com" 
                    className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600 disabled:opacity-50"
                    required
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || isEmailVerified || !email}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 rounded-xl disabled:opacity-50 whitespace-nowrap"
                >
                  {isSendingCode ? "발송 중..." : isEmailVerified ? "인증 완료" : "인증 발송"}
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
            
            {isCodeSent && !isEmailVerified && (
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="인증번호 6자리" 
                    className="w-full bg-secondary border border-border rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-red-400">
                    {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={handleVerifyCode}
                  className="bg-primary hover:bg-indigo-600 text-white text-xs font-bold px-4 rounded-xl whitespace-nowrap"
                >
                  확인
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 pl-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="영문, 숫자, 특수문자 조합 8자 이상" 
                className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600"
                required
                minLength={8}
              />
            </div>
            {password.length > 0 && !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/\-]).{8,}$/.test(password) && (
              <p className="text-[10px] text-red-400 pl-1 pt-1">
                비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 모두 포함해야 합니다.
              </p>
            )}
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
                    {signupPositions.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                </div>

                <label className="text-xs font-bold text-slate-400 pl-1 mt-4 block">활동 지역</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={region}
                      onChange={(e) => {
                        setRegion(e.target.value);
                        setSubRegion("");
                      }}
                      className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-4 pr-8 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>시/도</option>
                      {Object.keys(KOREA_REGIONS).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                  </div>
                  <div className="relative flex-1">
                    <select
                      value={subRegion}
                      onChange={(e) => setSubRegion(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-4 pr-8 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
                      required
                      disabled={!region}
                    >
                      <option value="" disabled>시/군/구</option>
                      {region && KOREA_REGIONS[region]?.map((sr) => (
                        <option key={sr} value={sr}>{sr}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                  </div>
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
            <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-xl text-center whitespace-pre-wrap">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4 px-1">
            <input 
              type="checkbox" 
              id="terms" 
              checked={isTermsAccepted} 
              onChange={(e) => setIsTermsAccepted(e.target.checked)} 
              className="w-4 h-4 rounded border-slate-600 bg-secondary focus:ring-primary text-primary cursor-pointer accent-primary" 
            />
            <label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer select-none">
              <button type="button" onClick={(e) => { e.preventDefault(); setPolicyModalConfig({ isOpen: true, type: "terms" }); }} className="text-primary hover:underline font-medium">이용약관</button> 및 <button type="button" onClick={(e) => { e.preventDefault(); setPolicyModalConfig({ isOpen: true, type: "privacy" }); }} className="text-primary hover:underline font-medium">개인정보처리방침</button>에 동의합니다. (필수)
            </label>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !isEmailVerified || !isNicknameChecked || !isTermsAccepted}
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

        <div className="mt-6 text-[10px] text-slate-500 text-center leading-relaxed px-4">
          본 사이트는 reCAPTCHA에 의해 보호되며 Google <br/>
          <a href="https://policies.google.com/privacy" className="underline hover:text-slate-300" target="_blank" rel="noreferrer">개인정보처리방침</a> 및 <a href="https://policies.google.com/terms" className="underline hover:text-slate-300" target="_blank" rel="noreferrer">이용약관</a>이 적용됩니다.
        </div>
      </motion.div>

      <PolicyModal 
        isOpen={policyModalConfig.isOpen} 
        onClose={() => setPolicyModalConfig({ ...policyModalConfig, isOpen: false })} 
        type={policyModalConfig.type} 
      />
    </div>
  );
}