import Link from "next/link"
import { ArrowRight, BookOpen, Camera } from "lucide-react"

import type { HelpTopic } from "@/components/help/help-topic"
import { RichText } from "@/components/help/rich-text"
import { getHelpTopicTitles } from "@/components/help/content"

interface DocArticleProps {
  topic: HelpTopic
}

function DocArticle({ topic }: DocArticleProps) {
  const topicTitles = getHelpTopicTitles()

  return (
    <article className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/doc"
          className="inline-flex items-center gap-1.5 text-body-sm text-fog transition-colors hover:text-frost-link"
        >
          <ArrowRight className="size-4" />
          بازگشت به مستندات
        </Link>
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-electric-iris/15 ring-1 ring-electric-iris/30">
            <BookOpen className="size-6 text-electric-iris" />
          </span>
          <div className="min-w-0">
            <h1 className="text-heading-sm font-semibold leading-tight text-glacier sm:text-heading">
              {topic.title}
            </h1>
            {topic.description && (
              <p className="mt-2 text-body text-fog/80 leading-relaxed">{topic.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-10">
        {topic.sections.map((section, index) => (
          <section key={index} className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-electric-iris/15 text-caption font-bold text-electric-iris"
              >
                {index + 1}
              </span>
              <h2 className="text-subheading font-semibold text-glacier">{section.title}</h2>
            </div>

            {section.screenshot && (
              <div className="overflow-hidden rounded-xl border border-steel-border/30 bg-black/20">
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  <Camera className="size-5 text-pebble/50" />
                  <p className="text-body-sm text-fog/70">{section.screenshot.placeholder}</p>
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
          <div className="space-y-3 border-t border-steel-border/20 pt-6">
            <p className="text-body-sm text-fog">مطالب مرتبط:</p>
            <div className="flex flex-wrap gap-2">
              {topic.relatedTopics.map((id) => (
                <Link
                  key={id}
                  href={id.startsWith("doc-") ? `/doc/${id.replace("doc-", "")}` : "/doc"}
                  className="inline-flex items-center gap-1 rounded-sm border border-steel-border/40 bg-white/[0.02] px-2.5 py-1.5 text-xs text-frost-link transition-colors hover:border-frost-link/40 hover:bg-electric-iris/10 hover:text-glacier"
                >
                  {topicTitles[id] ?? "مطالب مرتبط"}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export { DocArticle }
