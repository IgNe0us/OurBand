"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, FileText, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { getPublicSettingsApi } from "@/api/settings/settingsService";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

export function PolicyModal({ isOpen, onClose, type }: PolicyModalProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    setLoading(true);

    const fetchPolicy = async () => {
      try {
        const settings = await getPublicSettingsApi();
        if (!isMounted) return;
        
        if (type === "terms") {
          setContent(settings.terms_of_service || "이용약관이 등록되지 않았습니다.");
        } else {
          setContent(settings.privacy_policy || "개인정보처리방침이 등록되지 않았습니다.");
        }
      } catch (error) {
        console.error("Failed to load policy:", error);
        if (isMounted) {
          setContent("내용을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPolicy();

    return () => {
      isMounted = false;
    };
  }, [isOpen, type]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-full flex flex-col bg-[#11131a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                {type === "terms" ? (
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <FileText size={20} />
                  </div>
                ) : (
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <ShieldCheck size={20} />
                  </div>
                )}
                <h2 className="text-xl font-bold text-white">
                  {type === "terms" ? "이용약관" : "개인정보처리방침"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p>내용을 불러오는 중입니다...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-indigo max-w-none prose-sm sm:prose-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-primary hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
