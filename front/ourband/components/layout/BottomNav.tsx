"use client";
// @ts-nocheck
import Link from "next/link";

import { usePathname } from "next/navigation";
import { Home, Search, Music, MapPin, User, Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";;

const NAV_ITEMS = [
  { path: "/", label: "트렌드", icon: Home },
  { path: "/users", label: "뮤지션", icon: User },
  { path: "/match", label: "매칭", icon: Search },
  { path: "/bands", label: "밴드", icon: Users },
  { path: "/band", label: "멤버 찾기", icon: UserPlus },
  { path: "/jam", label: "잼", icon: Music },
  { path: "/studio", label: "합주실", icon: MapPin },
];

export function BottomNav() {
  const pathname = usePathname();
const location = { pathname: pathname || "/" };

  return (
    <nav className="fixed bottom-0 w-full bg-secondary/90 backdrop-blur-xl border-t border-border z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:hidden">
      <div className="flex justify-around items-center h-16 px-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path === "/band" && (location.pathname === "/band" || (location.pathname.startsWith("/band/") && !location.pathname.includes("/board"))));
          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300",
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 transition-all duration-300", 
                  isActive && "fill-primary/20 scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                )} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={cn("text-[9px] font-bold tracking-wide", isActive ? "opacity-100" : "opacity-0 -translate-y-2")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
