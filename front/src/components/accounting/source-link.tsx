import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { SOURCE_TYPE_LABELS, labelOf } from "@/components/accounting/labels"

interface SourceLinkProps {
  sourceType?: string
  sourceId?: string
  mode: "admin" | "unit-head"
}

const ROUTES: Record<"admin" | "unit-head", Record<string, string>> = {
  admin: {
    goodsReceipt: "/admin/goods-receipts",
    consumption: "/admin/consumption",
    paymentOrder: "/admin/payment-orders",
  },
  "unit-head": {
    goodsReceipt: "/unit-head/goods-receipt",
    consumption: "/unit-head/consumption",
    paymentOrder: "/unit-head/finance/payment-orders",
  },
}

function SourceLink({ sourceType, sourceId, mode }: SourceLinkProps) {
  if (!sourceType) return <span className="text-fog/60">—</span>

  const label = labelOf(SOURCE_TYPE_LABELS, sourceType)
  const base = ROUTES[mode][sourceType]

  if (!base || !sourceId) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 text-fog/70">
        <span>{label}</span>
        {sourceId && (
          <span dir="ltr" className="font-mono text-xs text-fog/45">
            {sourceId}
          </span>
        )}
      </span>
    )
  }

  return (
    <Link
      href={`${base}/${sourceId}`}
      className="inline-flex items-center gap-1.5 text-frost-link transition-colors hover:text-electric-iris"
    >
      <span>{label}</span>
      <ExternalLink className="size-3.5" />
    </Link>
  )
}

export { SourceLink }
