"use client";

import dynamic from "next/dynamic";
import ThemeProvider from "./ThemeProvider";
import type { ReactNode } from "react";

const LenisProvider = dynamic(() => import("./LenisProvider"), { ssr: false });
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), {
  ssr: false,
});

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LenisProvider>
        <CustomCursor />
        <main className="pt-12 sm:pt-0 lg:pr-28">{children}</main>
      </LenisProvider>
    </ThemeProvider>
  );
}
