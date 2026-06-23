"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  PlusCircle,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/inventory", label: "Inventory", icon: Package, exact: false },
  { href: "/inventory/new", label: "Add Item", icon: PlusCircle, exact: true },
  { href: "/categories", label: "Categories", icon: FolderTree, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();

  // Pick the single most-specific matching nav item so sub-routes (e.g.
  // /inventory/new) don't also light up their parent (/inventory).
  const activeHref = nav
    .filter((item) =>
      item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(item.href + "/"),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Boxes className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">StockAI</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map((item) => {
          const active = activeHref === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        AI-Powered Inventory
      </div>
    </aside>
  );
}
