export const dynamic = "force-dynamic";

// @ts-nocheck
import React from "react";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata = {
  title: "Band App",
  description: "Band Music Community",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}