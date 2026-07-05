import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  link?: boolean
}

function Logo({ className, link = true }: LogoProps) {
  const content = (
    <span className={cn("text-base font-semibold text-glacier tracking-tight", className)}>
      ساتک
    </span>
  )

  if (link) {
    return <Link href="/">{content}</Link>
  }

  return content
}

export { Logo }
