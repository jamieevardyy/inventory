"use client";

import Link from "next/link";
import {
  FolderTree,
  MapPin,
  Users,
  Building2,
  Ruler,
  Info,
  Bell,
  Upload,
  Database,
} from "lucide-react";

const masters = [
  {
    href: "/masters/categories",
    title: "Categories",
    description: "Organize inventory as Category → Subcategory → Item",
    icon: FolderTree,
    emoji: "🏷️",
    hoverBorder: "hover:border-orange-500",
  },
  {
    href: "/masters/locations",
    title: "Locations",
    description: "Manage warehouses, racks, shelves, and bins",
    icon: MapPin,
    emoji: "📍",
    hoverBorder: "hover:border-purple-500",
  },
  {
    href: "/masters/users",
    title: "Users",
    description: "Staff members for audit trails and access",
    icon: Users,
    emoji: "👥",
    hoverBorder: "hover:border-green-500",
  },
  {
    href: "/masters/suppliers",
    title: "Suppliers",
    description: "Vendor directory linked to categories",
    icon: Building2,
    emoji: "🏢",
    hoverBorder: "hover:border-blue-500",
  },
  {
    href: "/masters/units",
    title: "Units of Measure",
    description: "Define pcs, kg, m, box, and other units",
    icon: Ruler,
    emoji: "📏",
    hoverBorder: "hover:border-cyan-500",
  },
  {
    href: "/masters/informations",
    title: "Informations",
    description: "Reference notes and general information log",
    icon: Info,
    emoji: "ℹ️",
    hoverBorder: "hover:border-indigo-500",
  },
  {
    href: "/masters/notifications",
    title: "Notifications",
    description: "Low-stock and reorder alert rules",
    icon: Bell,
    emoji: "🔔",
    hoverBorder: "hover:border-amber-500",
  },
  {
    href: "/masters/media-upload",
    title: "Media Upload",
    description: "Bulk upload images to inventory items",
    icon: Upload,
    emoji: "📤",
    hoverBorder: "hover:border-rose-500",
  },
];

export default function MastersPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-900 text-white mb-4 shadow-lg">
            <Database className="w-7 h-7" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Master Data
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Configure reference data used across your inventory — categories, locations, suppliers, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {masters.map((m) => (
            <Link key={m.href} href={m.href}>
              <div
                className={`bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent ${m.hoverBorder} h-full`}
              >
                <div className="text-4xl mb-4">{m.emoji}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{m.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{m.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-600" />
            Master data pattern
          </h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li>• All masters use soft-archive — hidden from dropdowns, existing records keep their reference</li>
            <li>• API routes follow the same <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{`{ ok, data }`}</code> envelope</li>
            <li>• Each master page is self-contained with search, create, edit, and archive actions</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
