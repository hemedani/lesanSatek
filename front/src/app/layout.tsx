import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const estedad = localFont({
  src: "../../public/fonts/Estedad/Estedad[wght].woff2",
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ساتک",
  description: "سامانه مدیریت فرآیندهای سازمانی",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className={`h-full antialiased dark ${estedad.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  )
}
