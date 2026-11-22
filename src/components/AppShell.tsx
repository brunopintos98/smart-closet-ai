"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CircleUserRound, Shirt, ShoppingBag, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { copy } from "@/copy/es-AR";
import { ProfileSheet } from "./ProfileSheet";
import { StorageWarning } from "./StorageWarning";
import { ToastProvider } from "./Toast";

const NAV = [
  { href: "/", label: copy.nav.studio, Icon: Sparkles },
  { href: "/wardrobe", label: copy.nav.wardrobe, Icon: Shirt },
  { href: "/saved", label: copy.nav.saved, Icon: Bookmark },
  { href: "/shopping", label: copy.nav.shopping, Icon: ShoppingBag },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <ToastProvider>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="font-serif text-lg tracking-tight">
            Smart Closet <span className="italic text-accent">AI</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Secciones">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  isActive(pathname, href) ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="btn btn-ghost -mr-2 rounded-full p-2"
            aria-label={copy.profile.open}
          >
            <CircleUserRound className="size-6" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <StorageWarning />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 sm:pb-12">{children}</main>

      <footer className="mx-auto mb-24 w-full max-w-3xl px-4 pb-6 text-xs text-muted sm:mb-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span>{copy.footer.project}</span>
          <span className="flex gap-4">
            <Link href="/about" className="underline underline-offset-2 hover:text-ink">
              {copy.footer.about}
            </Link>
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
              {copy.weather.attribution}
            </a>
          </span>
        </div>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        aria-label="Secciones"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active ? "text-ink" : "text-muted"}`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2 : 1.5} />
                  <span className={active ? "font-medium" : ""}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </ToastProvider>
  );
}
