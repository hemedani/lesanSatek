import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:bg-primary/85 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_0_24px_-6px_rgba(102,58,243,0.3)] active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        outline:
          "border-steel-border/60 bg-transparent text-moonlight hover:border-frost-link/30 hover:bg-white/[0.03] hover:text-glacier hover:shadow-subtle aria-expanded:bg-white/[0.03] aria-expanded:text-foreground",
        secondary:
          "bg-graphite-plate text-moonlight hover:bg-[#363b47] hover:text-glacier hover:shadow-subtle aria-expanded:bg-graphite-plate aria-expanded:text-foreground",
        ghost:
          "shadow-subtle text-moonlight hover:text-glacier hover:bg-white/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(186,215,247,0.12)] aria-expanded:bg-white/[0.03] aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/10 hover:bg-destructive/20 hover:border-destructive/20 hover:shadow-[inset_0_0_0_1px_rgba(228,109,76,0.15)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-frost-link underline-offset-4 hover:underline hover:text-glacier",
      },
      size: {
        default:
          "h-10 gap-1.5 px-3 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-sm px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-4 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-sm in-data-[slot=button-group]:rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-sm in-data-[slot=button-group]:rounded-sm",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
