import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 mb-8 pb-5 border-b border-steel-border/30 sm:flex-row sm:items-center sm:justify-between sm:gap-0", className)}>
      <div className="space-y-2.5">
        <h1 className="text-heading font-medium text-glacier tracking-tight leading-tight">{title}</h1>
        {description && (
          <p className="text-body text-fog/70 leading-relaxed">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {children}
        </div>
      )}
    </div>
  )
}

export { PageHeader }
