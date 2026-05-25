"use client";

// @ts-nocheck

import React, { useState } from "react";
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle2, XCircle, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";;

export default function ChatIdDynamicPage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); // "apply" or "offer"
  const targetId = searchParams.get("targetId"); 

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: "msg-0", sender: "other", text: type === "apply" ? "안녕하세요! 밴드 구인 글 보고 연락드립니다. 지원하고 싶습니다!" : "안녕하세요! 프로필 보고 연락드렸습니다. 저희 밴드에 영입하고 싶은데 통화 가능하실까요?", time: "오후 2:30" }
  ]);
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">("pending");

  const otherName = type === "apply" ? "지원자 (루비스파크)" : "네온사인 밴드 마스터";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages([...messages, { id: String(Date.now() + Math.random()), sender: "me", text: message, time: "오후 2:32" }]);
    setMessage("");
  };

  const handleAccept = () => {
    setStatus("accepted");
    setMessages([...messages, { id: String(Date.now() + Math.random()), sender: "system", text: "요청이 수락되었습니다. 이제 공식 멤버입니다!", time: "" }]);
  };

  const handleReject = () => {
    setStatus("rejected");
    setMessages([...messages, { id: String(Date.now() + Math.random()), sender: "system", text: "요청이 거절되었습니다.", time: "" }]);
  };

  return (
    <div className="flex flex-col h-screen bg-background relative max-w-2xl mx-auto border-x border-border">
      {/* Header */}
      <header className="px-4 py-4 bg-secondary border-b border-border flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center overflow-hidden">
              <User className="text-slate-500" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">{otherName}</h2>
              <p className="text-xs text-primary">{type === "apply" ? "밴드 지원자" : "밴드 마스터"}</p>
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white">
          <Info size={24} />
        </button>
      </header>

      {/* Action Banner (Accept/Reject) */}
      {status === "pending" && (
        <div className="bg-primary/10 border-b border-primary/20 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-sm mb-1">
                {type === "apply" ? "새로운 밴드 합류 요청이 왔습니다." : "새로운 밴드 영입 제안이 왔습니다."}
              </h3>
              <p className="text-xs text-slate-400">프로필을 확인하고 수락 또는 거절을 선택해주세요.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleReject}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-secondary border border-border text-slate-300 rounded-xl hover:text-rose-400 hover:border-rose-400/50 transition-colors text-sm font-bold flex-1"
              >
                <XCircle size={16} /> 거절
              </button>
              <button 
                onClick={handleAccept}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl hover:bg-indigo-600 transition-colors text-sm font-bold flex-1 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
              >
                <CheckCircle2 size={16} /> 수락
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          msg.sender === "system" ? (
            <div key={msg.id + (msg.sender === "system" ? "-sys" : "-msg")} className="flex justify-center my-6">
              <div className="bg-secondary/50 border border-border px-4 py-2 rounded-full text-xs font-medium text-slate-400">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={msg.id + (msg.sender === "system" ? "-sys" : "-msg")} className={cn("flex flex-col w-full", msg.sender === "me" ? "items-end" : "items-start")}>
              <div className="flex items-end gap-2 max-w-[80%]">
                {msg.sender === "me" && <span className="text-[10px] text-slate-500 mb-1">{msg.time}</span>}
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm",
                  msg.sender === "me" 
                    ? "bg-primary text-white rounded-br-sm" 
                    : "bg-secondary border border-border text-slate-200 rounded-bl-sm"
                )}>
                  {msg.text}
                </div>
                {msg.sender === "other" && <span className="text-[10px] text-slate-500 mb-1">{msg.time}</span>}
              </div>
            </div>
          )
        ))}
      </main>

      {/* Chat Input */}
      <footer className="p-4 bg-background border-t border-border sticky bottom-0 z-20">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..." 
            className="flex-1 bg-secondary border border-border rounded-full px-5 py-3.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button 
            type="submit"
            disabled={!message.trim() || status !== "pending"}
            className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send size={18} className="translate-x-0.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
