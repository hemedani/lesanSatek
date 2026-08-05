"use client"

import { HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HelpButtonProps {
  tooltip?: string
  onClick: () => void
}

function HelpButton({ tooltip = "راهنما", onClick }: HelpButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={tooltip}
            className="size-9 text-fog/60 hover:border-frost-link/20 hover:text-frost-link hover:bg-electric-iris/10"
            onClick={onClick}
          />
        }
      >
        <HelpCircle className="size-5" />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export { HelpButton }
