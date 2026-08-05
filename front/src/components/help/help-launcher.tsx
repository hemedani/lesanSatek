"use client"

import * as React from "react"

import { HelpButton } from "@/components/help/help-button"
import { HelpModal } from "@/components/help/help-modal"

interface HelpLauncherProps {
  topicId: string
  tooltip?: string
}

function HelpLauncher({ topicId, tooltip }: HelpLauncherProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      <HelpButton
        tooltip={tooltip}
        onClick={() => setIsOpen(true)}
      />
      <HelpModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        topicId={topicId}
      />
    </>
  )
}

export { HelpLauncher }
