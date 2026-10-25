"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavNode } from "@/lib/content";

type Props = {
  /** Server-rendered logo, passed as a slot so it stays out of this bundle. */
  logo: React.ReactNode;
  items: NavNode[];
  ctaLabel: string;
  ctaUrl: string;
  phoneHref: string | null;
  phoneLabel: string | null;
};

function isActive(pathname: string, url: string): boolean {
  if (!url.startsWith("/")) return false;
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

function branchIsActive(pathname: string, node: NavNode): boolean {
  if (isActive(pathname, node.url)) return true;
  return node.children.some((child) => isActive(pathname, child.url));
}

export function SiteNav({ logo, items, ctaLabel, ctaUrl, phoneHref, phoneLabel }: Props) {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const desktopNavRef = useRef<HTMLElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseId = useId();

  // Route change closes everything.
  useEffect(() => {
    setOpenKey(null);
    setMobileOpen(false);
  }, [pathname]);

  // The header gains a solid background once the hero has scrolled away.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the open dropdown or the mobile panel.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (mobileOpen) {
        setMobileOpen(false);
        mobileToggleRef.current?.focus();
      } else if (openKey) {
        const trigger = document.getElementById(`${baseId}-trigger-${openKey}`);
        setOpenKey(null);
        trigger?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, openKey, baseId]);

  // Clicking or focusing outside the desktop nav closes the dropdown.
  useEffect(() => {
    if (!openKey) return;
    const onAway = (event: Event) => {
      const target = event.target as Node | null;
      if (target && desktopNavRef.current && !desktopNavRef.current.contains(target)) {
        setOpenKey(null);
      }
    };
    document.addEventListener("pointerdown", onAway);
    document.addEventListener("focusin", onAway);
    return () => {
      document.removeEventListener("pointerdown", onAway);
      document.removeEventListener("focusin", onAway);
    };
  }, [openKey]);

  // Lock background scroll and trap focus while the mobile panel is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = mobilePanelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !focusables || focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel?.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      panel?.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // A short grace period stops the panel vanishing while the pointer crosses
  // the gap between the trigger and the panel.
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenKey(null), 140);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  return (
    <>
      <div
        className={cn(
          "transition-colors duration-500",
          "bg-paper border-b",
          scrolled || mobileOpen
            ? "border-mist-line shadow-[0_1px_20px_-12px_rgb(11_74_36/0.45)]"
            : "border-transparent",
        )}
      >
        <div className="shell-wide flex h-[72px] items-center gap-3 lg:h-20 lg:gap-6">
          {/* Mobile trigger ------------------------------------------------ */}
          <button
            ref={mobileToggleRef}
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls={`${baseId}-mobile`}
            className="text-on-light -ml-2 inline-flex items-center rounded-xs p-2 lg:hidden"
          >
            {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          </button>

          <div className="shrink-0">{logo}</div>

          {/* Desktop navigation ------------------------------------------- */}
          <nav
            ref={desktopNavRef}
            aria-label="Primary"
            className="ml-4 hidden xl:ml-8 lg:flex lg:items-center lg:gap-0.5"
          >
            {items.map((item) => {
              const hasChildren = item.children.length > 0;
              const active = branchIsActive(pathname, item);
              const panelId = `${baseId}-panel-${item.id}`;
              const triggerId = `${baseId}-trigger-${item.id}`;

              if (!hasChildren) {
                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-xs px-3 py-2 text-small transition-colors duration-200",
                      active ? "text-brand-dim" : "text-on-light-muted hover:text-brand-dim",
                    )}
                  >
                    {item.label}
                    {active ? (
                      <span className="bg-brand-dim absolute inset-x-3 -bottom-0.5 h-px" aria-hidden="true" />
                    ) : null}
                  </Link>
                );
              }

              const open = openKey === item.id;

              return (
                <div
                  key={item.id}
                  className="relative"
                  onPointerEnter={() => {
                    cancelClose();
                    setOpenKey(item.id);
                  }}
                  onPointerLeave={scheduleClose}
                >
                  <button
                    type="button"
                    id={triggerId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    aria-haspopup="true"
                    onClick={() => setOpenKey(open ? null : item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setOpenKey(item.id);
                        requestAnimationFrame(() => {
                          document
                            .getElementById(panelId)
                            ?.querySelector<HTMLAnchorElement>("a[href]")
                            ?.focus();
                        });
                      }
                    }}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-xs px-3 py-2 text-small transition-colors duration-200",
                      active || open ? "text-brand-dim" : "text-on-light-muted hover:text-brand-dim",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={cn("transition-transform duration-300", open && "rotate-180")}
                    />
                    {active ? (
                      <span className="bg-brand absolute inset-x-3 -bottom-0.5 h-px" aria-hidden="true" />
                    ) : null}
                  </button>

                  <div
                    id={panelId}
                    role="group"
                    aria-labelledby={triggerId}
                    hidden={!open}
                    className={cn(
                      "bg-paper border-mist-line absolute top-full left-0 z-50 mt-1 w-[min(26rem,calc(100vw-3rem))]",
                      "rounded-md border p-2 shadow-[0_26px_60px_-28px_rgb(11_74_36/0.35)]",
                    )}
                  >
                    <ul className="grid gap-0.5">
                      {item.children.map((child) => {
                        const childActive = isActive(pathname, child.url);
                        return (
                          <li key={child.id}>
                            <Link
                              href={child.url}
                              target={child.openInNewTab ? "_blank" : undefined}
                              rel={child.openInNewTab ? "noopener noreferrer" : undefined}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "group/item block rounded-xs px-3 py-2.5 transition-colors duration-200",
                                childActive ? "bg-brand-wash" : "hover:bg-mist",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-small block transition-colors",
                                  childActive
                                    ? "text-brand-dim"
                                    : "text-on-light group-hover/item:text-brand-dim",
                                )}
                              >
                                {child.label}
                              </span>
                              {child.description ? (
                                <span className="text-on-light-faint text-micro mt-0.5 block">
                                  {child.description}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Right-hand actions -------------------------------------------- */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="text-on-light-muted hover:text-brand-dim hidden items-center gap-2 rounded-xs px-2 py-2 text-small transition-colors sm:inline-flex"
              >
                <Phone size={15} strokeWidth={1.75} aria-hidden="true" />
                <span className="tabular hidden xl:inline">{phoneLabel}</span>
                <span className="sr-only xl:hidden">Call {phoneLabel}</span>
              </a>
            ) : null}
            <Link href={ctaUrl} className="btn btn-brand btn-sm sm:btn">
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile panel ------------------------------------------------------ */}
      <div
        id={`${baseId}-mobile`}
        ref={mobilePanelRef}
        hidden={!mobileOpen}
        className="bg-paper border-mist-line fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto border-t lg:hidden"
      >
        <nav aria-label="Primary mobile" className="shell py-8">
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.id}>
                <MobileNavItem item={item} pathname={pathname} />
              </li>
            ))}
          </ul>

          {phoneHref ? (
            <a href={phoneHref} className="btn btn-outline-dark mt-8 w-full">
              <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
              {phoneLabel}
            </a>
          ) : null}
          <Link href={ctaUrl} className="btn btn-brand mt-3 w-full">
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </>
  );
}

function MobileNavItem({ item, pathname }: { item: NavNode; pathname: string }) {
  const active = branchIsActive(pathname, item);
  const [open, setOpen] = useState(active);
  const panelId = `mobile-sub-${item.id}`;

  if (item.children.length === 0) {
    return (
      <Link
        href={item.url}
        aria-current={isActive(pathname, item.url) ? "page" : undefined}
        className={cn(
          "border-mist-line block border-b py-3.5 font-display text-title",
          isActive(pathname, item.url) ? "text-brand-dim" : "text-on-light",
        )}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="border-mist-line border-b">
      <div className="flex items-center justify-between">
        <Link
          href={item.url}
          className={cn("font-display text-title py-3.5", active ? "text-brand-dim" : "text-on-light")}
        >
          {item.label}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="text-on-light-muted -mr-2 rounded-xs p-2"
        >
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={cn("transition-transform duration-300", open && "rotate-180")}
          />
          <span className="sr-only">
            {open ? `Hide ${item.label} links` : `Show ${item.label} links`}
          </span>
        </button>
      </div>
      <ul id={panelId} hidden={!open} className="grid gap-0.5 pb-4 pl-1">
        {item.children.map((child) => (
          <li key={child.id}>
            <Link
              href={child.url}
              aria-current={isActive(pathname, child.url) ? "page" : undefined}
              className={cn(
                "block py-2 text-small",
                isActive(pathname, child.url)
                  ? "text-brand-dim"
                  : "text-on-light-muted hover:text-brand-dim",
              )}
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
