// @ts-nocheck
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function translateInstrument(instrument: string | undefined | null): string {
  if (!instrument) return "포지션 미설정";
  
  const lower = instrument.toLowerCase();
  switch (lower) {
    case "vocal": return "보컬";
    case "guitar": return "기타";
    case "bass": return "베이스";
    case "drum": return "드럼";
    case "keyboard": return "건반 / 피아노";
    case "midi": return "작곡 / 미디";
    case "other": return "기타 악기";
    default: return instrument;
  }
}
