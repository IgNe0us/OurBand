'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link'; // ✅ Link 추가
import { loginUserApi } from '../../api/account/userService'; // ✅ 상대 경로로 수정

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("이메일과 비밀번호를 모두 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await loginUserApi({ email: email, password: password });
            alert("로그인 성공!");
            window.location.href = '/'; 
            
        } catch (e: any) {
            console.error("Login Error:", e);
            if (e.response && e.response.data) {
                const message = e.response.data.message || "알 수 없는 오류가 발생했습니다.";
                setError(`로그인 실패: ${message}`);
            } else {
                setError("네트워크 오류가 발생했습니다. API 서버가 실행 중인지 확인해주세요.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [email, password]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full p-8 border rounded-xl shadow-2xl bg-white">
                <h2 className="text-3xl font-bold mb-2 text-center text-indigo-700">환영합니다!</h2>
                <p className="text-center text-gray-500 mb-8">로그인으로 서비스를 이용해주세요.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <input 
                            type="email" 
                            placeholder="example@domain.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            disabled={isLoading} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <input 
                            type="password" 
                            placeholder="비밀번호를 입력하세요" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            disabled={isLoading} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full py-4 text-lg font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isLoading ? '인증 중...' : '로그인하기'}
                    </button>
                </form>
                
                <div className="mt-8 text-center border-t pt-6">
                    <p className="text-sm text-gray-600">계정이 없으신가요?</p>
                    <Link href="/register" className="text-indigo-600 hover:text-indigo-800 ml-2 font-medium">
                        ➡️ 회원가입 페이지 바로가기
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;