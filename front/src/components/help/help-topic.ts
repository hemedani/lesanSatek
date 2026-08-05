export interface HelpSection {
  title: string
  content: string
  screenshot?: {
    placeholder: string
    alt: string
    path: string
  }
}

export interface HelpTopic {
  id: string
  title: string
  description?: string
  sections: HelpSection[]
  relatedTopics?: string[]
}
