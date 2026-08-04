import type { LucideIcon } from "lucide-react"

interface AuthCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  children: React.ReactNode
}

function AuthCard({ icon: Icon, title, subtitle, children }: AuthCardProps) {
  return (
    <div className="glass-card relative overflow-hidden rounded-2xl p-7 md:p-9 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-5 motion-safe:duration-500 motion-safe:ease-out">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-frost-link/40 to-transparent"
      />

      <div className="relative mb-8 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-electric-iris/15 shadow-[inset_0_0_0_1px_rgba(102,58,243,0.25),0_0_28px_-8px_rgba(102,58,243,0.55)]">
          <Icon className="size-7 text-electric-iris" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-glacier md:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-moonlight/80">{subtitle}</p>
      </div>

      {children}
    </div>
  )
}

export { AuthCard }