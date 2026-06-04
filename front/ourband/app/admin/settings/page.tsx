"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, AlertTriangle, Image as ImageIcon, Type, Globe, Link as LinkIcon, Plus, X, Loader2 } from "lucide-react";
import { getAllAdminSettingsApi, updateAdminSettingsApi } from "@/api/settings/settingsService";
import { getSignupConfigApi, addForbiddenWordApi, deleteForbiddenWordApi, addPositionApi, deletePositionApi } from "@/api/settings/signupConfigApi";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "signup" | "policy" | "seo">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<Record<string, string>>({});
  
  // Dynamic Arrays for Signup
  const [forbiddenWords, setForbiddenWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [signupPositions, setSignupPositions] = useState<string[]>([]);
  const [newPosition, setNewPosition] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [data, signupConfig] = await Promise.all([
        getAllAdminSettingsApi(),
        getSignupConfigApi()
      ]);
      
      const settingsMap: Record<string, string> = {};
      data.forEach(item => {
        settingsMap[item.settingKey] = item.settingValue || "";
      });
      setSettings(settingsMap);

      setForbiddenWords(signupConfig.forbiddenWords);
      setSignupPositions(signupConfig.positions);
    } catch (e) {
      toast.error("설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = { ...settings };
      // forbidden_words and signup_positions are no longer part of site_settings

      await updateAdminSettingsApi(updates);
      toast.success("설정이 성공적으로 저장되었습니다.");
    } catch (e) {
      toast.error("설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addWord = async () => {
    if (newWord.trim() && !forbiddenWords.includes(newWord.trim())) {
      try {
        await addForbiddenWordApi(newWord.trim());
        setForbiddenWords([...forbiddenWords, newWord.trim()]);
        setNewWord("");
        toast.success("금칙어가 추가되었습니다.");
      } catch (e) {
        toast.error("금칙어 추가에 실패했습니다.");
      }
    }
  };

  const removeWord = async (word: string) => {
    try {
      await deleteForbiddenWordApi(word);
      setForbiddenWords(forbiddenWords.filter(w => w !== word));
      toast.success("금칙어가 삭제되었습니다.");
    } catch (e) {
      toast.error("금칙어 삭제에 실패했습니다.");
    }
  };

  const addPosition = async () => {
    if (newPosition.trim() && !signupPositions.includes(newPosition.trim())) {
      try {
        await addPositionApi(newPosition.trim());
        setSignupPositions([...signupPositions, newPosition.trim()]);
        setNewPosition("");
        toast.success("포지션이 추가되었습니다.");
      } catch (e) {
        toast.error("포지션 추가에 실패했습니다.");
      }
    }
  };

  const removePosition = async (pos: string) => {
    try {
      await deletePositionApi(pos);
      setSignupPositions(signupPositions.filter(p => p !== pos));
      toast.success("포지션이 삭제되었습니다.");
    } catch (e) {
      toast.error("포지션 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="text-primary" />
          사이트 설정 관리
        </h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
          저장하기
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary/50 p-1.5 rounded-xl border border-border overflow-x-auto hide-scrollbar">
        {[
          { id: "general", label: "일반 / 운영 설정" },
          { id: "signup", label: "가입 설정 및 포지션" },
          { id: "policy", label: "약관 및 정책 관리" },
          { id: "seo", label: "SEO 및 소셜 공유" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-secondary/30 rounded-2xl border border-border p-6 md:p-8">
        
        {/* 일반 / 운영 설정 */}
        {activeTab === "general" && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="text-rose-500" size={20} />
                시스템 점검 모드 (Maintenance Mode)
              </h3>
              <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium mb-1">점검 모드 활성화</p>
                  <p className="text-slate-400 text-sm">시스템 관리자를 제외한 모든 유저의 접근을 차단하고 503 에러 페이지를 표시합니다.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.maintenance_mode === "true"}
                    onChange={(e) => handleChange("maintenance_mode", e.target.checked ? "true" : "false")}
                  />
                  <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
            </div>

            <div className="h-px bg-border w-full my-6"></div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">전체 상단 공지사항 (Global Notice)</h3>
              <p className="text-slate-400 text-sm mb-4">사이트 최상단에 띄울 긴급 공지나 이벤트 배너 텍스트를 입력하세요. 비워두면 표시되지 않습니다.</p>
              <div className="relative">
                <Type className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={settings.global_notice || ""}
                  onChange={(e) => handleChange("global_notice", e.target.value)}
                  placeholder="예: 현재 서버 긴급 점검 예정입니다 (오후 2시 ~ 3시)"
                  className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary text-white"
                />
              </div>
            </div>

            <div className="h-px bg-border w-full my-6"></div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">메인 배너 설정</h3>
              <p className="text-slate-400 text-sm mb-4">홈 화면 상단에 표시될 메인 배너의 이미지 URL과 연결될 링크를 설정합니다.</p>
              <div className="space-y-4">
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={settings.home_banner_url || ""}
                    onChange={(e) => handleChange("home_banner_url", e.target.value)}
                    placeholder="배너 이미지 URL (예: https://example.com/banner.png)"
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary text-white"
                  />
                </div>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={settings.home_banner_link || ""}
                    onChange={(e) => handleChange("home_banner_link", e.target.value)}
                    placeholder="배너 클릭 시 이동할 링크 URL"
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 가입 설정 및 포지션 관리 */}
        {activeTab === "signup" && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">닉네임 금칙어 관리</h3>
              <p className="text-slate-400 text-sm mb-4">회원가입 시 사용할 수 없는 단어를 관리합니다. (욕설, 스팸성 단어 등)</p>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addWord()}
                  placeholder="추가할 금칙어 입력"
                  className="flex-1 bg-background border border-border rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-primary text-white"
                />
                <button onClick={addWord} className="bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 rounded-xl transition-colors flex items-center font-bold">
                  <Plus size={18} className="mr-1" /> 추가
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {forbiddenWords.map((word, idx) => (
                  <span key={idx} className="bg-background border border-border px-3 py-1.5 rounded-lg text-sm text-slate-300 flex items-center gap-2 group">
                    {word}
                    <button onClick={() => removeWord(word)} className="text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="h-px bg-border w-full my-6"></div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">주 포지션 선택 항목 관리</h3>
              <p className="text-slate-400 text-sm mb-4">회원가입 폼에 노출되는 '주 포지션' 셀렉트 박스의 선택지를 관리합니다.</p>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPosition()}
                  placeholder="예: 클라리넷, 베이스(슬랩)"
                  className="flex-1 bg-background border border-border rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-primary text-white"
                />
                <button onClick={addPosition} className="bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 rounded-xl transition-colors flex items-center font-bold">
                  <Plus size={18} className="mr-1" /> 추가
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {signupPositions.map((pos, idx) => (
                  <span key={idx} className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-sm text-indigo-300 flex items-center gap-2 group font-medium">
                    {pos}
                    <button onClick={() => removePosition(pos)} className="text-indigo-400/50 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 약관 및 정책 */}
        {activeTab === "policy" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">이용약관 (Terms of Service)</h3>
              <MarkdownEditor 
                value={settings.terms_of_service || ""}
                onChange={(val) => handleChange("terms_of_service", val)}
                placeholder="이용약관 텍스트를 마크다운으로 입력하세요."
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">개인정보처리방침 (Privacy Policy)</h3>
              <MarkdownEditor 
                value={settings.privacy_policy || ""}
                onChange={(val) => handleChange("privacy_policy", val)}
                placeholder="개인정보처리방침 텍스트를 마크다운으로 입력하세요."
              />
            </div>
          </div>
        )}

        {/* SEO 및 메타 */}
        {activeTab === "seo" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">사이트 제목 및 설명 (SEO)</h3>
              <p className="text-slate-400 text-sm mb-4">검색 엔진(Google 등)에 노출되는 제목과 설명을 설정합니다.</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <Globe className="absolute left-4 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={settings.seo_title || ""}
                    onChange={(e) => handleChange("seo_title", e.target.value)}
                    placeholder="사이트 Title (예: OurBand - 글로벌 밴드 커뮤니티)"
                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary text-white"
                  />
                </div>
                <div>
                  <textarea 
                    value={settings.seo_description || ""}
                    onChange={(e) => handleChange("seo_description", e.target.value)}
                    placeholder="사이트 Description (검색 결과에 노출되는 한 줄 설명)"
                    className="w-full h-24 bg-background border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-primary text-white resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-border w-full my-6"></div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">오픈그래프 썸네일 (OG Image)</h3>
              <p className="text-slate-400 text-sm mb-4">카카오톡이나 디스코드에 링크 공유 시 노출되는 대표 이미지 URL을 입력하세요.</p>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={settings.seo_og_image || ""}
                  onChange={(e) => handleChange("seo_og_image", e.target.value)}
                  placeholder="https://example.com/og-image.png"
                  className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary text-white"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
