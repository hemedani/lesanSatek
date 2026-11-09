import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const estedad = localFont({
  src: [
    {
      path: "../../public/fonts/Estedad/Statics/webfonts/Estedad-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Estedad/Statics/webfonts/Estedad-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Estedad/Statics/webfonts/Estedad-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Estedad/Statics/webfonts/Estedad-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Estedad/Statics/webfonts/Estedad-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
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
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  )
}
