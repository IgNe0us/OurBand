export const dynamic = "force-dynamic";

// @ts-nocheck
import React from "react";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch("http://localhost:8082/api/v1/settings/public", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch settings");
    const settings = await res.json();
    
    const title = settings.seo_title || "OurBand";
    const description = settings.seo_description || "Band Music Community";
    const ogImage = settings.seo_og_image || "";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: ogImage ? [{ url: ogImage }] : [],
      },
    };
  } catch (error) {
    return {
      title: "OurBand",
      description: "Band Music Community",
    };
  }
}

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