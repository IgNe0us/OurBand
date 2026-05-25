// src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-indigo-700">🎵 OurBand - 밴드 매칭 플랫폼</h1>
                <p className="text-xl text-gray-600 mt-2">당신의 음악적 연결고리가 되어 드립니다.</p>
            </header>

            <div className="flex gap-6 max-w-lg w-full">
                {/* 1. 로그인 버튼 */}
                <Link href="/login" className="w-full" passHref>
                    {/* 대문자 <Button>을 소문자 <button>으로 변경하고 둥근 테두리(rounded-lg) 추가! */}
                    <button className="w-full text-lg py-4 font-semibold rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition shadow-sm">
                        ▶️ 로그인 하기
                    </button>
                </Link>
                
                {/* 2. 회원가입 버튼 */}
                <Link href="/register" className="w-full" passHref>
                    <button className="w-full text-lg py-4 font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition shadow-sm">
                        ➕ 무료 회원가입
                    </button>
                </Link>
            </div>

            <div className="mt-20 p-6 bg-white shadow-xl rounded-xl text-center max-w-lg w-full">
                <h3 className="text-2xl font-semibold mb-3">💡 첫 이용 가이드</h3>
                <p className="text-gray-600 mb-4">가장 먼저 로그인 또는 회원가입을 통해 플랫폼을 경험해 보세요.</p>
                <p className="text-sm text-gray-400">로그인 후, 밴드 검색 및 프로필 관리를 시작할 수 있습니다.</p>
            </div>
        </div>
    );
}