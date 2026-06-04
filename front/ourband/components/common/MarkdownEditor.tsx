"use client";

import React from "react";
import dynamic from "next/dynamic";
import remarkBreaks from "remark-breaks";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// next/dynamic을 사용하여 서버 사이드 렌더링(SSR) 방지
// SSR 환경에서 window 객체를 참조하여 발생하는 에러를 막기 위함
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export function MarkdownEditor({ value, onChange, placeholder, height = 400 }: MarkdownEditorProps) {
  return (
    <div data-color-mode="dark" className="w-full">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={height}
        preview="live"
        previewOptions={{
          remarkPlugins: [remarkBreaks],
        }}
        textareaProps={{
          placeholder: placeholder || "마크다운 문법으로 작성해주세요.",
        }}
        visibleDragbar={false}
        className="overflow-hidden border border-border rounded-xl !bg-background"
      />
    </div>
  );
}
