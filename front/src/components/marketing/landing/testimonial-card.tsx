import { Quote, Star } from "lucide-react"

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  company: string
  rating: number
}

export function TestimonialCard({ quote, author, role, company, rating }: TestimonialCardProps) {
  const initials = author
    .split(" ")
    .map((part) => part[0])
    .join("")

  return (
    <figure className="glass-card relative flex h-full flex-col rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
      <Quote aria-hidden className="absolute top-5 end-5 size-8 text-electric-iris/15" />
      <div className="flex gap-0.5" aria-label={`${rating} از ۵ ستاره`}>
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 text-sm italic leading-relaxed text-moonlight">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-white/[0.04] pt-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric-iris to-violet-500 text-xs font-bold text-white shadow-[0_0_20px_-6px_rgba(102,58,243,0.6)]">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-glacier">{author}</p>
          <p className="mt-0.5 truncate text-[11px] text-fog">
            {role} · {company}
          </p>
        </div>
      </figcaption>
    </figure>
  )
}
