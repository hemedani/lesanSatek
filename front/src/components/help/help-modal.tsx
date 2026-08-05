"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Camera, ChevronLeft, ExternalLink } from "lucide-react"

import { RichText } from "@/components/help/rich-text"
import type { HelpTopic } from "@/components/help/help-topic"
import { getHelpTopic, getHelpTopicTitles } from "@/components/help/content"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  topicId: string
}

function HelpModal({ isOpen, onClose, topicId }: HelpModalProps) {
  const [currentId, setCurrentId] = React.useState(topicId)
  const topicTitles = React.useMemo(() => getHelpTopicTitles(), [])

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setCurrentId(topicId)
    } else {
      onClose()
    }
  }

  const topic: HelpTopic | undefined = getHelpTopic(currentId)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-4xl sm:max-w-4xl gap-0 overflow-hidden p-0"
        showCloseButton
      >
        <DialogHeader className="mx-0 mt-0 gap-2.5 border-b border-steel-border/20 px-6 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/15 ring-1 ring-electric-iris/30">
              <BookOpen className="size-5 text-electric-iris" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-subheading font-semibold text-glacier">
                {topic?.title ?? "راهنما"}
              </DialogTitle>
              {topic?.description && (
                <p className="mt-1 text-body-sm text-fog/80">{topic.description}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-6">
          {!topic ? (
            <p className="text-body-sm text-fog">
              محتوای راهنما برای این بخش هنوز آماده نشده است.
            </p>
          ) : (
            <div className="space-y-8">
              {topic.sections.map((section, index) => (
                <section key={index} className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-4 w-0.5 rounded-full bg-electric-iris"
                    />
                    <h3 className="text-body font-semibold text-ice">{section.title}</h3>
                  </div>

                  {section.screenshot && (
                    <div className="overflow-hidden rounded-xl border border-steel-border/30 bg-black/20">
                      <div className="flex flex-col items-center gap-1.5 p-5 text-center">
                        <Camera className="size-5 text-pebble/50" />
                        <p className="text-body-sm text-fog/60">
                          📸 {section.screenshot.placeholder}
                        </p>
                        <p className="text-caption text-pebble/40" dir="ltr">
                          /public/help/{section.screenshot.path}.png
                        </p>
                      </div>
                    </div>
                  )}

                  <RichText content={section.content} />
                </section>
              ))}

              {topic.relatedTopics && topic.relatedTopics.length > 0 && (
                <div className="space-y-3 border-t border-steel-border/20 pt-5">
                  <p className="text-body-sm text-fog">مطالب مرتبط:</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.relatedTopics.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCurrentId(id)}
                        className="inline-flex items-center gap-1 rounded-sm border border-steel-border/40 bg-white/[0.02] px-2.5 py-1.5 text-xs text-frost-link transition-colors hover:border-frost-link/40 hover:bg-electric-iris/10 hover:text-glacier"
                      >
                        <ChevronLeft className="size-3.5" />
                        {topicTitles[id] ?? "مطالب مرتبط"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-steel-border/20 px-6 py-4">
          <p className="flex items-center justify-center gap-1.5 text-body-sm text-fog">
            نیاز به کمک بیشتری دارید؟
            <Link
              href="/doc"
              className={cn(
                "inline-flex items-center gap-1 text-frost-link transition-colors hover:text-glacier"
              )}
            >
              مراجعه به مستندات کامل
              <ExternalLink className="size-3.5" />
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { HelpModal }
