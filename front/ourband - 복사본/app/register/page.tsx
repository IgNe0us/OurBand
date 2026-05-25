'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link'; // ✅ Link 추가
import { registerUserApi } from '../../api/account/userService'; // ✅ 상대 경로로 수정

interface SignUpPageProps {}

const SignUpPage: React.FC<SignUpPageProps> = () => {
    const [nickname, setNickname] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname || !email || !password) {
            setError("닉네임, 이메일, 비밀번호를 모두 입력해야 합니다.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await registerUserApi({ nickname, email, password });
            alert("회원가입 성공! 이제 로그인 페이지로 이동하여 로그인을 시도해주세요.");
            window.location.href = '/login'; 
            
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
    }, [nickname, email, password]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full p-8 border rounded-xl shadow-2xl bg-white">
                <h2 className="text-3xl font-bold mb-2 text-center text-green-700">신규 회원가입</h2>
                <p className="text-center text-gray-500 mb-8">서비스 이용을 위한 계정을 만드세요.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                        <input 
                            type="text" 
                            placeholder="원하는 닉네임" 
                            value={nickname} 
                            onChange={(e) => setNickname(e.target.value)} 
                            disabled={isLoading} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <input 
                            type="email" 
                            placeholder="example@domain.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            disabled={isLoading} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <input 
                            type="password" 
                            placeholder="비밀번호를 설정해주세요." 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            disabled={isLoading} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    
                    {error && (
                        <p className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
                            {error}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-4 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isLoading ? '가입 중...' : '회원가입 완료'}
                    </button>
                </form>
                
                <div className="mt-8 text-center border-t pt-6">
                    <p className="text-sm text-gray-600">이미 계정이 있으신가요?</p>
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-800 ml-2 font-medium">
                        ➡️ 로그인 페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignUpPage;