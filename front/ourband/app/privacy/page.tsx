"use client";

import React, { useEffect, useState } from "react";
import { getPublicSettingsApi } from "@/api/settings/settingsService";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Loader2, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const settings = await getPublicSettingsApi();
        setContent(settings.privacy_policy || "개인정보처리방침이 등록되지 않았습니다.");
      } catch (error) {
        console.error("Failed to load privacy policy:", error);
        setContent("개인정보처리방침을 불러오는데 실패했습니다. 나중에 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };
    fetchPrivacy();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-secondary border border-border rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">개인정보처리방침</h1>
          <p className="text-slate-400 text-sm font-medium">안전한 서비스 이용을 위한 OurBand의 약속입니다.</p>
        </div>

        <div className="bg-secondary/40 border border-border rounded-2xl p-8 md:p-12 min-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p>방침을 불러오는 중입니다...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-indigo max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
