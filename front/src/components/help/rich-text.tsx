import * as React from "react"

import { cn } from "@/lib/utils"

function renderInline(text: string, keyBase: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, index) => {
    const key = `${keyBase}-${index}`
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-ice">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded-sm bg-white/[0.05] px-1 py-0.5 font-mono text-xs text-frost-link"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

interface OrderedItem {
  num: string
  title: string
  body: string[]
}

const ORDERED_HEADER = /^\*\*\s*([۰-۹0-9]+)\s*[\.٫]\s*([^*]*?)\s*\*\*:?\s?(.*)$/

function parseOrderedBlock(lines: string[]): OrderedItem[] {
  const items: OrderedItem[] = []
  for (const rawLine of lines) {
    const match = rawLine.trim().match(ORDERED_HEADER)
    if (match) {
      items.push({ num: match[1], title: match[2], body: match[3] ? [match[3]] : [] })
    } else if (items.length > 0) {
      items[items.length - 1].body.push(rawLine)
    } else {
      items.push({ num: "", title: "", body: [rawLine] })
    }
  }
  return items
}

export function RichText({ content, className }: { content: string; className?: string }) {
  const blocks = content
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").filter((line) => line.trim().length > 0))
    .filter((lines) => lines.length > 0)

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((lines, blockIndex) => {
        const keyBase = `b${blockIndex}`
        const isBullet = lines.every((line) => /^\s*[-•✓✔]\s+/.test(line.trim()))
        const isOrdered = lines.some((line) => ORDERED_HEADER.test(line.trim()))

        if (isBullet) {
          return (
            <ul key={keyBase} className="space-y-2">
              {lines.map((line, index) => (
                <li
                  key={`${keyBase}-${index}`}
                  className="flex gap-2 text-body-sm leading-6 text-moonlight/90"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-electric-iris/70"
                  />
                  <span>{renderInline(line.trim().replace(/^\s*[-•✓✔]\s+/, ""), `${keyBase}-${index}`)}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (isOrdered) {
          const items = parseOrderedBlock(lines)
          return (
            <ol key={keyBase} className="space-y-4">
              {items.map((item, index) => (
                <li key={`${keyBase}-${index}`} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-electric-iris/15 text-xs font-bold text-electric-iris"
                  >
                    {item.num}
                  </span>
                  <div className="min-w-0 space-y-2">
                    {item.title && (
                      <p className="font-semibold leading-6 text-ice">{renderInline(item.title, `${keyBase}-${index}-t`)}</p>
                    )}
                    {item.body.map((bodyLine, bodyIndex) => {
                      if (/^\s*[-•✓✔]\s+/.test(bodyLine.trim())) {
                        return (
                          <p key={`${keyBase}-${index}-${bodyIndex}`} className="flex gap-2 text-body-sm leading-6 text-moonlight/90">
                            <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-pebble/60" />
                            <span>{renderInline(bodyLine.trim().replace(/^\s*[-•✓✔]\s+/, ""), `${keyBase}-${index}-${bodyIndex}`)}</span>
                          </p>
                        )
                      }
                      return (
                        <p key={`${keyBase}-${index}-${bodyIndex}`} className="text-body-sm leading-7 text-moonlight/90">
                          {renderInline(bodyLine, `${keyBase}-${index}-${bodyIndex}`)}
                        </p>
                      )
                    })}
                  </div>
                </li>
              ))}
            </ol>
          )
        }

        return (
          <p key={keyBase} className="text-body-sm leading-7 text-moonlight/90">
            {renderInline(lines.join(" "), `p-${blockIndex}`)}
          </p>
        )
      })}
    </div>
  )
}
