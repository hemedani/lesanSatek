import Link from "next/link"

const linkGroups = [
  {
    title: "محصول",
    links: [
      { label: "ویژگی‌ها", href: "/#ویژگی‌ها" },
      { label: "قیمت‌گذاری", href: "/pricing" },
      { label: "مستندات", href: "/docs" },
      { label: "تغییرات", href: "/changelog" },
    ],
  },
  {
    title: "منابع",
    links: [
      { label: "وبلاگ", href: "/blog" },
      { label: "راهنما", href: "/docs" },
      { label: "مستندات API", href: "/docs" },
      { label: "سوالات متداول", href: "/faq" },
    ],
  },
  {
    title: "شرکت",
    links: [
      { label: "درباره ما", href: "/about" },
      { label: "فرصت‌های شغلی", href: "/about" },
      { label: "حریم خصوصی", href: "/privacy" },
      { label: "قوانین", href: "/terms" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.04]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-electric-iris to-violet-500">
                <span className="text-[10px] font-bold text-white">س</span>
              </span>
              <span className="text-sm font-semibold text-glacier">ساتک</span>
            </Link>
            <p className="text-xs text-fog/60 leading-relaxed max-w-xs">
              سامانه مدیریت فرآیندهای سازمانی — از درخواست خرید تا پرداخت، یکپارچه و هوشمند.
            </p>
          </div>
          {linkGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-glacier mb-4 tracking-wider">{group.title}</p>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-xs text-fog hover:text-glacier transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-white/[0.04]">
          <p className="text-[11px] text-fog/40">
            © ۱۴۰۴ ساتک — تمام حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-3">
            {[
              <svg key="linkedin" className="size-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
              <svg key="twitter" className="size-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
              <svg key="telegram" className="size-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
            ].map((icon, i) => (
              <a
                key={i}
                href="/"
                className="flex size-7 items-center justify-center rounded-md text-fog/40 hover:text-frost-link transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
