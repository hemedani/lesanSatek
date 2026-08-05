import { DocShell } from "@/components/help/doc-shell"
import { DocArticle } from "@/components/help/doc-article"
import { getHelpTopic } from "@/components/help/content"

export default function ProcessesPage() {
  const topic = getHelpTopic("doc-processes")
  if (!topic) return null
  return (
    <DocShell>
      <DocArticle topic={topic} />
    </DocShell>
  )
}
