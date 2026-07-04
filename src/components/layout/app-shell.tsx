"use client";

import Navbar from "@/components/Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <Navbar />
      {children}
    </div>
  );
}
