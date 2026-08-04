interface StepCardProps {
  number: string
  title: string
  description: string
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="relative text-center">
      <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
        <span
          aria-hidden
          className="absolute select-none text-7xl font-bold text-electric-iris opacity-50 blur-xl"
        >
          {number}
        </span>
        <span className="relative text-5xl font-bold tracking-tight text-electric-iris drop-shadow-[0_0_28px_rgba(102,58,243,0.5)]">
          {number}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-glacier">{title}</h3>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-fog">{description}</p>
    </div>
  )
}
