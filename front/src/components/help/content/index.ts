import type { HelpTopic } from "@/components/help/help-topic"

import { docTopics } from "@/components/help/content/doc"
import { adminTopics } from "@/components/help/content/admin"
import { processTopics } from "@/components/help/content/process"
import { wareTopics } from "@/components/help/content/ware"
import { inventoryTopics } from "@/components/help/content/inventory"
import { financeTopics } from "@/components/help/content/finance"
import { geoTopics } from "@/components/help/content/geo"
import { orgheadTopics } from "@/components/help/content/orghead"
import { unitheadTopics } from "@/components/help/content/unithead"
import { storeheadTopics } from "@/components/help/content/storehead"
import { requestsTopics } from "@/components/help/content/requests"
import { adminExtraTopics } from "@/components/help/content/admin-extra"

const topics: Record<string, HelpTopic> = {}
for (const topic of [...docTopics, ...adminTopics, ...processTopics, ...wareTopics, ...inventoryTopics, ...financeTopics, ...geoTopics, ...orgheadTopics, ...unitheadTopics, ...storeheadTopics, ...requestsTopics, ...adminExtraTopics]) {
  topics[topic.id] = topic
}

export function getHelpTopic(id: string): HelpTopic | undefined {
  return topics[id]
}

export function getHelpTopicTitles(): Record<string, string> {
  const titles: Record<string, string> = {}
  for (const topic of Object.values(topics)) {
    titles[topic.id] = topic.title
  }
  return titles
}

export { topics as helpTopics }
