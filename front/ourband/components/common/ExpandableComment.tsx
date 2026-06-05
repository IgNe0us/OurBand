import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ExpandableCommentProps {
  content: string;
  className?: string;
  lines?: number;
}

export function ExpandableComment({ content, className, lines = 4 }: ExpandableCommentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
      }
    };
    checkOverflow();
    // 윈도우 리사이즈 시 다시 체크
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [content]);

  return (
    <div className="w-full">
      <p
        ref={textRef}
        className={cn(
          "break-all whitespace-pre-wrap",
          !isExpanded ? (lines === 4 ? "line-clamp-4" : `line-clamp-${lines}`) : "",
          className
        )}
      >
        {content}
      </p>
      {isOverflowing && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-[11px] font-bold text-slate-400 hover:text-white mt-1 transition-colors"
        >
          자세히 보기...
        </button>
      )}
    </div>
  );
}
