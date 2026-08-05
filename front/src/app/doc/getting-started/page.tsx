import { DocShell } from "@/components/help/doc-shell"
import { DocArticle } from "@/components/help/doc-article"
import { getHelpTopic } from "@/components/help/content"

export default function GettingStartedPage() {
  const topic = getHelpTopic("doc-getting-started")
  if (!topic) return null
  return (
    <DocShell>
      <DocArticle topic={topic} />
    </DocShell>
  )
}
