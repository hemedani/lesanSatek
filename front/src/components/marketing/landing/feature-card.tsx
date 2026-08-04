import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="glass-card group relative rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-electric-iris/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 shadow-[0_0_56px_-16px_rgba(102,58,243,0.45)] transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative flex size-11 items-center justify-center rounded-xl border border-electric-iris/20 bg-gradient-to-br from-electric-iris/20 to-electric-iris/5 text-electric-iris">
        <Icon className="size-5" />
      </div>
      <h3 className="relative mt-4 text-base font-semibold text-glacier">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-fog">{description}</p>
    </div>
  )
}
