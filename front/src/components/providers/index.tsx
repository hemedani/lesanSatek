"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/providers/theme-provider"

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider delay={0}>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  )
}

export { Providers }
