"use client"

import { ArrowLeft, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navLinks = [
  { label: "خانه", href: "/" },
  { label: "ویژگی‌ها", href: "/#ویژگی‌ها", isHash: true },
  { label: "قیمت‌گذاری", href: "/pricing" },
  { label: "وبلاگ", href: "/blog" },
  { label: "سوالات", href: "/faq" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس", href: "/contact" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, isHash?: boolean) => {
    if (isHash) return false
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="glass-header fixed top-0 inset-x-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden flex size-7 items-center justify-center rounded-md text-fog hover:text-glacier transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="منوی ناوبری"
            >
              <Menu className="size-4" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-electric-iris to-violet-500">
                <span className="text-xs font-bold text-white">س</span>
              </span>
              <span className="text-sm font-semibold text-glacier">ساتک</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-sm transition-all ${
                  isActive(link.href, link.isHash)
                    ? "text-glacier bg-white/[0.06]"
                    : "text-fog hover:text-glacier hover:bg-white/[0.03]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex h-8 items-center justify-center rounded-sm border border-steel-border/60 bg-transparent px-3 text-xs font-medium text-moonlight transition-all hover:border-frost-link/30 hover:text-glacier"
            >
              ورود
            </Link>
            <Link
              href="/register"
              className="inline-flex h-8 items-center justify-center rounded-sm bg-electric-iris px-4 text-xs font-medium text-white transition-all hover:bg-electric-iris/80 gap-1.5"
            >
              شروع کنید
              <ArrowLeft className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-midnight-ink/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 inset-x-0 bg-[#05060f] border-b border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-electric-iris to-violet-500">
                  <span className="text-xs font-bold text-white">س</span>
                </span>
                <span className="text-sm font-semibold text-glacier">ساتک</span>
              </Link>
              <button
                className="flex size-7 items-center justify-center rounded-md text-fog hover:text-glacier transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="بستن منو"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 text-sm rounded-sm transition-all ${
                    isActive(link.href, link.isHash)
                      ? "text-glacier bg-white/[0.06]"
                      : "text-fog hover:text-glacier hover:bg-white/[0.03]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/[0.06]">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 inline-flex h-9 items-center justify-center rounded-sm border border-steel-border/60 bg-transparent px-3 text-xs font-medium text-moonlight transition-all hover:border-frost-link/30 hover:text-glacier"
              >
                ورود
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 inline-flex h-9 items-center justify-center rounded-sm bg-electric-iris px-3 text-xs font-medium text-white transition-all hover:bg-electric-iris/80 gap-1.5"
              >
                شروع کنید
                <ArrowLeft className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
