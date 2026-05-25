"use client";
// @ts-nocheck
import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName?: string;
}

const REPORT_REASONS = [
  "스팸홍보/도배글입니다.",
  "음란물입니다.",
  "욕설/생명경시/혐오/차별적 표현입니다.",
  "개인정보 노출 게시물입니다.",
  "명예훼손 및 저작권 침해입니다.",
  "불쾌한 표현이 있습니다.",
  "기타 (상세 내용 직접 작성)"
];

export function ReportModal({ isOpen, onClose, targetName = "게시글" }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [detail, setDetail] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReason) {
      alert("신고 사유를 선택해주세요.");
      return;
    }
    alert("신고가 정상적으로 접수되었습니다. 관리자 검토 후 신속하게 조치됩니다.");
    setSelectedReason("");
    setDetail("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-secondary border border-border w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-border bg-background/50 shrink-0">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <AlertCircle size={22} className="text-rose-500" />
                {targetName} 신고하기
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6 overflow-y-auto hide-scrollbar">
              <div>
                <p className="text-sm font-bold text-slate-300 mb-4 px-1">이 {targetName}을(를) 신고하는 이유를 선택해주세요.</p>
                <div className="space-y-2.5">
                  {REPORT_REASONS.map((reason) => (
                    <label key={reason} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background cursor-pointer hover:border-rose-500/50 transition-colors">
                      <input 
                        type="radio" 
                        name="reportReason" 
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-4 h-4 accent-rose-500"
                      />
                      <span className="text-sm font-medium text-slate-200">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReason.includes("기타") && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }} 
                   animate={{ opacity: 1, height: "auto" }}
                 >
                   <textarea 
                     rows={4} 
                     value={detail}
                     onChange={(e) => setDetail(e.target.value)}
                     placeholder="상세 신고 사유를 구체적으로 작성해주세요 (최대 200자)" 
                     className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 resize-none"
                     required
                   />
                 </motion.div>
              )}
              
              <div className="pt-2 flex gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 py-4 rounded-xl font-bold bg-background border border-border text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 rounded-xl font-black bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-colors"
                >
                  신고 접수
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
