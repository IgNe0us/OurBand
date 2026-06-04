// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. 로그인 상태 확인 (예: 쿠키에 저장된 토큰 확인)
  const isAuthenticated = request.cookies.has('access_token'); 

  // 2. 현재 접속하려는 경로 확인
  const pathname = request.nextUrl.pathname;
  
  // 💡 수정된 부분: 로그인('/login') 또는 회원가입('/register'), 계정찾기('/find-account') 경로인지 확인
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/find-account');
  const isMaintenancePage = pathname.startsWith('/maintenance');

  // 3. 로그인이 안 되어 있는데, 인증 페이지나 점검 페이지가 아닌 곳에 접속하려 할 때 강제 이동
  if (!isAuthenticated && !isAuthPage && !isMaintenancePage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // (선택) 로그인이 되어 있는데 로그인/회원가입 페이지로 접속하려 할 때 메인으로 튕겨내기
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// 미들웨어가 실행될 경로 지정 (이미지, API 등 제외)
export const config = {
  matcher: [
    /*
     * 아래 경로들을 제외한 모든 경로에서 미들웨어 실행:
    * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};