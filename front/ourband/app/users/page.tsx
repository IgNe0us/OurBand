"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Users, User as UserIcon } from "lucide-react";
import { searchUsersApi, type UserSearchResult } from "@/api/account/userService";
import { UserCard } from "@/components/user/UserCard";
import toast from "react-hot-toast";
import { cn, translateInstrument } from "@/lib/utils";

export default function UsersPage() {
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // 자동완성 관련 상태
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLFormElement>(null);
  const skipNextEffect = useRef(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 닉네임 입력 시 자동완성 (디바운싱 적용)
  useEffect(() => {
    if (skipNextEffect.current) {
      skipNextEffect.current = false;
      return;
    }

    if (keyword.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // 이미 검색된 결과 화면일 때는 추천 창을 띄우지 않을 수도 있지만, 구글처럼 띄웁니다.
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchUsersApi(keyword);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Auto-complete failed:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [keyword]);

  const handleSearch = async (searchKeyword: string = keyword) => {
    if (searchKeyword.trim() === "") {
      toast.error("검색어를 입력해주세요.");
      return;
    }
    
    setShowSuggestions(false); // 검색 시 드롭다운 닫기
    setLoading(true);
    setSearched(true);
    
    try {
      const results = await searchUsersApi(searchKeyword);
      setUsers(results);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("뮤지션 검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const onSuggestionClick = (user: UserSearchResult) => {
    skipNextEffect.current = true;
    setKeyword(user.nickname);
    setShowSuggestions(false);
    handleSearch(user.nickname);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12 pt-4 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3 tracking-tight">
            <Users className="text-primary" size={36} />
            뮤지션 찾기
          </h1>
          <p className="text-slate-400 mt-2">새로운 음악 동료를 찾아보고 팔로우 해보세요.</p>
        </div>
      </div>

      <div className="bg-secondary/30 border border-border rounded-2xl p-6 md:p-8 relative backdrop-blur-sm">
        {/* 글로우 효과 배경 (넘치는 부분 숨김) */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />
        </div>
        
        <form onSubmit={onSubmit} className="relative z-50 max-w-2xl mx-auto" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="뮤지션 닉네임으로 검색해보세요" 
              className="w-full bg-slate-800/80 border border-border text-white px-12 py-4 rounded-full focus:outline-none focus:border-primary/50 transition-colors shadow-lg text-lg"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            <button 
              type="submit"
              className="absolute right-2 bg-primary hover:bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold transition-colors shadow-lg"
              disabled={loading}
            >
              {loading ? "검색 중..." : "검색"}
            </button>
          </div>

          {/* 자동완성 드롭다운 */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full bg-slate-800 border border-border mt-2 rounded-2xl shadow-2xl max-h-72 overflow-y-auto hide-scrollbar overflow-hidden">
              {suggestions.map((user) => (
                <li 
                  key={user.userId} 
                  className="px-4 py-3 hover:bg-slate-700/50 cursor-pointer flex items-center justify-between border-b border-border/50 last:border-0 transition-colors"
                  onClick={() => onSuggestionClick(user)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {user.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} className="w-full h-full object-cover" alt={user.nickname} />
                      ) : (
                        <UserIcon size={20} className="text-slate-500" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold">{user.nickname}</span>
                      {user.instrument && <span className="text-xs text-primary">{translateInstrument(user.instrument)}</span>}
                    </div>
                  </div>
                  <Search size={14} className="text-slate-500 mr-2" />
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>

      <div className="space-y-4">
        {searched && (
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              검색 결과 <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md text-sm">{users.length}</span>
            </h2>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-secondary/20 border border-border rounded-2xl p-5 h-[200px] animate-pulse flex flex-col justify-between">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 bg-slate-800/50 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-800/50 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-800/50 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : !searched ? (
          <div className="text-center py-24 bg-secondary/20 border border-border/50 rounded-3xl">
            <Search className="mx-auto h-16 w-16 text-slate-500 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">뮤지션을 검색해 보세요</h3>
            <p className="text-slate-400">닉네임을 입력하여 새로운 동료를 찾을 수 있습니다.</p>
          </div>
        ) : users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {users.map((user) => (
              <UserCard key={user.userId} user={user} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/20 border border-border/50 rounded-3xl">
            <Users className="mx-auto h-16 w-16 text-slate-500 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">
              "{keyword}"에 대한 검색 결과가 없습니다.
            </h3>
            <p className="text-slate-400">다른 키워드로 검색해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
