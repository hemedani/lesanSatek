import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 mb-6 pb-4 border-b border-steel-border/50 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1 className="text-heading-sm font-medium text-glacier">{title}</h1>
        {description && (
          <p className="text-sm text-fog mt-1">{description}</p>
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
