"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bus,
  CircleHelp,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  MapPin,
  Menu,
  Navigation,
  Newspaper,
  Package,
  Quote,
  Settings,
  Sparkles,
  Table,
  Users,
  X,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon; adminOnly?: boolean };
type Group = { heading: string; items: Item[] };

/**
 * Grouped by how often an editor needs them, not alphabetically: the inbox and
 * the pages they edit weekly come first; settings and users, touched once,
 * sit at the bottom.
 */
const GROUPS: Group[] = [
  {
    heading: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/enquiries", label: "Enquiries", icon: Inbox },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/pages", label: "Pages & sections", icon: FileText },
      { href: "/fleet", label: "Fleet", icon: Bus },
      { href: "/services", label: "Services", icon: Sparkles },
      { href: "/destinations", label: "Destinations", icon: MapPin },
      { href: "/packages", label: "Packages", icon: Package },
      { href: "/articles", label: "Travel guides", icon: Newspaper },
      { href: "/faqs", label: "FAQs", icon: CircleHelp },
      { href: "/gallery", label: "Gallery", icon: Images },
      { href: "/testimonials", label: "Testimonials", icon: Quote },
      { href: "/tariffs", label: "Tariffs", icon: Table },
    ],
  },
  {
    heading: "Site",
    items: [
      { href: "/navigation", label: "Navigation", icon: Navigation, adminOnly: true },
      { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
      { href: "/redirects", label: "Redirects", icon: Link2, adminOnly: true },
      { href: "/seo", label: "SEO", icon: BarChart3, adminOnly: true },
      { href: "/users", label: "Users", icon: Users, adminOnly: true },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav aria-label="Dashboard sections" className="grid gap-5">
      {GROUPS.map((group) => {
        const items = group.items.filter((item) => !item.adminOnly || isAdmin);
        if (items.length === 0) return null;
        return (
          <div key={group.heading}>
            <p className="rail-group">{group.heading}</p>
            <ul className="grid gap-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="rail-link"
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile trigger, pinned to the header row. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="side-nav"
        className="btn btn-ghost lg:hidden"
      >
        {open ? <Menu size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      {/* Desktop rail */}
      <div className="bg-rail hidden w-60 shrink-0 flex-col lg:flex">
        <div className="border-rail-line flex h-14 items-center border-b px-4">
          <Link href="/" className="text-rail-text flex items-center gap-2 font-semibold">
            <span className="bg-brand inline-flex h-6 w-6 items-center justify-center rounded text-[0.625rem] font-bold text-white">
              RPM
            </span>
            Dashboard
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{links}</div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div
            id="side-nav"
            className="bg-rail absolute inset-y-0 left-0 flex w-64 flex-col overflow-y-auto"
          >
            <div className="border-rail-line flex h-14 items-center justify-between border-b px-4">
              <span className="text-rail-text font-semibold">Dashboard</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-rail-muted hover:text-rail-text p-1"
              >
                <X size={18} aria-hidden="true" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <div className="p-3">{links}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
